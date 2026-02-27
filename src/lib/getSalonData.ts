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
                dailyLimit: data.daily_limit || 50,
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
    return DEMO_HAIRSTYLES;
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
    if (!supabase) return; // Supabase 미설정 시 무시

    try {
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
    } catch (err) {
        console.error("[logSynthesis] Failed:", err);
    }
}
