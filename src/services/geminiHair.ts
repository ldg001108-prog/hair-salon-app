/**
 * Gemini AI 헤어스타일 합성 서비스
 * - 사용자 사진의 얼굴은 그대로 유지하면서 머리카락만 자연스럽게 변경
 * - 스타일, 색상, 강도 파라미터 지원
 * - 이미지 리사이징 및 재시도 로직 포함
 */

import { GoogleGenAI } from "@google/genai";

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
    /** 색상 강도 0~100 (기본 70) */
    colorIntensity?: number;
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

// === 프롬프트 빌더 ===
function buildHairPrompt(request: HairTransformRequest): string {
    const { styleName, styleDescription, colorName, colorHex, colorIntensity = 70 } = request;

    // 헤어스타일 설명
    const styleInfo = styleDescription
        ? `${styleName} - ${styleDescription}`
        : styleName;

    // 색상 설명
    let colorInstruction = "";
    if (colorName && colorName !== "Original") {
        const intensityDesc =
            colorIntensity <= 30
                ? "very subtle and natural"
                : colorIntensity <= 60
                    ? "moderate and balanced"
                    : colorIntensity <= 80
                        ? "vivid and noticeable"
                        : "bold and dramatic";

        colorInstruction = `
HAIR COLOR: Apply "${colorName}" hair color${colorHex ? ` (similar to hex ${colorHex})` : ""}.
COLOR INTENSITY: ${colorIntensity}% — the color should look ${intensityDesc}.
The color should have natural highlights, lowlights, and depth variation to look realistic.`;
    } else {
        colorInstruction = `
HAIR COLOR: Keep the original natural hair color of the person.`;
    }

    return `You are a world-class professional hair stylist, colorist, and photo editor with 25 years of experience at top salons.

TASK: Transform the hairstyle in this photo to the TARGET HAIRSTYLE below. The change MUST be CLEARLY VISIBLE and DRAMATICALLY different from the original hair.

TARGET HAIRSTYLE: ${styleInfo}
${colorInstruction}

PHOTO ANGLE AWARENESS (CRITICAL):
- Carefully analyze the photo angle: front-facing, side profile (left/right), 3/4 angle, or back view.
- For SIDE PROFILE photos: Focus on changing the hair silhouette visible from the side — the ear area, sideburns, nape line, temple area, hair length as seen from the side, and overall volume shape from the lateral view.
- For 3/4 ANGLE photos: Show the hairstyle transformation on both the visible front portion and the side portion — adjust bangs, side volume, and layering visible from this angle.
- For BACK VIEW photos: Completely transform the back hair — nape shape, back layers, length, and overall rear silhouette of the style.
- For FRONT-FACING photos: Focus on bangs, face-framing layers, parting, crown volume, and overall front silhouette.
- Regardless of angle, the NEW HAIRSTYLE must be OBVIOUSLY DIFFERENT from the original — change the shape, length, volume, texture, and silhouette significantly.

MANDATORY TRANSFORMATION RULES:
1. The hairstyle MUST look COMPLETELY DIFFERENT from the original — if the original has long straight hair and the target is a short bob, make it a SHORT BOB. Do NOT leave it looking similar to the original.
2. Change the HAIR LENGTH to match the target style precisely.
3. Change the HAIR VOLUME and BODY to match the target style.
4. Change the HAIR TEXTURE (straight/wavy/curly) to match the target style.
5. Change the HAIR SILHOUETTE and SHAPE to match the target style.
6. The transformation should be so obvious that anyone can instantly see the hairstyle is different.

PRESERVATION RULES (do NOT change these):
1. The person's FACE must remain 100% IDENTICAL — same eyes, nose, mouth, skin, expression, facial structure
2. SKIN TONE, COMPLEXION, and all FACIAL FEATURES must be completely preserved
3. BACKGROUND must remain exactly the same — same scene, colors, objects, lighting
4. CLOTHES, ACCESSORIES, and BODY POSITION must stay unchanged

QUALITY AND REALISM:
1. The hairstyle must look COMPLETELY NATURAL — NOT like a wig or Photoshop
2. The TRANSITION between hair and face/forehead/ears must be seamless
3. Hair should naturally follow the person's head shape
4. Output a CRISP, HIGH-QUALITY, SHARP photograph with fine strand-level detail
5. Maintain realistic lighting, shadows that match the original photo
6. Hair texture, individual strands, and highlights should be photorealistic
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

            // Gemini API 호출 - 공식 문서 이미지 편집 형식
            // AbortController로 타임아웃 관리
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60초 타임아웃

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
