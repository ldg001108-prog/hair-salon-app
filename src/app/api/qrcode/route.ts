/**
 * GET /api/qrcode?salonId=xxx
 * 미용실 전용 QR코드 생성 API
 * - QR 이미지(PNG) 반환
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
        const salonUrl = `${baseUrl}/salon/${salonId}`;

        // QR 코드 PNG 생성 (DataURL → 바이너리)
        const qrDataUrl = await QRCode.toDataURL(salonUrl, {
            type: "image/png",
            width: 512,
            margin: 2,
            color: {
                dark: "#1a1a2e",
                light: "#ffffff",
            },
            errorCorrectionLevel: "H",
        });

        // DataURL → Buffer
        const base64Data = qrDataUrl.split(",")[1];
        const binaryData = Buffer.from(base64Data, "base64");

        return new NextResponse(binaryData, {
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `inline; filename="qr-${salonId}.png"`,
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (err) {
        console.error("[QR] Generation failed:", err);
        return NextResponse.json(
            { error: "QR코드 생성에 실패했습니다." },
            { status: 500 }
        );
    }
}
