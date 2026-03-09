/**
 * 미용실 데이터 조회 함수
 * - Supabase 연결 시: DB에서 조회
 * - 미연결 시: demo.ts 폴백
 */

import { getSupabase } from "./supabase";
import { DEMO_SALON, DEMO_HAIRSTYLES, type Salon, type Hairstyle } from "@/data/demo";

/**
 * 미용실 정보 조회
 */
export async function getSalon(salonId: string): Promise<Salon | null> {
    const supabase = getSupabase();

    if (supabase) {
        const { data, error } = await supabase
            .from("salons")
            .select("*")
            .eq("id", salonId)
            .eq("is_active", true)
            .single();

        if (data && !error) {
            return {
                id: data.id,
                name: data.name,
                logoUrl: data.logo_url || undefined,
                themeColor: data.theme_color || "#c06c8e",
                reservationUrl: data.reservation_url || undefined,
                sessionTimeoutMin: data.session_timeout_min || 30,
                dailyLimit: data.daily_limit || 10,
            };
        }
    }

    // 폴백: 데모 데이터
    if (salonId === "demo") {
        return DEMO_SALON;
    }

    return null;
}

/**
 * 미용실 헤어스타일 목록 조회
 */
export async function getHairstyles(salonId: string): Promise<Hairstyle[]> {
    const supabase = getSupabase();

    if (supabase) {
        const { data, error } = await supabase
            .from("hairstyles")
            .select("*")
            .eq("salon_id", salonId)
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (data && !error && data.length > 0) {
            return data.map((d) => ({
                id: d.id,
                salonId: d.salon_id,
                name: d.name,
                category: d.category as Hairstyle["category"],
                gender: d.gender as Hairstyle["gender"],
                imageUrl: d.image_url || "",
                story: d.description || "",
                isBest: d.is_best || false,
            }));
        }
    }

    // 폴백: 데모 데이터
    if (salonId === "demo") {
        return DEMO_HAIRSTYLES;
    }
    return DEMO_HAIRSTYLES; // Supabase 미설정 시 데모 데이터
}

/**
 * 합성 기록 저장
 */
export async function logSynthesis(params: {
    salonId: string;
    styleName: string;
    colorHex?: string;
    success: boolean;
    errorMessage?: string;
    durationMs?: number;
    clientIp?: string;
    userAgent?: string;
}): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
        // 합성 로그 저장
        await supabase.from("synthesis_logs").insert({
            salon_id: params.salonId,
            style_name: params.styleName,
            color_hex: params.colorHex || null,
            success: params.success,
            error_message: params.errorMessage || null,
            duration_ms: params.durationMs || null,
            client_ip: params.clientIp || null,
            user_agent: params.userAgent || null,
        });

        // 일일 사용량 업데이트 (upsert)
        const today = new Date().toISOString().slice(0, 10);
        const { data: existing } = await supabase
            .from("daily_usage")
            .select("id, api_calls, success_count, fail_count")
            .eq("salon_id", params.salonId)
            .eq("usage_date", today)
            .single();

        if (existing) {
            await supabase.from("daily_usage").update({
                api_calls: existing.api_calls + 1,
                success_count: existing.success_count + (params.success ? 1 : 0),
                fail_count: existing.fail_count + (params.success ? 0 : 1),
            }).eq("id", existing.id);
        } else {
            await supabase.from("daily_usage").insert({
                salon_id: params.salonId,
                usage_date: today,
                api_calls: 1,
                success_count: params.success ? 1 : 0,
                fail_count: params.success ? 0 : 1,
            });
        }
    } catch (err) {
        console.error("[logSynthesis] Failed:", err);
    }
}

// ========================
// 예약 관련 함수
// ========================

/**
 * 예약 생성 (고객용)
 */
export async function createReservation(params: {
    salonId: string;
    customerName: string;
    customerPhone: string;
    styleName?: string;
    colorHex?: string;
    resultImageUrl?: string;
    reservationDate: string;
    reservationTime: string;
    memo?: string;
}) {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: "예약 시스템이 준비되지 않았습니다." };
    }

    const { data, error } = await supabase.from("reservations").insert({
        salon_id: params.salonId,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        style_name: params.styleName || null,
        color_hex: params.colorHex || null,
        result_image_url: params.resultImageUrl || null,
        reservation_date: params.reservationDate,
        reservation_time: params.reservationTime,
        memo: params.memo || null,
    }).select().single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, reservation: data };
}

/**
 * 예약 목록 조회 (관리자용)
 */
export async function getReservations(salonId: string, options?: {
    status?: string;
    date?: string;
    limit?: number;
}) {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase
        .from("reservations")
        .select("*")
        .eq("salon_id", salonId)
        .order("reservation_date", { ascending: false })
        .order("reservation_time", { ascending: false });

    if (options?.status) {
        query = query.eq("status", options.status);
    }
    if (options?.date) {
        query = query.eq("reservation_date", options.date);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data } = await query;
    return data || [];
}

/**
 * 예약 상태 변경 (관리자용)
 */
export async function updateReservationStatus(
    reservationId: string,
    status: "confirmed" | "cancelled" | "completed"
) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "DB 미연결" };

    const { error } = await supabase
        .from("reservations")
        .update({ status })
        .eq("id", reservationId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ========================
// 통계 관련 함수
// ========================

/**
 * 살롱 통계 조회 (관리자용)
 */
export async function getSalonStats(salonId: string) {
    const supabase = getSupabase();
    if (!supabase) {
        return {
            todayCalls: 0,
            totalCalls: 0,
            successRate: 0,
            todayReservations: 0,
            pendingReservations: 0,
            popularStyles: [] as { name: string; count: number }[],
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 오늘 사용량 (api_logs 기반)
    const { data: todayLogs } = await supabase
        .from("api_logs")
        .select("success")
        .eq("salon_id", salonId)
        .gte("created_at", todayISO);

    const todayCalls = todayLogs?.length || 0;
    const todaySuccess = todayLogs?.filter(l => l.success).length || 0;

    // 전체 사용량 (api_logs 기반)
    const { data: allLogs } = await supabase
        .from("api_logs")
        .select("success")
        .eq("salon_id", salonId);

    const totalCalls = allLogs?.length || 0;
    const totalSuccess = allLogs?.filter(l => l.success).length || 0;

    // 오늘 예약
    const { count: todayReservations } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", salonId)
        .eq("reservation_date", today);

    // 대기 중 예약
    const { count: pendingReservations } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", salonId)
        .eq("status", "pending");

    // 인기 스타일 (최근 30일)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: styleLogs } = await supabase
        .from("synthesis_logs")
        .select("style_name")
        .eq("salon_id", salonId)
        .eq("success", true)
        .gte("created_at", thirtyDaysAgo);

    const styleCount: Record<string, number> = {};
    styleLogs?.forEach((log) => {
        if (log.style_name) {
            styleCount[log.style_name] = (styleCount[log.style_name] || 0) + 1;
        }
    });

    const popularStyles = Object.entries(styleCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return {
        todayCalls,
        totalCalls,
        successRate: totalCalls > 0 ? Math.round((totalSuccess / totalCalls) * 100) : 0,
        todayReservations: todayReservations || 0,
        pendingReservations: pendingReservations || 0,
        popularStyles,
    };
}

/**
 * 살롱별 오늘 사용량 조회 (Rate Limit용) — api_logs 기반
 */
export async function getTodayUsage(salonId: string): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) return 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from("api_logs")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", salonId)
        .eq("success", true)
        .gte("created_at", todayStart.toISOString());

    return count || 0;
}
