/**
 * Gemini AI 헤어스타일 합성 서비스
 * - 사용자 사진의 얼굴은 그대로 유지하면서 머리카락만 자연스럽게 변경
 * - 스타일, 색상, 강도 파라미터 지원
 * - 이미지 리사이징 및 재시도 로직 포함
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// === 타입 정의 ===
export interface HairTransformRequest {
    /** 사용자 사진 (base64 data URL) */
    photoBase64: string;
    /** 헤어스타일 이름 (예: "시크 픽시컷") */
    styleName: string;
    /** 헤어스타일 설명 (선택) */
    styleDescription?: string;
    /** 스타일 참조 이미지 (base64 data URL) — 클라이언트에서 변환하여 전달 */
    styleImageBase64?: string;
    /** 스타일 참조 이미지 URL — 서버 fallback용 */
    styleImageUrl?: string;
    /** 헤어 색상 이름 (예: "Dark Brown") - 없으면 원래 색상 유지 */
    colorName?: string;
    /** 헤어 색상 hex 코드 (예: "#3d2314") */
    colorHex?: string;
    /** 색상 강도 0~100 (기본 85) */
    colorIntensity?: number;
    /** HSL 채도 0~100 */
    colorSaturation?: number;
    /** HSL 명도 0~100 */
    colorLightness?: number;
    /** 스타일 카테고리 (short/medium/long/perm) */
    category?: string;
    /** 성별 (female/male) */
    gender?: "female" | "male";
}

export interface HairTransformResult {
    /** 성공 여부 */
    success: boolean;
    /** 결과 이미지 (base64 data URL) */
    resultImage?: string;
    /** 에러 메시지 */
    error?: string;
}

// === 이미지 리사이징 유틸 (서버사이드) ===
/**
 * base64 이미지 데이터를 리사이징합니다.
 * 서버사이드에서는 Canvas 사용 불가하므로 sharp 없이 base64 크기만 체크합니다.
 * 너무 큰 이미지는 품질을 낮추거나 경고합니다.
 */
function getBase64SizeKB(base64Data: string): number {
    // base64 문자열의 대략적인 바이트 크기 계산
    const padding = (base64Data.match(/=+$/) || [""])[0].length;
    return Math.round((base64Data.length * 3) / 4 - padding) / 1024;
}

// === Hex → 가장 가까운 색상 이름 변환 ===
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getColorDescription(hex: string): string {
    const { h, s, l } = hexToHSL(hex);

    // 무채색 판단
    if (s < 10) {
        if (l < 15) return "jet black";
        if (l < 30) return "very dark charcoal";
        if (l < 45) return "dark gray";
        if (l < 60) return "medium gray";
        if (l < 75) return "light gray";
        if (l < 90) return "silver / platinum";
        return "white / platinum blonde";
    }

    // 톤 설명
    let tone = "";
    if (l < 15) tone = "very dark ";
    else if (l < 30) tone = "dark ";
    else if (l < 45) tone = "medium-dark ";
    else if (l < 55) tone = "medium ";
    else if (l < 70) tone = "light ";
    else if (l < 85) tone = "bright ";
    else tone = "very light / pastel ";

    // 채도 설명
    let satDesc = "";
    if (s < 25) satDesc = "muted ";
    else if (s < 50) satDesc = "soft ";
    else if (s > 80) satDesc = "vivid ";

    // 색상 이름 (hue 범위 기준)
    let colorName = "";
    if (h < 15 || h >= 345) colorName = "red";
    else if (h < 30) colorName = "red-orange";
    else if (h < 45) colorName = "orange";
    else if (h < 60) colorName = "golden / amber";
    else if (h < 75) colorName = "yellow-gold";
    else if (h < 90) colorName = "yellow";
    else if (h < 120) colorName = "yellow-green";
    else if (h < 150) colorName = "green";
    else if (h < 180) colorName = "teal / cyan-green";
    else if (h < 210) colorName = "cyan / aqua";
    else if (h < 240) colorName = "blue";
    else if (h < 270) colorName = "indigo / blue-violet";
    else if (h < 300) colorName = "purple / violet";
    else if (h < 330) colorName = "magenta / pink";
    else colorName = "rose / hot pink";

    // 헤어 색상 컨텍스트 매핑
    if (h >= 15 && h < 45 && l < 40) colorName = "dark brown / chestnut";
    if (h >= 15 && h < 45 && l >= 40 && l < 60) colorName = "warm brown / caramel";
    if (h >= 15 && h < 45 && l >= 60) colorName = "light brown / honey blonde";
    if (h >= 30 && h < 50 && s > 60 && l > 50) colorName = "copper / ginger";
    if (h >= 0 && h < 20 && l < 25) colorName = "dark auburn / burgundy";
    if (h >= 45 && h < 65 && l > 65) colorName = "golden blonde";
    if (h >= 45 && h < 65 && l > 80) colorName = "platinum blonde";

    return `${satDesc}${tone}${colorName}`;
}

