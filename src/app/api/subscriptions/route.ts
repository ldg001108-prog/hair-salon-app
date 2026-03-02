/**
 * 구독/결제 관리 API (스캐폴딩)
 * GET  /api/subscriptions?salonId=xxx  → 구독 상태 조회
 * POST /api/subscriptions              → 구독 변경 (플랜 업그레이드/다운그레이드)
 *
 * 실제 PG 결제 연동은 사업자등록 + PG사 계약 후 구현합니다.
 * 현재는 구독 상태 조회/변경 로직만 스캐폴딩합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// 플랜별 설정
const PLANS = {
    free: { name: "무료", dailyLimit: 50, maxStyles: 10, price: 0 },
    basic: { name: "베이직", dailyLimit: 500, maxStyles: 30, price: 29000 },
    pro: { name: "프로", dailyLimit: 2000, maxStyles: 999, price: 59000 },
} as const;

export async function GET(request: NextRequest) {
    try {
        const salonId = request.nextUrl.searchParams.get("salonId");
        if (!salonId) {
            return NextResponse.json(
                { success: false, error: "salonId가 필요합니다." },
                { status: 400 }
            );
        }

        const supabase = getSupabase();
        if (!supabase) {
            // Supabase 미연결 시 무료 플랜 기본값
            return NextResponse.json({
                success: true,
                subscription: {
                    plan: "free",
                    planInfo: PLANS.free,
                    status: "active",
                },
                plans: PLANS,
            });
        }

        const { data: subscription } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("salon_id", salonId)
            .eq("status", "active")
            .single();

        const currentPlan = (subscription?.plan || "free") as keyof typeof PLANS;

        return NextResponse.json({
            success: true,
            subscription: {
                ...subscription,
                planInfo: PLANS[currentPlan],
            },
            plans: PLANS,
        });
    } catch (error) {
        console.error("[Subscriptions] GET Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "결제 시스템이 준비되지 않았습니다." },
                { status: 503 }
            );
        }

        const { salonId, newPlan } = await request.json();

        if (!salonId || !newPlan) {
            return NextResponse.json(
                { success: false, error: "salonId와 newPlan이 필요합니다." },
                { status: 400 }
            );
        }

        if (!Object.keys(PLANS).includes(newPlan)) {
            return NextResponse.json(
                { success: false, error: "유효하지 않은 플랜입니다." },
                { status: 400 }
            );
        }

        const planConfig = PLANS[newPlan as keyof typeof PLANS];

        // 기존 구독 업데이트
        const { data: existing } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("salon_id", salonId)
            .eq("status", "active")
            .single();

        if (existing) {
            await supabase.from("subscriptions").update({
                plan: newPlan,
                monthly_price: planConfig.price,
            }).eq("id", existing.id);
        } else {
            await supabase.from("subscriptions").insert({
                salon_id: salonId,
                plan: newPlan,
                status: "active",
                monthly_price: planConfig.price,
            });
        }

        // 살롱 일일 한도 업데이트
        await supabase.from("salons").update({
            plan: newPlan,
            daily_limit: planConfig.dailyLimit,
        }).eq("id", salonId);

        return NextResponse.json({
            success: true,
            message: `${planConfig.name} 플랜으로 변경되었습니다.`,
            plan: newPlan,
            planInfo: planConfig,
        });
    } catch (error) {
        console.error("[Subscriptions] POST Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}
