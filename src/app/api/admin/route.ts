/**
 * POST /api/admin        → 관리자 비밀번호 검증
 * PATCH /api/admin       → 살롱 정보 수정 (이름, 테마컬러, 로고 등)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

// Service Role 클라이언트 (auth.admin API용)
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
    try {
        const { password, salonId } = await request.json();

        if (!password) {
            return NextResponse.json(
                { success: false, error: "비밀번호를 입력해주세요." },
                { status: 400 }
            );
        }

        // 1) 슈퍼 관리자 비밀번호 체크 (환경변수)
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminPassword && password === adminPassword) {
            return NextResponse.json({ success: true });
        }

        // 2) 살롱 오너 비밀번호 체크 (salonId가 있을 때)
        if (salonId) {
            const serviceClient = getServiceClient();
            if (serviceClient) {
                // salon의 owner_id 조회
                const { data: salon, error: salonError } = await serviceClient
                    .from("salons")
                    .select("owner_id")
                    .eq("id", salonId)
                    .single();

                if (salonError) {
                    console.warn(`[Admin] 살롱 조회 실패: salonId=${salonId}, error=${salonError.message}`);
                }

                if (salon?.owner_id) {
                    // owner의 email 조회 (auth.admin API — service_role 필수)
                    const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(salon.owner_id);

                    if (userError) {
                        console.warn(`[Admin] 유저 조회 실패: owner_id=${salon.owner_id}, error=${userError.message}`);
                    }

                    if (userData?.user?.email) {
                        // 해당 이메일+입력 비밀번호로 로그인 시도
                        const { error: signInError } = await serviceClient.auth.signInWithPassword({
                            email: userData.user.email,
                            password,
                        });

                        if (!signInError) {
                            return NextResponse.json({ success: true });
                        }
                        console.warn(`[Admin] 로그인 실패: email=${userData.user.email}`);
                    }
                }
            } else {
                console.warn("[Admin] SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
            }
        }

        // 3) 모두 실패
        return NextResponse.json(
            { success: false, error: "비밀번호가 틀렸습니다." },
            { status: 401 }
        );
    } catch (err) {
        console.error("[Admin] POST Error:", err);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin — 살롱 정보 수정
 * Body: { salonId, name?, themeColor?, logoUrl? }
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "DB가 연결되지 않았습니다." },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { salonId, name, themeColor, logoUrl, phone, address } = body;

        if (!salonId) {
            return NextResponse.json(
                { success: false, error: "salonId가 필요합니다." },
                { status: 400 }
            );
        }

        // 업데이트할 필드 구성
        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (themeColor !== undefined) updates["theme_color"] = themeColor;
        if (logoUrl !== undefined) updates["logo_url"] = logoUrl;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        updates["updated_at"] = new Date().toISOString();

        if (Object.keys(updates).length <= 1) {
            return NextResponse.json(
                { success: false, error: "수정할 항목이 없습니다." },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("salons")
            .update(updates)
            .eq("id", salonId);

        if (error) {
            console.error("[Admin] PATCH Error:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, message: "살롱 정보가 수정되었습니다." });
    } catch (error) {
        console.error("[Admin] PATCH Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
