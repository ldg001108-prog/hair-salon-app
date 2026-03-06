/**
 * POST /api/dev/login
 * 개발자 대시보드 로그인 API
 * 환경변수 DEV_ADMIN_ID / DEV_ADMIN_PW 비교
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// 세션 토큰 생성 (간단한 HMAC 기반)
function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

// 메모리 기반 세션 저장 (서버리스 환경에서는 요청 간 유지 안 될 수 있음)
// 대안: 토큰 자체에 서명을 넣어 검증
const DEV_TOKEN_SECRET = process.env.SUPER_ADMIN_KEY || "dev-secret-fallback";

export async function POST(request: NextRequest) {
    try {
        const { id, password } = await request.json();

        const adminId = process.env.DEV_ADMIN_ID;
        const adminPw = process.env.DEV_ADMIN_PW;

        if (!adminId || !adminPw) {
            return NextResponse.json(
                { success: false, error: "서버에 개발자 계정이 설정되지 않았습니다." },
                { status: 500 }
            );
        }

        if (id !== adminId || password !== adminPw) {
            return NextResponse.json(
                { success: false, error: "ID 또는 비밀번호가 올바르지 않습니다." },
                { status: 401 }
            );
        }

        // 서명된 토큰 생성 (timestamp + HMAC)
        const timestamp = Date.now().toString();
        const hmac = crypto.createHmac("sha256", DEV_TOKEN_SECRET)
            .update(`dev-admin:${timestamp}`)
            .digest("hex");
        const token = `${timestamp}.${hmac}`;

        return NextResponse.json({
            success: true,
            token,
        });
    } catch (error) {
        console.error("[Dev/Login] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
