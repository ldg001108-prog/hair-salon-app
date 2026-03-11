/**
 * POST /api/salon/verify-token
 * 클라이언트가 세션 토큰의 유효성을 확인하는 API
 * 
 * QR 토큰 유효기간(60분)과 세션 유효기간(10분)은 분리됨:
 * - QR 토큰: 60분 안에 스캔해야 유효
 * - 세션: 최초 검증 시점부터 10분간 유지
 * 
 * 새로고침 우회 방지:
 * - 쿠키에 최초 세션 시작 시각 기록
 * - 10분 초과 시 재발급 거부 (새 QR 필요)
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

        // ── 새로고침 우회 방지: 쿠키로 세션 시작 시각 추적 ──
        const salonId = result.salonId || "unknown";
        const cookieName = `session-start-${salonId}`;
        const existingCookie = request.cookies.get(cookieName);

        let sessionStartMs: number;
        let isNewSession = false;

        if (existingCookie) {
            // 기존 세션 존재 → 최초 시작 시각 기준으로 만료 체크
            sessionStartMs = parseInt(existingCookie.value, 10);
            const elapsed = Date.now() - sessionStartMs;
            const sessionDurationMs = SESSION_DURATION_MIN * 60 * 1000;

            if (elapsed > sessionDurationMs) {
                // 10분 초과 → 세션 만료, 재발급 거부
                console.log(`[VerifyToken] 세션 만료 (경과: ${Math.round(elapsed / 60000)}분). salonId=${salonId}`);
                const expiredResponse = NextResponse.json(
                    { valid: false, error: "세션이 만료되었습니다. QR코드를 다시 스캔해주세요." },
                    { status: 401 }
                );
                // 만료된 쿠키 삭제
                expiredResponse.cookies.set(cookieName, "", {
                    maxAge: 0,
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                });
                return expiredResponse;
            }
        } else {
            // 최초 세션 → 시작 시각 기록
            sessionStartMs = Date.now();
            isNewSession = true;
        }

        // 세션 만료 시각 = 최초 시작 + SESSION_DURATION_MIN 분
        const sessionExpiresAt = sessionStartMs + SESSION_DURATION_MIN * 60 * 1000;
        const sessionRemainingMs = sessionExpiresAt - Date.now();
        const sessionRemainingMin = Math.max(1, Math.ceil(sessionRemainingMs / 60000));

        const response = NextResponse.json({
            valid: true,
            salonId: result.salonId,
            expiresAt: sessionExpiresAt,
            remainingMin: sessionRemainingMin,
            sessionDurationMin: SESSION_DURATION_MIN,
        });

        // 최초 세션일 때만 쿠키 설정 (기존에는 이미 존재)
        if (isNewSession) {
            response.cookies.set(cookieName, sessionStartMs.toString(), {
                maxAge: SESSION_DURATION_MIN * 60, // 10분 후 자동 삭제
                httpOnly: true,
                sameSite: "lax",
                path: "/",
            });
        }

        return response;
    } catch (error) {
        console.error("[VerifyToken] Error:", error);
        return NextResponse.json(
            { valid: false, error: "서버 내부 오류" },
            { status: 500 }
        );
    }
}
