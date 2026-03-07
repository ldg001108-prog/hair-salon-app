/**
 * POST /api/salon/verify-token
 * 클라이언트가 세션 토큰의 유효성을 확인하는 API
 * 
 * QR 토큰 유효기간(5분)과 세션 유효기간(10분)은 분리됨:
 * - QR 토큰: 5분 안에 스캔해야 유효
 * - 세션: 최초 검증 시점부터 10분간 유지
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/sessionToken";

// 세션 유효기간 (분) — QR 스캔 후 사용 가능 시간
const SESSION_DURATION_MIN = 10;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { valid: false, error: "토큰이 제공되지 않았습니다." },
                { status: 400 }
            );
        }

        const result = verifySessionToken(token);

        if (!result.valid) {
            console.warn(`[VerifyToken] 토큰 검증 실패: ${result.error}, salonId=${result.salonId || 'unknown'}, SESSION_SECRET=${process.env.SESSION_SECRET ? '설정됨' : '⚠️ 미설정(fallback 사용)'}`);
            return NextResponse.json(
                { valid: false, error: result.error },
                { status: 401 }
            );
        }

        // 세션 만료 시각 = 지금부터 SESSION_DURATION_MIN 분 후
        // (QR 토큰 자체의 만료와 별도로, 세션은 최초 검증 시점 기준)
        const sessionExpiresAt = Date.now() + SESSION_DURATION_MIN * 60 * 1000;
        const sessionRemainingMin = SESSION_DURATION_MIN;

        return NextResponse.json({
            valid: true,
            salonId: result.salonId,
            expiresAt: sessionExpiresAt,
            remainingMin: sessionRemainingMin,
            sessionDurationMin: SESSION_DURATION_MIN,
        });
    } catch (error) {
        console.error("[VerifyToken] Error:", error);
        return NextResponse.json(
            { valid: false, error: "서버 내부 오류" },
            { status: 500 }
        );
    }
}
