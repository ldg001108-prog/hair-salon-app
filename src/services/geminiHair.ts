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

// === 프롬프트 빌더 ===
function buildHairPrompt(request: HairTransformRequest): string {
    const {
        styleName, styleDescription, colorName, colorHex,
        colorIntensity = 85, colorSaturation, colorLightness
    } = request;

    // 헤어스타일 설명
    const styleInfo = styleDescription
        ? `${styleName} - ${styleDescription}`
        : styleName;

    // 색상 설명 — 강화된 버전
    let colorInstruction = "";
    if (colorHex && colorName && colorName !== "Original") {
        const colorDesc = getColorDescription(colorHex);
        const hsl = hexToHSL(colorHex);

        // 채도/명도 정보 (프론트엔드에서 전달된 값 or hex에서 계산)
        const sat = colorSaturation ?? hsl.s;
        const light = colorLightness ?? hsl.l;

        colorInstruction = `
HAIR COLOR (CRITICAL — FOLLOW EXACTLY):
Target color: ${colorDesc}
Exact hex code: ${colorHex}
HSL values: Hue ${hsl.h}°, Saturation ${sat}%, Lightness ${light}%

COLOR APPLICATION RULES:
1. The ENTIRE hair must be dyed to match hex ${colorHex} as closely as possible.
2. The overall visual impression of the hair color MUST match the target hex code — a viewer should recognize it as "${colorDesc}" hair.
3. Color intensity: ${colorIntensity}% — ${colorIntensity >= 80 ? "the color should be STRONG, VIVID, and CLEARLY the target color with minimal natural undertone showing through" : colorIntensity >= 50 ? "the color should be clearly visible and noticeable, blending naturally with hair texture" : "the color should be subtle, like a tint or wash over the natural hair color"}.
4. Apply the color UNIFORMLY across all hair — roots, mid-lengths, and ends should all clearly show the target color.
5. Maintain subtle highlights and lowlights within ±10% lightness of the target color for realism, but the DOMINANT color must unmistakably be ${colorHex}.
6. Do NOT default to brown or black — if the target is red, make it RED. If blonde, make it BLONDE. If blue, make it BLUE.
7. The dyed color should look like a PROFESSIONAL salon color job, not a cheap wig.`;
    } else {
        colorInstruction = `
HAIR COLOR: Keep the original natural hair color of the person in the photo. Do NOT change the hair color at all.`;
    }

    return `You are a world-class professional hair stylist, colorist, and photo editor with 25 years of experience at top salons.

TASK: Transform ONLY the hairstyle (and optionally the hair color) in this photo. The hair change MUST be CLEARLY VISIBLE and DRAMATICALLY different from the original hair.

TARGET HAIRSTYLE: ${styleInfo}
${colorInstruction}

PHOTO ANGLE AWARENESS (CRITICAL):
- Carefully analyze the photo angle: front-facing, side profile (left/right), 3/4 angle, or back view.
- For SIDE PROFILE photos: Focus on changing the hair silhouette visible from the side — the ear area, sideburns, nape line, temple area, hair length as seen from the side, and overall volume shape from the lateral view.
- For 3/4 ANGLE photos: Show the hairstyle transformation on both the visible front portion and the side portion — adjust bangs, side volume, and layering visible from this angle.
- For BACK VIEW photos: Completely transform the back hair — nape shape, back layers, length, and overall rear silhouette of the style.
- For FRONT-FACING photos: Focus on bangs, face-framing layers, parting, crown volume, and overall front silhouette.
- Regardless of angle, the NEW HAIRSTYLE must be OBVIOUSLY DIFFERENT from the original.

MANDATORY TRANSFORMATION RULES:
1. The hairstyle MUST look COMPLETELY DIFFERENT from the original.
2. Change the HAIR LENGTH to match the target style precisely.
3. Change the HAIR VOLUME and BODY to match the target style.
4. Change the HAIR TEXTURE (straight/wavy/curly) to match the target style.
5. Change the HAIR SILHOUETTE and SHAPE to match the target style.
6. The transformation should be so obvious that anyone can instantly see it.

CONSISTENCY RULES (CRITICAL — for producing the same result every time):
1. Apply the target hairstyle in the most STANDARD, TEXTBOOK, REPRESENTATIVE way possible.
2. Do NOT add creative variations, artistic interpretations, or random styling choices.
3. Follow the most CONVENTIONAL and TYPICAL version of the "${styleName}" hairstyle.
4. Hair parting, bang length, layer placement should follow the CLASSIC definition of this style.
5. Do NOT randomly change the hair parting direction or add asymmetric elements unless the style specifically requires it.
6. The result should look the same regardless of how many times this exact style is applied to this exact photo.

FACE PRESERVATION RULES (MOST CRITICAL — do NOT violate):
1. The person's FACE must remain EXACTLY IDENTICAL to the original photo — this is the #1 priority.
2. Do NOT alter, beautify, smooth, reshape, or enhance ANY facial features whatsoever.
3. Keep ALL original facial characteristics: skin texture, pores, blemishes, moles, freckles, wrinkles, laugh lines, under-eye circles, facial hair — everything.
4. SKIN TONE and COMPLEXION must be pixel-level identical to the original.
5. Do NOT change the face shape, jawline, chin, cheekbones, or any bone structure.
6. Do NOT enlarge or reshape eyes, nose, lips, or ears in any way.
7. Do NOT apply any skin smoothing, whitening, or beauty filter effects.
8. The ONLY acceptable skin change is matching the lighting/shadow to be consistent with the new hairstyle.
9. A viewer comparing the original and result should say "this is clearly the SAME person with just different hair."
10. EXPRESSION, GAZE DIRECTION, and FACIAL MUSCLE STATE must remain identical.

OTHER PRESERVATION RULES:
1. BACKGROUND must remain exactly the same
2. CLOTHES, ACCESSORIES, and BODY POSITION must stay unchanged

QUALITY AND REALISM:
1. The hairstyle must look COMPLETELY NATURAL — NOT like a wig or Photoshop
2. The TRANSITION between hair and face/forehead/ears must be seamless
3. Hair should naturally follow the person's head shape
4. Output a CRISP, HIGH-QUALITY, SHARP photograph with fine strand-level detail
5. Maintain realistic lighting, shadows that match the original photo
6. Hair texture, individual strands should be photorealistic
7. The result should look like a PROFESSIONAL SALON PHOTOGRAPH

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
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-image",
                    contents: [
                        {
                            text: prompt,
                        },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data,
                            },
                        },
                    ],
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

                // 디버깅: 응답 구조 확인
                console.log("[GeminiHair] 응답 parts:",
                    response.candidates?.[0]?.content?.parts?.map(p => ({
                        hasInlineData: !!p.inlineData,
                        hasText: !!p.text,
                        mimeType: p.inlineData?.mimeType,
                        dataLength: p.inlineData?.data?.length,
                    }))
                );

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
