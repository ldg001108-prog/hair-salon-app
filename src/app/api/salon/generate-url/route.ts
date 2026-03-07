/**
 * GET /api/salon/generate-url?salonId=xxx
 * 토큰 포함 살롱 URL 생성 (URL 복사용)
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken } from "@/lib/sessionToken";

const TOKEN_VALIDITY_MIN = 60; // 60분 유효

export async function GET(request: NextRequest) {
    const salonId = request.nextUrl.searchParams.get("salonId");

    if (!salonId) {
        return NextResponse.json(
            { error: "salonId 파라미터가 필요합니다." },
            { status: 400 }
        );
    }

    try {
        const token = generateSessionToken(salonId, TOKEN_VALIDITY_MIN);
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            request.nextUrl.origin;
        const url = `${baseUrl}/salon/${encodeURIComponent(salonId)}?token=${encodeURIComponent(token)}`;

        return NextResponse.json({ url, validMin: TOKEN_VALIDITY_MIN });
    } catch (err) {
        console.error("[GenerateUrl] Error:", err);
        return NextResponse.json(
            { error: "URL 생성 실패" },
            { status: 500 }
        );
    }
}
