/**
 * Supabase Auth 헬퍼
 * - 사장님 회원가입/로그인/세션 관리
 * - 서버사이드: SERVICE_ROLE_KEY 사용 (RLS 우회)
 * - 클라이언트사이드: ANON_KEY 사용
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

// 서버사이드 전용 (RLS 우회)
function getServiceSupabase(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        // service key가 없으면 일반 클라이언트 사용 (폴백)
        return getSupabase();
    }

    return createClient(url, serviceKey);
}

// ========================
// 아이디 → 이메일 형식 변환 (Supabase Auth는 이메일 필수)
// ========================
function toAuthEmail(id: string): string {
    return id.includes("@") ? id : `${id}@salon.local`;
}

// ========================
// 회원가입
// ========================
export async function signUpOwner(email: string, password: string, salonName: string) {
    const supabase = getServiceSupabase();
    if (!supabase) {
        return { success: false, error: "Supabase가 설정되지 않았습니다." };
    }

    // 1. Supabase Auth 회원가입 (아이디 → 이메일 변환)
    const authEmail = toAuthEmail(email);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password,
    });

    if (authError || !authData.user) {
        return { success: false, error: authError?.message || "회원가입 실패" };
    }

    // 2. 살롱 자동 생성
    const salonId = generateSalonId(salonName);
    const { error: salonError } = await supabase.from("salons").insert({
        id: salonId,
        owner_id: authData.user.id,
        name: salonName,
        plan: "free",
        daily_limit: 10,
    });

    if (salonError) {
        return { success: false, error: `살롱 생성 실패: ${salonError.message}` };
    }

    // 3. 무료 구독 생성
    await supabase.from("subscriptions").insert({
        salon_id: salonId,
        plan: "free",
        status: "active",
        monthly_price: 0,
    });

    return {
        success: true,
        user: authData.user,
        salonId,
        session: authData.session,
    };
}

// ========================
// 로그인
// ========================
export async function signInOwner(email: string, password: string) {
    const supabase = getServiceSupabase();
    if (!supabase) {
        return { success: false, error: "Supabase가 설정되지 않았습니다." };
    }

    const authEmail = toAuthEmail(email);
    const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
    });

    if (error || !data.user) {
        return { success: false, error: error?.message || "로그인 실패" };
    }

    // 소유한 살롱 정보 조회
    const { data: salons } = await supabase
        .from("salons")
        .select("id, name, plan")
        .eq("owner_id", data.user.id)
        .eq("is_active", true);

    return {
        success: true,
        user: data.user,
        session: data.session,
        salons: salons || [],
    };
}

// ========================
// 로그아웃
// ========================
export async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.auth.signOut();
}

// ========================
// 현재 세션 확인
// ========================
export async function getCurrentSession() {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase.auth.getSession();
    return data.session;
}

// ========================
// 현재 사용자의 살롱 목록 조회
// ========================
export async function getOwnedSalons() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from("salons")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_active", true);

    return data || [];
}

// ========================
// 살롱 소유권 검증
// ========================
export async function verifySalonOwnership(salonId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from("salons")
        .select("id")
        .eq("id", salonId)
        .eq("owner_id", user.id)
        .single();

    return !!data;
}

// ========================
// salonId 생성 유틸
// ========================
function generateSalonId(name: string): string {
    // 한글 → 영문 변환 (간단한 방식)
    const romanized = name
        .replace(/[^a-zA-Z0-9가-힣]/g, "")
        .toLowerCase()
        .slice(0, 20);

    const suffix = Math.random().toString(36).slice(2, 8);
    return romanized ? `${romanized}-${suffix}` : `salon-${suffix}`;
}
