/**
 * GET /api/usage?salonId=xxx
 * 살롱의 오늘 사용량 + 일일 한도 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getSalon, getTodayUsage } from "@/lib/getSalonData";

export async function GET(request: NextRequest) {
    try {
        const salonId = request.nextUrl.searchParams.get("salonId");
        if (!salonId) {
            return NextResponse.json(
                { error: "salonId가 필요합니다." },
                { status: 400 }
            );
        }

        const decodedId = decodeURIComponent(salonId);
        const salon = await getSalon(decodedId);
        const dailyLimit = salon?.dailyLimit || 10;
        const todayUsed = await getTodayUsage(decodedId);
        const remaining = Math.max(0, dailyLimit - todayUsed);

        return NextResponse.json({
            salonId: decodedId,
            dailyLimit,
            todayUsed,
            remaining,
        });
    } catch (err) {
        console.error("[Usage API] Error:", err);
        return NextResponse.json(
            { error: "서버 오류" },
            { status: 500 }
        );
    }
}
