/**
 * 관리자 스타일 관리 API
 * GET    /api/admin/styles?salonId=xxx  → 스타일 목록
 * POST   /api/admin/styles             → 스타일 추가
 * PUT    /api/admin/styles             → 스타일 수정
 * DELETE /api/admin/styles             → 스타일 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getHairstyles } from "@/lib/getSalonData";

export async function GET(request: NextRequest) {
    try {
        const salonId = request.nextUrl.searchParams.get("salonId");
        if (!salonId) {
            return NextResponse.json(
                { success: false, error: "salonId가 필요합니다." },
                { status: 400 }
            );
        }

        const hairstyles = await getHairstyles(salonId);
        return NextResponse.json({ success: true, hairstyles });
    } catch (error) {
        console.error("[Admin/Styles] GET Error:", error);
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
                { success: false, error: "DB가 연결되지 않았습니다." },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { salonId, name, gender, category, imageUrl, description, isBest, sortOrder } = body;

        if (!salonId || !name || !gender || !category || !imageUrl) {
            return NextResponse.json(
                { success: false, error: "필수 필드를 모두 입력해주세요." },
                { status: 400 }
            );
        }

        const { data, error } = await supabase.from("hairstyles").insert({
            salon_id: salonId,
            name,
            gender,
            category,
            image_url: imageUrl,
            description: description || "",
            is_best: isBest || false,
            sort_order: sortOrder || 0,
        }).select().single();

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, hairstyle: data });
    } catch (error) {
        console.error("[Admin/Styles] POST Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "DB가 연결되지 않았습니다." },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "스타일 ID가 필요합니다." },
                { status: 400 }
            );
        }

        // camelCase → snake_case 변환
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.isBest !== undefined) dbUpdates.is_best = updates.isBest;
        if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { error } = await supabase
            .from("hairstyles")
            .update(dbUpdates)
            .eq("id", id);

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin/Styles] PUT Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "DB가 연결되지 않았습니다." },
                { status: 503 }
            );
        }

        const { id } = await request.json();
        if (!id) {
            return NextResponse.json(
                { success: false, error: "스타일 ID가 필요합니다." },
                { status: 400 }
            );
        }

        // 소프트 삭제 (is_active = false)
        const { error } = await supabase
            .from("hairstyles")
            .update({ is_active: false })
            .eq("id", id);

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin/Styles] DELETE Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}
