/**
 * POST /api/admin/create-salon
 * 슈퍼어드민 전용 — 미용실 계정 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { signUpOwner } from "@/lib/supabaseAuth";

// 슈퍼어드민 키 (SUPER_ADMIN_KEY 필수, ADMIN_PASSWORD fallback 제거)
const SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY;

export async function POST(request: NextRequest) {
    try {
        // 슈퍼어드민 키가 설정되지 않은 경우 API 비활성화
        if (!SUPER_ADMIN_KEY) {
            return NextResponse.json(
                { success: false, error: "서버에 SUPER_ADMIN_KEY가 설정되지 않았습니다." },
                { status: 500 }
            );
        }

        const { adminKey, email, password, salonName, themeColor, logoUrl } = await request.json();

        // 슈퍼어드민 인증
        if (!adminKey || adminKey !== SUPER_ADMIN_KEY) {
            return NextResponse.json(
                { success: false, error: "관리자 인증에 실패했습니다." },
                { status: 403 }
            );
        }

        // 필수 값 확인
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

        // Supabase에 계정 생성 + 살롱 생성
        const result = await signUpOwner(email, password, salonName);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // 살롱 커스텀 설정 (service_role 키로 RLS 우회)
        if (result.salonId && (themeColor || logoUrl)) {
            try {
                const { createClient } = await import("@supabase/supabase-js");
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                const updateData: Record<string, string> = {};
                if (themeColor) updateData.themeColor = themeColor;
                if (logoUrl) updateData.logoUrl = logoUrl;

                await supabase
                    .from("salons")
                    .update(updateData)
                    .eq("id", result.salonId);
            } catch (e) {
                console.error("[CreateSalon] 살롱 설정 업데이트 실패:", e);
            }
        }

        return NextResponse.json({
            success: true,
            message: `미용실 "${salonName}" 계정이 생성되었습니다!`,
            salonId: result.salonId,
            credentials: {
                loginUrl: `/admin/login`,
                customerUrl: `/salon/${result.salonId}`,
                email,
            },
        });
    } catch (error) {
        console.error("[Admin/CreateSalon] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
