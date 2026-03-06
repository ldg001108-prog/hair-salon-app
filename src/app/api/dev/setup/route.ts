/**
 * POST /api/dev/setup
 * 개발자 대시보드 — 초기 설정 (api_logs 테이블 생성)
 * Supabase service role로 raw SQL 실행
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            return NextResponse.json(
                { success: false, error: "Supabase 미설정" },
                { status: 500 }
            );
        }

        const supabase = createClient(url, key);

        // api_logs 테이블이 있는지 확인
        const { error: checkError } = await supabase
            .from("api_logs")
            .select("id")
            .limit(0);

        if (checkError && checkError.message.includes("does not exist")) {
            // exec_sql RPC가 없으면 생성 불가 — 사용자에게 SQL 제공
            return NextResponse.json({
                success: false,
                needsManualSetup: true,
                message: "api_logs 테이블을 Supabase SQL 에디터에서 직접 생성해주세요.",
                sql: `CREATE TABLE IF NOT EXISTS api_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id text,
  endpoint text NOT NULL DEFAULT 'transform',
  success boolean NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_logs_salon ON api_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);`,
            });
        }

        return NextResponse.json({
            success: true,
            message: "api_logs 테이블이 이미 존재합니다.",
        });
    } catch (error) {
        console.error("[Dev/Setup] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류" },
            { status: 500 }
        );
    }
}
