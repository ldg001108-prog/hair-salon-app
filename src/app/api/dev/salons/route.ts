/**
 * GET /api/dev/salons
 * 개발자 대시보드 — 전체 살롱 목록 조회
 * POST /api/dev/salons — 새 살롱 생성 (create-salon 래핑)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export async function GET() {
    try {
        const supabase = getServiceClient();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "Supabase 미설정" },
                { status: 500 }
            );
        }

        // 살롱 목록 조회
        const { data: salons, error: salonError } = await supabase
            .from("salons")
            .select("id, name, owner_id, plan, daily_limit, is_active, created_at, theme_color")
            .order("created_at", { ascending: false });

        if (salonError) {
            return NextResponse.json(
                { success: false, error: salonError.message },
                { status: 500 }
            );
        }

        // 소유자 이메일 매핑
        const ownerIds = [...new Set((salons || []).map(s => s.owner_id).filter(Boolean))];
        const ownerMap: Record<string, string> = {};

        if (ownerIds.length > 0) {
            const { data: usersData } = await supabase.auth.admin.listUsers();
            if (usersData?.users) {
                for (const u of usersData.users) {
                    ownerMap[u.id] = u.email || "unknown";
                }
            }
        }

        // 오늘 사용량 조회 (api_logs 기반 — 가장 신뢰할 수 있는 데이터)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: todayLogs } = await supabase
            .from("api_logs")
            .select("salon_id")
            .gte("created_at", todayStart.toISOString())
            .eq("success", true);

        const usageMap: Record<string, number> = {};
        todayLogs?.forEach(log => {
            const sid = log.salon_id || "unknown";
            usageMap[sid] = (usageMap[sid] || 0) + 1;
        });

        const enriched = (salons || []).map(s => ({
            ...s,
            ownerEmail: ownerMap[s.owner_id] || "—",
            today_used: usageMap[s.id] || 0,
        }));

        return NextResponse.json({
            success: true,
            salons: enriched,
            totalCount: enriched.length,
        });
    } catch (error) {
        console.error("[Dev/Salons] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { email, password, salonName, themeColor } = await request.json();

        if (!email || !password || !salonName) {
            return NextResponse.json(
                { success: false, error: "이메일, 비밀번호, 미용실 이름을 모두 입력해주세요." },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: "비밀번호는 6자 이상이어야 합니다." },
                { status: 400 }
            );
        }

        // supabaseAuth의 signUpOwner 재사용
        const { signUpOwner } = await import("@/lib/supabaseAuth");
        const result = await signUpOwner(email, password, salonName);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // 테마 및 템플릿 설정
        if (result.salonId) {
            const supabase = getServiceClient();
            if (supabase) {
                // theme_color 저장
                if (themeColor) {
                    await supabase
                        .from("salons")
                        .update({ theme_color: themeColor })
                        .eq("id", result.salonId);
                }

            }
        }

        return NextResponse.json({
            success: true,
            message: `"${salonName}" 미용실 계정이 생성되었습니다!`,
            salonId: result.salonId,
            email,
        });
    } catch (error) {
        console.error("[Dev/Salons] POST Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { salonId } = await request.json();
        if (!salonId) {
            return NextResponse.json(
                { success: false, error: "살롱 ID가 필요합니다." },
                { status: 400 }
            );
        }

        const supabase = getServiceClient();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "Supabase 미설정" },
                { status: 500 }
            );
        }

        // 살롱의 owner_id 조회
        const { data: salon } = await supabase
            .from("salons")
            .select("owner_id")
            .eq("id", salonId)
            .single();

        // 구독 삭제
        await supabase.from("subscriptions").delete().eq("salon_id", salonId);

        // 살롱 삭제
        const { error: delError } = await supabase
            .from("salons")
            .delete()
            .eq("id", salonId);

        if (delError) {
            return NextResponse.json(
                { success: false, error: delError.message },
                { status: 500 }
            );
        }

        // 해당 사장님의 다른 살롱이 없으면 Auth 유저도 삭제
        if (salon?.owner_id) {
            const { data: otherSalons } = await supabase
                .from("salons")
                .select("id")
                .eq("owner_id", salon.owner_id);

            if (!otherSalons || otherSalons.length === 0) {
                await supabase.auth.admin.deleteUser(salon.owner_id);
            }
        }

        return NextResponse.json({ success: true, message: "살롱이 삭제되었습니다." });
    } catch (error) {
        console.error("[Dev/Salons] DELETE Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}
