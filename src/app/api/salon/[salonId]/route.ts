/**
 * GET /api/salon/[salonId]
 * 미용실 정보 조회 API (공개용)
 * - Supabase 연결 시: DB에서 조회
 * - 미연결 시: 데모 데이터 폴백
 */

import { NextRequest, NextResponse } from "next/server";
import { getSalon } from "@/lib/getSalonData";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ salonId: string }> }
) {
    const { salonId } = await params;

    if (!salonId) {
        return NextResponse.json(
            { success: false, error: "salonId가 필요합니다." },
            { status: 400 }
        );
    }

    try {
        const salon = await getSalon(salonId);

        if (!salon) {
            return NextResponse.json(
                { success: false, error: "미용실을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            salon,
        });
    } catch (error) {
        console.error("[Salon API] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
