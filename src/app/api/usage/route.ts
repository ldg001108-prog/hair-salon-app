/**
 * GET /api/usage?salonId=xxx
 * 살롱의 오늘 사용량 + 일일 한도 + 성공/실패 횟수 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getSalon } from "@/lib/getSalonData";
import { getSupabase } from "@/lib/supabase";

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

        // api_logs에서 해당 살롱의 오늘 통계 조회
        let todayUsed = 0;
        let successCount = 0;
        let failCount = 0;

        const supabase = getSupabase();
        if (supabase) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const { data: logs } = await supabase
                .from("api_logs")
                .select("success")
                .eq("salon_id", decodedId)
                .gte("created_at", todayStart.toISOString());

            if (logs) {
                todayUsed = logs.length;
                successCount = logs.filter(l => l.success).length;
                failCount = logs.filter(l => !l.success).length;
            }
        }

        const remaining = Math.max(0, dailyLimit - todayUsed);

        return NextResponse.json({
            salonId: decodedId,
            dailyLimit,
            todayUsed,
            remaining,
            successCount,
            failCount,
        });
    } catch (err) {
        console.error("[Usage API] Error:", err);
        return NextResponse.json(
            { error: "서버 오류" },
            { status: 500 }
        );
    }
}
