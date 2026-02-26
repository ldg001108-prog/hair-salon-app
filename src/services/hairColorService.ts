/**
 * 실시간 머리색 변경 서비스
 * - @huggingface/transformers의 Xenova/face-parsing 모델로 헤어 영역 세그멘테이션
 * - Canvas에서 마스크된 영역만 HSL Hue 변경
 */

// === 타입 정의 ===
export interface HairMaskResult {
    mask: Uint8Array; // 1 = hair, 0 = not hair
    width: number;
    height: number;
}

// 모델 캐시
let segmentationPipeline: unknown = null;
let isModelLoading = false;

/**
 * 세그멘테이션 모델 로드 (최초 1회)
 */
async function loadModel() {
    if (segmentationPipeline) return segmentationPipeline;
    if (isModelLoading) {
        // 로딩 중이면 대기
        while (isModelLoading) {
            await new Promise((r) => setTimeout(r, 200));
        }
        return segmentationPipeline;
    }

    isModelLoading = true;
    try {
        // dynamic import로 클라이언트에서만 로드
        const { pipeline } = await import("@huggingface/transformers");
        segmentationPipeline = await pipeline(
            "image-segmentation",
            "Xenova/face-parsing",
            { device: "wasm" }
        );
        return segmentationPipeline;
    } finally {
        isModelLoading = false;
    }
}

/**
 * 이미지에서 머리카락 영역 마스크 추출
 */
export async function extractHairMask(
    imageDataUrl: string,
    onProgress?: (msg: string) => void
): Promise<HairMaskResult> {
    onProgress?.("AI 모델 다운로드 중... (최초 1회만)");
    const segmenter = (await loadModel()) as (
        img: string
    ) => Promise<Array<{ label: string; mask: { data: Float32Array; width: number; height: number } }>>;

    onProgress?.("머리카락 영역 분석 중...");
    const results = await segmenter(imageDataUrl);

    // "hair" 라벨 찾기
    const hairResult = results.find(
        (r) => r.label.toLowerCase() === "hair"
    );

    if (!hairResult || !hairResult.mask) {
        throw new Error("머리카락 영역을 감지하지 못했습니다.");
    }

    const { data, width, height } = hairResult.mask;

    // Float32 mask → Uint8 binary mask (0.5 이상이면 hair)
    const binaryMask = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        binaryMask[i] = data[i] > 0.5 ? 1 : 0;
    }

    onProgress?.("완료!");
    return { mask: binaryMask, width, height };
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
 * Hue를 목표 색상으로 직접 교체하고, 원본의 Lightness를 유지하여 질감 보존
 */
export function applyHairColor(
    originalImageData: ImageData,
    hairMask: HairMaskResult,
    targetColorHex: string,
    intensity: number = 85
): ImageData {
    const [targetH, targetS] = hexToHsl(targetColorHex);
    const { mask, width, height } = hairMask;
    const result = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        width,
        height
    );
    const pixels = result.data;
    const blend = intensity / 100;

    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 0) continue; // 머리카락 아님

        const idx = i * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // RGB → HSL
        const [, origS, origL] = rgbToHsl(r, g, b);

        // Hue: 목표 색상으로 직접 교체 (블렌딩 X, 정확한 색 적용)
        const newH = targetH;
        // Saturation: 목표 채도와 원본 채도를 블렌딩
        const newS = Math.min(100, targetS * blend + origS * (1 - blend));
        // Lightness: 원본 유지 (질감, 그림자, 하이라이트 보존)
        const newL = origL;

        const [newR, newG, newB] = hslToRgb(newH, newS, newL);
        pixels[idx] = newR;
        pixels[idx + 1] = newG;
        pixels[idx + 2] = newB;
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
