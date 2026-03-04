/**
 * POST /api/transform
 * 사용자 사진의 헤어스타일을 AI로 변환하는 API Route
 * - API Key는 서버 사이드에서만 사용 (클라이언트 노출 방지)
 * - IP 기반 Rate Limiting 적용
 * - Supabase 합성 로그 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { transformHair, HairTransformRequest } from "@/services/geminiHair";
import { checkSalonRateLimit } from "@/lib/rateLimit";
import { logSynthesis } from "@/lib/getSalonData";
import { uploadSynthesisImage } from "@/lib/storageUpload";

// POST 요청 핸들러
export async function POST(request: NextRequest) {
    try {
        // 클라이언트 IP 추출
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

        // 요청 바디 먼저 읽기 (salonId 추출)
        const body = await request.json();
        const salonId = body.salonId || "demo";

        // Rate Limit 체크 (살롱별 한도 적용, 개발환경은 무제한)
        const isDev = process.env.NODE_ENV === "development";
        const rateResult = isDev
            ? { allowed: true, remaining: 999, resetAt: 0, retryAfterSec: 0 }
            : await checkSalonRateLimit(ip, salonId);
        if (!rateResult.allowed) {
            const msg =
                rateResult.limitType === "daily"
                    ? `일일 사용 횟수를 초과했습니다 (${rateResult.dailyUsed}/${rateResult.dailyLimit}회). 내일 다시 이용해주세요.`
                    : `잠시 후 다시 시도해주세요. (${rateResult.retryAfterSec}초 후 가능)`;

            return NextResponse.json(
                { success: false, error: msg, retryAfterSec: rateResult.retryAfterSec },
                {
                    status: 429,
                    headers: { "Retry-After": String(rateResult.retryAfterSec) },
                }
            );
        }

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

        // 요청 바디에서 파라미터 추출 (body는 이미 위에서 파싱됨)
        const {
            photo,
            styleName,
            styleDescription,
            styleImageBase64,
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
            styleImageBase64: styleImageBase64 || undefined,
            colorName: colorName || undefined,
            colorHex: colorHex || undefined,
            colorIntensity: colorIntensity ?? 85,
            colorSaturation: colorSaturation ?? undefined,
            colorLightness: colorLightness ?? undefined,
            category: category || undefined,
        };

        console.log(
            `[Transform API] 요청: 스타일="${styleName}", 색상="${colorName || "Original"}", hex=${colorHex || "none"}, 강도=${colorIntensity ?? 85}%, IP=${ip}`
        );

        const startTime = Date.now();
        const result = await transformHair(apiKey, transformRequest);
        const durationMs = Date.now() - startTime;

        // Supabase에 합성 로그 저장 (비동기, 실패해도 무시)
        logSynthesis({
            salonId: salonId || "demo",
            styleName,
            colorHex: colorHex || undefined,
            success: result.success,
            errorMessage: result.success ? undefined : result.error,
            durationMs,
            clientIp: ip,
            userAgent: request.headers.get("user-agent") || undefined,
        });

        if (result.success) {
            console.log(`[Transform API] ✅ 합성 성공 (${durationMs}ms)`);

            // Supabase Storage에 결과 이미지 저장 (비동기, 실패해도 응답 차단 안 함)
            let savedImageUrl: string | undefined;
            if (result.resultImage) {
                const uploaded = await uploadSynthesisImage(result.resultImage, salonId);
                if (uploaded) {
                    savedImageUrl = uploaded.url;
                    console.log(`[Transform API] 📦 이미지 저장: ${uploaded.path}`);
                }
            }

            return NextResponse.json({
                success: true,
                resultImage: result.resultImage,
                savedImageUrl,
                remaining: rateResult.remaining,
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
