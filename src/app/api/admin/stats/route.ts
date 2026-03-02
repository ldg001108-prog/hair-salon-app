/**
 * GET /api/admin/stats?salonId=xxx
 * 살롱별 통계 API (관리자용)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSalonStats } from "@/lib/getSalonData";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        const salonId = request.nextUrl.searchParams.get("salonId");
        if (!salonId) {
            return NextResponse.json(
                { success: false, error: "salonId가 필요합니다." },
                { status: 400 }
            );
        }

        // 인증 확인 (Supabase 연결 시)
        const supabase = getSupabase();
        if (supabase) {
            const authHeader = request.headers.get("authorization");
            if (authHeader) {
                const token = authHeader.replace("Bearer ", "");
                const { data: { user } } = await supabase.auth.getUser(token);

                if (!user) {
                    return NextResponse.json(
                        { success: false, error: "인증이 필요합니다." },
                        { status: 401 }
                    );
                }

                // 소유권 확인
                const { data: salon } = await supabase
                    .from("salons")
                    .select("id")
                    .eq("id", salonId)
                    .eq("owner_id", user.id)
                    .single();

                if (!salon) {
                    return NextResponse.json(
                        { success: false, error: "이 살롱의 소유자가 아닙니다." },
                        { status: 403 }
                    );
                }
            }
        }

        const stats = await getSalonStats(salonId);

        return NextResponse.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error("[Admin/Stats] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
