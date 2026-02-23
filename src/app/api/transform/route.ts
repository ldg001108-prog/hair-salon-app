/**
 * POST /api/transform
 * 사용자 사진의 헤어스타일을 AI로 변환하는 API Route
 * - API Key는 서버 사이드에서만 사용 (클라이언트 노출 방지)
 */

import { NextRequest, NextResponse } from "next/server";
import { transformHair, HairTransformRequest } from "@/services/geminiHair";

// POST 요청 핸들러
export async function POST(request: NextRequest) {
    try {
        // API Key 확인
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: "서버에 API Key가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
                },
                { status: 500 }
            );
        }

        // 요청 바디 파싱
        const body = await request.json();
        const {
            photo,
            styleName,
            styleDescription,
            colorName,
            colorHex,
            colorIntensity,
            colorSaturation,
            colorLightness,
            category,
        } = body;

        // 필수 파라미터 검증
        if (!photo) {
            return NextResponse.json(
                { success: false, error: "사진이 필요합니다." },
                { status: 400 }
            );
        }

        if (!styleName) {
            return NextResponse.json(
                { success: false, error: "헤어스타일을 선택해주세요." },
                { status: 400 }
            );
        }

        // Gemini AI 헤어 합성 실행
        const transformRequest: HairTransformRequest = {
            photoBase64: photo,
            styleName,
            styleDescription: styleDescription || undefined,
            colorName: colorName || undefined,
            colorHex: colorHex || undefined,
            colorIntensity: colorIntensity ?? 85,
            colorSaturation: colorSaturation ?? undefined,
            colorLightness: colorLightness ?? undefined,
            category: category || undefined,
        };

        console.log(
            `[Transform API] 요청: 스타일="${styleName}", 색상="${colorName || "Original"}", hex=${colorHex || "none"}, 강도=${colorIntensity ?? 85}%`
        );

        const result = await transformHair(apiKey, transformRequest);

        if (result.success) {
            console.log("[Transform API] ✅ 합성 성공");
            return NextResponse.json({
                success: true,
                resultImage: result.resultImage,
            });
        } else {
            console.log(`[Transform API] ❌ 합성 실패: ${result.error}`);
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                },
                { status: 422 }
            );
        }
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[Transform API] 서버 에러:", err.message);
        return NextResponse.json(
            {
                success: false,
                error: "서버 내부 오류가 발생했습니다.",
            },
            { status: 500 }
        );
    }
}
