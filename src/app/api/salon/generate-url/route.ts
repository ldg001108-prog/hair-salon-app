/**
 * GET /api/salon/generate-url?salonId=xxx
 * 토큰 포함 살롱 URL 생성 (URL 복사용)
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken } from "@/lib/sessionToken";

const TOKEN_VALIDITY_MIN = 60; // 60분 유효

export async function GET(request: NextRequest) {
    const salonId = request.nextUrl.searchParams.get("salonId");
    const type = request.nextUrl.searchParams.get("type");

    if (!salonId) {
        return NextResponse.json(
            { error: "salonId 파라미터가 필요합니다." },
            { status: 400 }
        );
    }

    try {
        const isOwner = type === "owner";
        const validMin = isOwner ? 999999 : TOKEN_VALIDITY_MIN;
        const token = generateSessionToken(salonId, validMin, isOwner);

        // 실제 요청 호스트 기반 URL 생성 (프로덕션에서 localhost 방지)
        const host = request.headers.get("host") || request.nextUrl.host;
        const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

        const url = `${baseUrl}/salon/${encodeURIComponent(salonId)}?token=${encodeURIComponent(token)}`;

        return NextResponse.json({ url, validMin, isOwner });
    } catch (err) {
        console.error("[GenerateUrl] Error:", err);
        return NextResponse.json(
            { error: "URL 생성 실패" },
            { status: 500 }
        );
    }
}
