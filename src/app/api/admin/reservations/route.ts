/**
 * 관리자 예약 관리 API
 * GET  /api/admin/reservations?salonId=xxx  → 예약 목록
 * PUT  /api/admin/reservations              → 예약 상태 변경
 */

import { NextRequest, NextResponse } from "next/server";
import { getReservations, updateReservationStatus } from "@/lib/getSalonData";

export async function GET(request: NextRequest) {
    try {
        const salonId = request.nextUrl.searchParams.get("salonId");
        const status = request.nextUrl.searchParams.get("status") || undefined;
        const date = request.nextUrl.searchParams.get("date") || undefined;

        if (!salonId) {
            return NextResponse.json(
                { success: false, error: "salonId가 필요합니다." },
                { status: 400 }
            );
        }

        const reservations = await getReservations(salonId, { status, date, limit: 50 });

        return NextResponse.json({
            success: true,
            reservations,
        });
    } catch (error) {
        console.error("[Admin/Reservations] GET Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { reservationId, status } = await request.json();

        if (!reservationId || !status) {
            return NextResponse.json(
                { success: false, error: "reservationId와 status가 필요합니다." },
                { status: 400 }
            );
        }

        if (!["confirmed", "cancelled", "completed"].includes(status)) {
            return NextResponse.json(
                { success: false, error: "유효하지 않은 상태입니다." },
                { status: 400 }
            );
        }

        const result = await updateReservationStatus(reservationId, status);

        return NextResponse.json(result);
    } catch (error) {
        console.error("[Admin/Reservations] PUT Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// PATCH도 동일하게 처리 (관리자 대시보드 호환)
export async function PATCH(request: NextRequest) {
    return PUT(request);
}
