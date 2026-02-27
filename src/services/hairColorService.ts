/**
 * 실시간 머리색 변경 서비스
 * - Google MediaPipe @mediapipe/tasks-vision ImageSegmenter (hair_segmenter 모델)
 * - Canvas에서 소프트 마스크 기반 HSL 색상 변경
 */

// === 타입 정의 ===
export interface HairMaskResult {
    mask: Uint8Array; // 0~255 소프트 마스크
    width: number;
    height: number;
}

// MediaPipe 모델 캐시
let imageSegmenter: unknown = null;
let isModelLoading = false;

// MediaPipe 모델 CDN URL
const HAIR_MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite";
const WASM_CDN =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

/**
 * MediaPipe ImageSegmenter 모델 로드 (최초 1회)
 */
async function loadModel() {
    if (imageSegmenter) return imageSegmenter;
    if (isModelLoading) {
        while (isModelLoading) {
            await new Promise((r) => setTimeout(r, 200));
        }
        return imageSegmenter;
    }

    isModelLoading = true;
    try {
        const { ImageSegmenter, FilesetResolver } = await import(
            "@mediapipe/tasks-vision"
        );

        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

        imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: HAIR_MODEL_URL,
                delegate: "GPU", // WebGL GPU 가속
            },
            outputConfidenceMasks: true,
            outputCategoryMask: false,
            runningMode: "IMAGE",
        });

        return imageSegmenter;
    } catch (err) {
        console.error("[MediaPipe] 모델 로드 실패:", err);
        throw err;
    } finally {
        isModelLoading = false;
    }
}

/**
 * 모델 사전 로딩 (백그라운드에서 미리 다운로드)
 */
export function preloadModel() {
    if (imageSegmenter || isModelLoading) return;
    loadModel().catch(() => {
        // 사전 로딩 실패해도 무시
    });
}

/**
 * 이미지에서 머리카락 영역 마스크 추출 (MediaPipe 기반)
 */
export async function extractHairMask(
    imageDataUrl: string,
    onProgress?: (msg: string) => void
): Promise<HairMaskResult> {
    onProgress?.("AI 모델 로딩 중...");
    const segmenter = await loadModel();

    onProgress?.("머리카락 영역 분석 중...");

    // dataURL → HTMLImageElement
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = imageDataUrl;
    });

    // Canvas에 그려서 세그멘테이션 실행
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context 생성 실패");
    ctx.drawImage(img, 0, 0);

    // MediaPipe 세그멘테이션 실행
    const segmenterTyped = segmenter as {
        segment: (
            image: HTMLCanvasElement,
            callback: (result: {
                confidenceMasks?: Array<{ getAsFloat32Array: () => Float32Array; width: number; height: number }>;
            }) => void
        ) => void;
    };

    const result = await new Promise<HairMaskResult>((resolve, reject) => {
        try {
            segmenterTyped.segment(canvas, (segResult) => {
                const masks = segResult.confidenceMasks;
                if (!masks || masks.length === 0) {
                    reject(new Error("머리카락 영역을 감지하지 못했습니다."));
                    return;
                }

                // hair_segmenter 모델: masks[0]=배경, masks[1]=머리카락
                // 마스크가 1개만 있으면 그걸 사용, 2개 이상이면 마지막(=hair)
                const hairMask = masks.length >= 2 ? masks[1] : masks[masks.length - 1];
                const floatData = hairMask.getAsFloat32Array();
                const width = canvas.width;
                const height = canvas.height;

                // Float32(0~1) → Uint8(0~255) 소프트 마스크
                const softMask = new Uint8Array(floatData.length);
                for (let i = 0; i < floatData.length; i++) {
                    softMask[i] = Math.round(
                        Math.min(1, Math.max(0, floatData[i])) * 255
                    );
                }

                resolve({ mask: softMask, width, height });
            });
        } catch (err) {
            reject(err);
        }
    });

    onProgress?.("완료!");
    return result;
}

// === RGB ↔ HSL 변환 유틸리티 ===

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;

    if (s === 0) {
        const val = Math.round(l * 255);
        return [val, val, val];
    }

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
        Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    ];
}

/**
 * 목표 HEX 색상에서 HSL 추출
 */
function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return rgbToHsl(r, g, b);
}

/**
 * 머리카락 영역만 색상 변경 (Canvas 기반, 실시간)
 * - 소프트 마스크(0~255)를 사용하여 경계를 자연스럽게 블렌딩
 * - 항상 원본 이미지 데이터를 기준으로 적용
 */
export function applyHairColor(
    originalImageData: ImageData,
    hairMask: HairMaskResult,
    targetColorHex: string,
    intensity: number = 85
): ImageData {
    const [targetH, targetS, targetL] = hexToHsl(targetColorHex);
    const { mask, width, height } = hairMask;
    const result = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        width,
        height
    );
    const pixels = result.data;
    const blend = intensity / 100;

    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 0) continue;

        const maskAlpha = mask[i] / 255; // 0~1 소프트 마스크
        const effectiveBlend = blend * maskAlpha;

        const idx = i * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        const [, origS, origL] = rgbToHsl(r, g, b);

        // Hue: 목표 색상으로 직접 교체
        const newH = targetH;
        // Saturation: 목표 채도와 원본 채도를 블렌딩
        const newS = Math.min(100, targetS * effectiveBlend + origS * (1 - effectiveBlend));
        // Lightness: 목표 밝기 방향으로 약간 당기되, 원본 질감 유지
        const lightBias = 0.15;
        const newL = origL * (1 - lightBias * effectiveBlend) + targetL * (lightBias * effectiveBlend);

        const [newR, newG, newB] = hslToRgb(newH, newS, newL);

        // 소프트 마스크 알파 블렌딩
        pixels[idx] = Math.round(newR * effectiveBlend + r * (1 - effectiveBlend));
        pixels[idx + 1] = Math.round(newG * effectiveBlend + g * (1 - effectiveBlend));
        pixels[idx + 2] = Math.round(newB * effectiveBlend + b * (1 - effectiveBlend));
    }

    return result;
}

/**
 * 이미지 URL에서 ImageData 추출
 */
export function imageUrlToImageData(
    imageUrl: string,
    targetWidth: number,
    targetHeight: number
): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas context 생성 실패"));
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            resolve(ctx.getImageData(0, 0, targetWidth, targetHeight));
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

/**
 * ImageData를 dataURL로 변환
 */
export function imageDataToDataUrl(imageData: ImageData): string {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
}