// === 프롬프트 빌더 (압축 v2 — 중복 제거, 핵심 집중) ===
function buildHairPrompt(request: HairTransformRequest): string {
    const {
        styleName, styleDescription, colorName, colorHex,
        colorIntensity = 85, colorSaturation, colorLightness,
        category
    } = request;

    const styleInfo = styleDescription
        ? `${styleName} - ${styleDescription}`
        : styleName;

    // 카테고리별 길이
    let lengthLine = "";
    switch (category) {
        case "short": lengthLine = "LENGTH: SHORT — above shoulders, ear-to-jaw (5~20cm). If currently long, CUT IT SHORT."; break;
        case "medium": lengthLine = "LENGTH: MEDIUM — shoulder-length (20~35cm). Adjust from any current length."; break;
        case "long": lengthLine = "LENGTH: LONG — below shoulders to chest (35~60cm+). If currently short, EXTEND IT. #1 priority."; break;
        case "perm": lengthLine = "TEXTURE: PERM — clear, well-defined waves/curls matching the target perm style."; break;
    }

    // 색상 (있을 때만)
    let colorBlock = "COLOR: Keep original hair color unchanged.";
    if (colorHex && colorName && colorName !== "Original") {
        const colorDesc = getColorDescription(colorHex);
        const hsl = hexToHSL(colorHex);
        const sat = colorSaturation ?? hsl.s;
        const light = colorLightness ?? hsl.l;
        const intensityDesc = colorIntensity >= 80 ? "STRONG and VIVID" : colorIntensity >= 50 ? "clearly visible, natural blend" : "subtle tint";
        colorBlock = `COLOR (MUST FOLLOW):
- Target: ${colorDesc} (hex ${colorHex}, HSL ${hsl.h}°/${sat}%/${light}%)
- Intensity: ${colorIntensity}% — ${intensityDesc}
- Apply UNIFORMLY (roots to ends). Do NOT default to brown/black.
- Must look like a PROFESSIONAL salon dye job.`;
    }

    // 참조 이미지 규칙 (있을 때만)
    const hasRef = !!request.styleImageBase64;
    const isMale = request.gender === "male";
    const refBlock = hasRef ? `
REFERENCE IMAGE (2nd image) RULES:
- 2nd image = HAIRSTYLE CATALOG only. Extract ONLY: shape, silhouette, length, volume, texture, bangs, parting, curl pattern, layers.
- The catalog model's FACE DOES NOT EXIST — treat it as a featureless gray oval. Do NOT transfer any facial features, skin marks, or identity.${isMale ? "\n- MALE EXTRA: Male references show distinctive faces. Be EXTRA vigilant — output face must be 100% the client." : ""}
- Reference hair length OVERRIDES category instructions. Match the EXACT body landmark where hair ends (ear/chin/shoulder/chest).
- ALL style details (bangs, parting, volume, layers, texture, curl pattern) come from the reference. The user photo provides ONLY the face.
- Both sides MUST be symmetric in length and volume unless the style explicitly requires asymmetry.
- If hair is occluded by hands/clothing, INFER the style for hidden areas from visible hair + reference.` : "";

    return `ROLE: You are a photo editor. Edit ONLY the hair in the FIRST image. Everything else is LOCKED.

LOCKED (do NOT modify): face, eyes, nose, mouth, jawline, skin tone, skin marks, expression, gaze, ears, neck, body, background, clothing, accessories, frame/crop/composition.
EDITABLE: hair only (style, length, volume, texture, color).

ABSOLUTE RULE #1 — FACE IDENTITY:
The output face must be PIXEL-PERFECT IDENTICAL to Image 1. No smoothing, reshaping, beautifying, or any alteration. Same skin marks (no additions, no removals). Same expression and gaze. If a friend wouldn't instantly recognize the person → FAILED.
${refBlock}

TARGET: ${styleInfo}
${lengthLine}
${colorBlock}

TRANSFORMATION RULES:
1. The new hairstyle MUST be DRAMATICALLY different from the original.
2. Reference image (if provided) is the ULTIMATE AUTHORITY for all hair details.
3. Match target style's bangs, parting, volume, layers, texture, silhouette EXACTLY. Ignore original hair completely.
4. Apply the most STANDARD, TEXTBOOK version of "${styleName}" — no creative variations.
5. Adapt to photo angle (front/side/3-4/back) — transform all visible hair for that angle.
6. Result must be CONSISTENT — same output every time for the same inputs.

FRAME: Same cropping, composition, resolution, aspect ratio as input. Do NOT extend or reveal more body.

QUALITY: Photorealistic, natural (not wig-like), seamless hair-to-skin transition, sharp strand-level detail, matching lighting/shadows, professional salon quality.

Generate the edited photo now.`;
}



