/**
 * GET /api/qrcode?salonId=xxx
 * 미용실 전용 QR코드 생성 API
 * - SVG → PNG 변환 없이 SVG 그대로 반환 (Vercel serverless 호환)
 */

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
    const salonId = request.nextUrl.searchParams.get("salonId");

    if (!salonId) {
        return NextResponse.json(
            { error: "salonId 파라미터가 필요합니다." },
            { status: 400 }
        );
    }

    try {
        // Production URL or localhost
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            request.nextUrl.origin;
        const salonUrl = `${baseUrl}/salon/${encodeURIComponent(salonId)}`;

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
                "Cache-Control": "public, max-age=86400",
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
