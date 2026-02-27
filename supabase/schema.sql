-- =============================================
-- AI Hair Studio — Supabase 스키마
-- supabase.com에서 SQL Editor에 붙여넣기
-- =============================================

-- 1) 미용실 테이블
CREATE TABLE IF NOT EXISTS salons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'AI Hair Studio',
    logo_url TEXT,
    theme_color TEXT DEFAULT '#c06c8e',
    reservation_url TEXT,
    daily_limit INTEGER DEFAULT 50,
    session_timeout_min INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) 헤어스타일 테이블
CREATE TABLE IF NOT EXISTS hairstyles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('short', 'medium', 'long', 'perm')),
    gender TEXT NOT NULL CHECK (gender IN ('female', 'male')),
    image_url TEXT,
    description TEXT,
    is_best BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) 합성 기록 테이블
CREATE TABLE IF NOT EXISTS synthesis_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    style_name TEXT NOT NULL,
    color_hex TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    duration_ms INTEGER,
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_hairstyles_salon ON hairstyles(salon_id);
CREATE INDEX IF NOT EXISTS idx_hairstyles_gender_cat ON hairstyles(salon_id, gender, category);
CREATE INDEX IF NOT EXISTS idx_synthesis_salon ON synthesis_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_synthesis_created ON synthesis_logs(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hairstyles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 누구나 활성화된 미용실과 그 스타일을 볼 수 있음
CREATE POLICY "salons_read" ON salons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "hairstyles_read" ON hairstyles FOR SELECT USING (TRUE);
CREATE POLICY "synthesis_insert" ON synthesis_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "synthesis_read" ON synthesis_logs FOR SELECT USING (TRUE);

-- =============================================
-- 데모 시드 데이터
-- =============================================
INSERT INTO salons (id, name, theme_color, daily_limit) VALUES
    ('demo', 'AI Hair Studio', '#c06c8e', 50)
ON CONFLICT (id) DO NOTHING;