// === 재시도 유틸 ===
async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// === 메인 함수 ===
export async function transformHair(
    apiKey: string,
    request: HairTransformRequest
): Promise<HairTransformResult> {
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Gemini 클라이언트 초기화
            const ai = new GoogleGenAI({ apiKey });

            // base64 데이터 추출 (data:image/...;base64, 부분 제거)
            const base64Data = request.photoBase64.replace(
                /^data:image\/\w+;base64,/,
                ""
            );

            // MIME 타입 추출
            const mimeMatch = request.photoBase64.match(/^data:(image\/\w+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

            // 이미지 크기 체크
            const imageSizeKB = getBase64SizeKB(base64Data);
            console.log(`[GeminiHair] 이미지 크기: ${Math.round(imageSizeKB)}KB, 시도: ${attempt + 1}/${MAX_RETRIES + 1}`);

            if (imageSizeKB > 10000) {
                console.warn("[GeminiHair] ⚠️ 이미지가 10MB 이상입니다. 처리 시간이 길어질 수 있습니다.");
            }

            // 프롬프트 생성
            const prompt = buildHairPrompt(request);

            // Gemini API 호출 — 이미지 편집
            // AbortController로 타임아웃 관리
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90초 타임아웃

            try {
                // 멀티 이미지 콘텐츠 구성: [프롬프트, 사용자 사진, (참조 이미지)]
                const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                ];

                // ★ 스타일 참조 이미지 추가 (base64 우선, URL fallback)
                let refBase64 = '';
                let refMimeType = 'image/jpeg';

                if (request.styleImageBase64) {
                    // 1순위: 클라이언트에서 변환한 base64 직접 사용
                    refBase64 = request.styleImageBase64.replace(/^data:image\/\w+;base64,/, '');
                    const refMimeMatch = request.styleImageBase64.match(/^data:(image\/\w+);base64,/);
                    refMimeType = refMimeMatch ? refMimeMatch[1] : 'image/jpeg';
                    console.log(`[GeminiHair] ✅ 참조 이미지 (base64) 포함 (${Math.round(refBase64.length * 3 / 4 / 1024)}KB)`);
                } else if (request.styleImageUrl) {
                    // 2순위: 서버에서 직접 URL fetch
                    console.log(`[GeminiHair] 참조 이미지 서버 fetch: ${request.styleImageUrl.substring(0, 80)}...`);
                    try {
                        const imgRes = await fetch(request.styleImageUrl, { signal: AbortSignal.timeout(10000) });
                        if (imgRes.ok) {
                            const buffer = await imgRes.arrayBuffer();
                            refBase64 = Buffer.from(buffer).toString('base64');
                            refMimeType = imgRes.headers.get('content-type') || 'image/jpeg';
                            console.log(`[GeminiHair] ✅ 참조 이미지 (서버 fetch) 포함 (${Math.round(refBase64.length * 3 / 4 / 1024)}KB)`);
                        }
                    } catch (fetchErr) {
                        console.warn('[GeminiHair] ⚠️ 참조 이미지 서버 fetch 실패:', fetchErr);
                    }
                }

                if (refBase64) {
                    contents.push({ inlineData: { mimeType: refMimeType, data: refBase64 } });
                } else {
                    console.warn('[GeminiHair] ⚠️ 참조 이미지 없음, 텍스트만으로 진행');
                }

                const response = await ai.models.generateContent({
                    model: "gemini-3.1-flash-image-preview",
                    contents,
                    config: {
                        responseModalities: ["Text", "Image"],
                        safetySettings: [
                            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        ],
                    },
                });

                clearTimeout(timeoutId);

                // 응답 구조 로깅
                const partCount = response.candidates?.[0]?.content?.parts?.length || 0;
                console.log(`[GeminiHair] 응답: ${partCount} parts`);

                // 응답에서 이미지 추출
                const candidates = response.candidates;
                if (!candidates || candidates.length === 0) {
                    if (attempt < MAX_RETRIES) {
                        console.log(`[GeminiHair] 빈 응답, ${attempt + 1}번째 재시도 대기...`);
                        await sleep(2000 * (attempt + 1));
                        continue;
                    }
                    return {
                        success: false,
                        error: "AI가 결과를 생성하지 못했습니다. 다시 시도해주세요.",
                    };
                }

                const parts = candidates[0].content?.parts;
                if (!parts) {
                    if (attempt < MAX_RETRIES) {
                        console.log(`[GeminiHair] 콘텐츠 없음, ${attempt + 1}번째 재시도 대기...`);
                        await sleep(2000 * (attempt + 1));
                        continue;
                    }
                    return {
                        success: false,
                        error: "응답에 콘텐츠가 없습니다.",
                    };
                }

                // 이미지 파트 찾기
                for (const part of parts) {
                    if (part.inlineData?.data) {
                        const resultMime = part.inlineData.mimeType || "image/png";
                        const resultBase64 = `data:${resultMime};base64,${part.inlineData.data}`;
                        console.log(`[GeminiHair] ✅ 이미지 생성 성공 (${Math.round(getBase64SizeKB(part.inlineData.data))}KB)`);
                        return {
                            success: true,
                            resultImage: resultBase64,
                        };
                    }
                }

                // 텍스트만 반환된 경우 (안전 필터 등)
                const textPart = parts.find((p: { text?: string }) => p.text);
                console.log("[GeminiHair] 텍스트만 반환됨:", textPart?.text?.substring(0, 200));
                return {
                    success: false,
                    error: textPart?.text || "이미지를 생성할 수 없습니다. 다른 사진으로 시도해보세요.",
                };

            } catch (innerError: unknown) {
                clearTimeout(timeoutId);
                throw innerError;
            }

        } catch (error: unknown) {
            const err = error as Error & { status?: number; message?: string; code?: string };

            // 타임아웃 에러
            if (err.name === "AbortError" || err.message?.includes("abort")) {
                console.error(`[GeminiHair] 타임아웃 (시도 ${attempt + 1})`);
                if (attempt < MAX_RETRIES) {
                    await sleep(3000);
                    continue;
                }
                return {
                    success: false,
                    error: "처리 시간이 초과되었습니다. 더 작은 사진으로 시도해보세요.",
                };
            }

            // Rate Limit
            if (err.status === 429) {
                console.error(`[GeminiHair] Rate limit (시도 ${attempt + 1})`);
                if (attempt < MAX_RETRIES) {
                    await sleep(5000 * (attempt + 1));
                    continue;
                }
                return {
                    success: false,
                    error: "API 호출 한도에 도달했습니다. 잠시 후 다시 시도해주세요.",
                };
            }

            // fetch failed (네트워크 오류) - 재시도
            if (err.message?.includes("fetch failed") || err.message?.includes("ECONNRESET") || err.message?.includes("socket")) {
                console.error(`[GeminiHair] 네트워크 오류 (시도 ${attempt + 1}): ${err.message}`);
                if (attempt < MAX_RETRIES) {
                    await sleep(3000 * (attempt + 1));
                    continue;
                }
                return {
                    success: false,
                    error: "네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.",
                };
            }

            // 안전 필터
            if (err.message?.includes("SAFETY")) {
                return {
                    success: false,
                    error: "안전 필터에 의해 차단되었습니다. 다른 사진으로 시도해보세요.",
                };
            }

            // 모델 관련 오류
            if (err.message?.includes("not found") || err.message?.includes("does not exist")) {
                console.error(`[GeminiHair] 모델 오류: ${err.message}`);
                return {
                    success: false,
                    error: "AI 모델을 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
                };
            }

            // 기타 에러 - 마지막 시도가 아니면 재시도
            console.error(`[GeminiHair] Error (시도 ${attempt + 1}):`, err.message || err);
            if (attempt < MAX_RETRIES) {
                await sleep(2000 * (attempt + 1));
                continue;
            }

            return {
                success: false,
                error: `AI 처리 중 오류가 발생했습니다: ${err.message || "알 수 없는 오류"}`,
            };
        }
    }

    // 여기 도달하면 안되지만 안전장치
    return {
        success: false,
        error: "처리에 실패했습니다. 다시 시도해주세요.",
    };
}
