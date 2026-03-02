/**
 * GET /api/auth/session
 * 현재 세션 확인 + 소유 살롱 목록 반환
 */

import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ authenticated: false, salons: [] });
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ authenticated: false, salons: [] });
        }

        const { data: salons } = await supabase
            .from("salons")
            .select("id, name, plan, is_active, created_at")
            .eq("owner_id", user.id)
            .eq("is_active", true);

        return NextResponse.json({
            authenticated: true,
            user: { id: user.id, email: user.email },
            salons: salons || [],
        });
    } catch (error) {
        console.error("[Auth/Session] Error:", error);
        return NextResponse.json({ authenticated: false, salons: [] });
    }
}
