/**
 * POST /api/reservations
 * 고객용 예약 생성 API
 */

import { NextRequest, NextResponse } from "next/server";
import { createReservation } from "@/lib/getSalonData";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            salonId,
            customerName,
            customerPhone,
            styleName,
            colorHex,
            resultImageUrl,
            reservationDate,
            reservationTime,
            memo,
        } = body;

        // 필수 필드 검증
        if (!salonId || !customerName || !customerPhone || !reservationDate || !reservationTime) {
            return NextResponse.json(
                { success: false, error: "필수 정보를 모두 입력해주세요. (이름, 연락처, 날짜, 시간)" },
                { status: 400 }
            );
        }

        // 전화번호 간단 검증
        const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
        if (!phoneRegex.test(customerPhone.replace(/-/g, ""))) {
            return NextResponse.json(
                { success: false, error: "올바른 휴대폰 번호를 입력해주세요." },
                { status: 400 }
            );
        }

        const result = await createReservation({
            salonId,
            customerName,
            customerPhone,
            styleName,
            colorHex,
            resultImageUrl,
            reservationDate,
            reservationTime,
            memo,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "예약이 접수되었습니다! 미용실에서 확인 후 연락드릴게요.",
            reservation: result.reservation,
        });
    } catch (error) {
        console.error("[Reservations] POST Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
