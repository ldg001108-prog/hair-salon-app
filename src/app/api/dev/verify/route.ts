/**
 * POST /api/dev/verify
 * 개발자 토큰 검증 API
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const DEV_TOKEN_SECRET = process.env.SUPER_ADMIN_KEY || "dev-secret-fallback";
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24시간

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        const [timestamp, hmac] = token.split(".");
        if (!timestamp || !hmac) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        // 만료 체크
        const tokenAge = Date.now() - parseInt(timestamp, 10);
        if (tokenAge > TOKEN_MAX_AGE) {
            return NextResponse.json({ valid: false, error: "토큰이 만료되었습니다." }, { status: 401 });
        }

        // HMAC 검증
        const expectedHmac = crypto.createHmac("sha256", DEV_TOKEN_SECRET)
            .update(`dev-admin:${timestamp}`)
            .digest("hex");

        if (hmac !== expectedHmac) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        return NextResponse.json({ valid: true });
    } catch {
        return NextResponse.json({ valid: false }, { status: 500 });
    }
}
