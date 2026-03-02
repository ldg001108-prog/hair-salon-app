/**
 * POST /api/auth/signup
 * 사장님 회원가입 + 살롱 자동 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { signUpOwner } from "@/lib/supabaseAuth";

export async function POST(request: NextRequest) {
    try {
        const { email, password, salonName } = await request.json();

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

        const result = await signUpOwner(email, password, salonName);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            salonId: result.salonId,
            message: `미용실 "${salonName}"이 생성되었습니다!`,
        });
    } catch (error) {
        console.error("[Auth/Signup] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
