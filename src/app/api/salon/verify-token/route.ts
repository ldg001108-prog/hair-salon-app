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
        const isOwner = result.isOwner;

        // 쿠키 이름에 한글 사용 불가 (RFC 6265) → hex 인코딩
        const safeSalonId = Buffer.from(salonId).toString("hex").slice(0, 32);
        const cookieName = `ss-${safeSalonId}`;
        const existingCookie = request.cookies.get(cookieName);

        let sessionStartMs: number = Date.now();
        let isNewSession = false;

        // 원장님 토큰은 10분 세션 제한을 적용하지 않음
        if (!isOwner) {
            if (existingCookie) {
                sessionStartMs = parseInt(existingCookie.value, 10);
                const elapsed = Date.now() - sessionStartMs;
                const sessionDurationMs = SESSION_DURATION_MIN * 60 * 1000;

                if (elapsed > sessionDurationMs) {
                    console.log(`[VerifyToken] 세션 만료 (경과: ${Math.round(elapsed / 60000)}분). salonId=${salonId}`);
                    const expiredResponse = NextResponse.json(
                        { valid: false, error: "세션이 만료되었습니다. QR코드를 다시 스캔해주세요." },
                        { status: 401 }
                    );
                    expiredResponse.cookies.set(cookieName, "", {
                        maxAge: 0,
                        httpOnly: true,
                        sameSite: "lax",
                        path: "/",
                    });
                    return expiredResponse;
                }
            } else {
                sessionStartMs = Date.now();
                isNewSession = true;
            }
        }

        // 응답 데이터 구성
        const sessionExpiresAt = isOwner
            ? Date.now() + 10 * 365 * 24 * 3600 * 1000  // 원장님: 사실상 영구
            : sessionStartMs + SESSION_DURATION_MIN * 60 * 1000;  // 고객: 10분
        const sessionRemainingMs = sessionExpiresAt - Date.now();
        const sessionRemainingMin = isOwner ? null : Math.max(1, Math.ceil(sessionRemainingMs / 60000));

        const response = NextResponse.json({
            valid: true,
            salonId: result.salonId,
            expiresAt: sessionExpiresAt,
            remainingMin: sessionRemainingMin,
            sessionDurationMin: isOwner ? null : SESSION_DURATION_MIN,
            isOwner: !!isOwner,
        });

        // 고객의 최초 세션일 때만 쿠키 설정
        if (!isOwner && isNewSession) {
            response.cookies.set(cookieName, sessionStartMs.toString(), {
                maxAge: SESSION_DURATION_MIN * 60,
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
