/**
 * GET /api/qrcode?salonId=xxx
 * 미용실 전용 QR코드 생성 API
 * - SVG → PNG 변환 없이 SVG 그대로 반환 (Vercel serverless 호환)
 * - 세션 토큰 포함 (미용실 밖에서 접근 차단용)
 */

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { generateSessionToken } from "@/lib/sessionToken";

export async function GET(request: NextRequest) {
    const salonId = request.nextUrl.searchParams.get("salonId");

    if (!salonId) {
        return NextResponse.json(
            { error: "salonId 파라미터가 필요합니다." },
            { status: 400 }
        );
    }

    try {
        // QR 토큰 유효기간: 60분 (복사/공유 후에도 충분한 시간)
        // 세션 유효기간(10분)은 verify-token API에서 별도 부여
        const QR_TOKEN_VALIDITY_MIN = 60;
        const token = generateSessionToken(salonId, QR_TOKEN_VALIDITY_MIN);

        // 실제 요청 호스트 기반 URL 생성 (프로덕션에서 localhost 방지)
        const host = request.headers.get("host") || request.nextUrl.host;
        const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
        const salonUrl = `${baseUrl}/salon/${encodeURIComponent(salonId)}?token=${encodeURIComponent(token)}`;

        // QR 코드를 SVG 문자열로 생성 (canvas 불필요)
        const svgString = await QRCode.toString(salonUrl, {
            type: "svg",
            width: 512,
            margin: 2,
            color: {
                dark: "#1a1a2e",
                light: "#ffffff",
            },
            errorCorrectionLevel: "H",
        });

        return new NextResponse(svgString, {
            headers: {
                "Content-Type": "image/svg+xml",
                // QR 토큰은 매번 새로 생성해야 하므로 캐시하지 않음
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });
    } catch (err) {
        console.error("[QR] Generation failed:", err);
        return NextResponse.json(
            { error: "QR코드 생성에 실패했습니다.", detail: String(err) },
            { status: 500 }
        );
    }
}
