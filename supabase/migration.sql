-- ═══════════════════════════════════════════
-- AI Hair Studio — Supabase 마이그레이션 SQL
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- ═══════════════════════════════════════════

-- 1. 살롱 테이블
CREATE TABLE IF NOT EXISTS salons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'AI Hair Studio',
    owner_id UUID REFERENCES auth.users(id),
    logo_url TEXT,
    theme_color TEXT DEFAULT '#2563EB',
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
    daily_limit INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 헤어스타일 테이블
CREATE TABLE IF NOT EXISTS hairstyles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'medium' CHECK (category IN ('short', 'medium', 'long', 'perm', 'best')),
    gender TEXT DEFAULT 'female' CHECK (gender IN ('female', 'male', 'unisex')),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    style_name TEXT,
    color_hex TEXT,
    result_image_url TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TEXT NOT NULL,
    memo TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 합성 로그 테이블
CREATE TABLE IF NOT EXISTS synthesis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    style_name TEXT,
    color_hex TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER,
    result_image_url TEXT,
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 일일 사용량 테이블
CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 1,
    UNIQUE (salon_id, date)
);

-- 6. 구독 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    monthly_price INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 합성 이미지 저장소 (메타데이터)
CREATE TABLE IF NOT EXISTS salon_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════
-- 인덱스
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_reservations_salon_date ON reservations(salon_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_synthesis_logs_salon ON synthesis_logs(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_salon_date ON daily_usage(salon_id, date);
CREATE INDEX IF NOT EXISTS idx_hairstyles_salon ON hairstyles(salon_id, category);

-- ═══════════════════════════════════════════
-- RLS (Row Level Security) 정책
-- ═══════════════════════════════════════════

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hairstyles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_images ENABLE ROW LEVEL SECURITY;

-- 살롱: 공개 읽기, 소유자만 수정
CREATE POLICY "salons_read" ON salons FOR SELECT USING (true);
CREATE POLICY "salons_owner_update" ON salons FOR UPDATE USING (auth.uid() = owner_id);

-- 헤어스타일: 공개 읽기
CREATE POLICY "hairstyles_read" ON hairstyles FOR SELECT USING (true);
CREATE POLICY "hairstyles_owner_manage" ON hairstyles FOR ALL
    USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = hairstyles.salon_id AND salons.owner_id = auth.uid()));

-- 예약: 누구나 생성, 살롱 소유자만 조회/수정
CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_owner_read" ON reservations FOR SELECT
    USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = reservations.salon_id AND salons.owner_id = auth.uid()));
CREATE POLICY "reservations_owner_update" ON reservations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = reservations.salon_id AND salons.owner_id = auth.uid()));

-- 합성 로그: 서비스 역할만 삽입, 소유자 조회
CREATE POLICY "synthesis_logs_insert" ON synthesis_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "synthesis_logs_owner_read" ON synthesis_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = synthesis_logs.salon_id AND salons.owner_id = auth.uid()));

-- 일일 사용량: 서비스 역할 관리
CREATE POLICY "daily_usage_all" ON daily_usage FOR ALL USING (true);

-- 구독: 소유자만 조회
CREATE POLICY "subscriptions_owner" ON subscriptions FOR ALL
    USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = subscriptions.salon_id AND salons.owner_id = auth.uid()));

-- 이미지: 공개 읽기, 서비스 역할 삽입
CREATE POLICY "salon_images_read" ON salon_images FOR SELECT USING (true);
CREATE POLICY "salon_images_insert" ON salon_images FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════
-- Storage 버킷 (Supabase 대시보드에서 수동 생성 필요)
-- 버킷명: synthesis-results
-- 공개: ON (Public)
-- ═══════════════════════════════════════════

-- 데모 살롱 기본 데이터 삽입
INSERT INTO salons (id, name, theme_color, plan, daily_limit) 
VALUES ('demo', '스타일랩 헤어', '#c96b9e', 'free', 50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (salon_id, plan, status, monthly_price) 
VALUES ('demo', 'free', 'active', 0)
ON CONFLICT DO NOTHING;
