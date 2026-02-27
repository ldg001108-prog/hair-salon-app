/**
 * POST /api/admin/verify
 * 관리자 비밀번호 검증 API
 * - 비밀번호를 클라이언트 코드에 노출하지 않고 서버에서 검증
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { success: false, error: "비밀번호를 입력해주세요." },
                { status: 400 }
            );
        }

        // 환경변수에서 관리자 비밀번호 읽기 (기본값: 없음 → 접근 불가)
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.warn("[Admin] ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
            return NextResponse.json(
                { success: false, error: "관리자 기능이 비활성화되어 있습니다." },
                { status: 403 }
            );
        }

        if (password === adminPassword) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: "비밀번호가 틀렸습니다." },
                { status: 401 }
            );
        }
    } catch {
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
