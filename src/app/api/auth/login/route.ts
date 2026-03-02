/**
 * POST /api/auth/login
 * 사장님 로그인
 */

import { NextRequest, NextResponse } from "next/server";
import { signInOwner } from "@/lib/supabaseAuth";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: "이메일과 비밀번호를 입력해주세요." },
                { status: 400 }
            );
        }

        const result = await signInOwner(email, password);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: { id: result.user!.id, email: result.user!.email },
            salons: result.salons,
            accessToken: result.session?.access_token,
        });
    } catch (error) {
        console.error("[Auth/Login] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
