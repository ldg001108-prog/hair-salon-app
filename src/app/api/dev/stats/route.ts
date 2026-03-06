/**
 * GET /api/dev/stats?period=day|week|month
 * 개발자 대시보드 — API 호출 통계
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export async function GET(request: NextRequest) {
    try {
        const supabase = getServiceClient();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "Supabase 미설정" },
                { status: 500 }
            );
        }

        const period = request.nextUrl.searchParams.get("period") || "day";

        // 기간 계산
        const now = new Date();
        let since: Date;
        switch (period) {
            case "week":
                since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "month":
                since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default: // day
                since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
        }

        // api_logs에서 통계 조회
        const { data: logs, error } = await supabase
            .from("api_logs")
            .select("salon_id, success, created_at")
            .gte("created_at", since.toISOString())
            .order("created_at", { ascending: false });

        if (error) {
            // 테이블이 없으면 빈 데이터 반환
            if (error.message.includes("does not exist") || error.code === "42P01") {
                return NextResponse.json({
                    success: true,
                    period,
                    totalCalls: 0,
                    successCount: 0,
                    failCount: 0,
                    successRate: 0,
                    perSalon: {},
                    needsSetup: true,
                    message: "api_logs 테이블이 생성되지 않았습니다. Supabase SQL 에디터에서 테이블을 생성해주세요.",
                });
            }
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // 전체 통계
        const totalCalls = (logs || []).length;
        const successCount = (logs || []).filter(l => l.success).length;
        const failCount = totalCalls - successCount;
        const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;

        // 살롱별 통계
        const perSalon: Record<string, { total: number; success: number; fail: number }> = {};
        for (const log of (logs || [])) {
            const sid = log.salon_id || "unknown";
            if (!perSalon[sid]) perSalon[sid] = { total: 0, success: 0, fail: 0 };
            perSalon[sid].total++;
            if (log.success) perSalon[sid].success++;
            else perSalon[sid].fail++;
        }

        return NextResponse.json({
            success: true,
            period,
            totalCalls,
            successCount,
            failCount,
            successRate,
            perSalon,
        });
    } catch (error) {
        console.error("[Dev/Stats] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}
