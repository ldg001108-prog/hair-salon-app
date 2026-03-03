-- ============================================
-- 헤어살롱 앱 - Supabase 테이블 생성 SQL
-- 실행: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. 살롱 (미용실) 테이블
CREATE TABLE IF NOT EXISTS salons (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    logo_url TEXT,
    theme_color TEXT DEFAULT '#c06c8e',
    reservation_url TEXT,
    session_timeout_min INTEGER DEFAULT 30,
    daily_limit INTEGER DEFAULT 50,
    plan TEXT DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 헤어스타일 테이블
CREATE TABLE IF NOT EXISTS hairstyles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT DEFAULT 'female',
    category TEXT DEFAULT 'medium',
    image_url TEXT,
    description TEXT,
    is_best BOOLEAN DEFAULT false,
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
    status TEXT DEFAULT 'pending',
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 합성 로그 테이블
CREATE TABLE IF NOT EXISTS synthesis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    style_name TEXT NOT NULL,
    color_hex TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    duration_ms INTEGER,
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 일일 사용량 테이블
CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    api_calls INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(salon_id, usage_date)
);

-- 6. 구독 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT REFERENCES salons(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    monthly_price INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hairstyles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 살롱: anon 키로 읽기 가능 (고개용), 소유자만 수정
CREATE POLICY "Public read salons" ON salons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owner manage salons" ON salons
    FOR ALL USING (auth.uid() = owner_id);

-- 서버사이드 계정 생성용 (service_role INSERT 허용)
CREATE POLICY "Service role insert salons" ON salons
    FOR INSERT WITH CHECK (true);

-- 헤어스타일: 공개 읽기
CREATE POLICY "Public read hairstyles" ON hairstyles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owner manage hairstyles" ON hairstyles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = hairstyles.salon_id AND salons.owner_id = auth.uid())
    );

-- 예약: 누구나 생성 가능, 살롱 소유자만 조회/수정
CREATE POLICY "Anyone create reservation" ON reservations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner manage reservations" ON reservations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = reservations.salon_id AND salons.owner_id = auth.uid())
    );

-- 합성 로그: anon 키로 삽입/읽기 가능 (API Route에서 사용)
CREATE POLICY "Anyone insert synthesis_logs" ON synthesis_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone read synthesis_logs" ON synthesis_logs
    FOR SELECT USING (true);

-- 일일 사용량: anon 키로 읽기/쓰기 가능
CREATE POLICY "Anyone manage daily_usage" ON daily_usage
    FOR ALL USING (true) WITH CHECK (true);

-- 구독: 살롱 소유자만 관리
CREATE POLICY "Owner manage subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = subscriptions.salon_id AND salons.owner_id = auth.uid())
    );

CREATE POLICY "Anyone read subscriptions" ON subscriptions
    FOR SELECT USING (true);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hairstyles_salon ON hairstyles(salon_id);
CREATE INDEX IF NOT EXISTS idx_reservations_salon ON reservations(salon_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_synthesis_logs_salon ON synthesis_logs(salon_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_usage_salon ON daily_usage(salon_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_salon ON subscriptions(salon_id);

-- ============================================
-- Storage 버킷 (합성 이미지 저장용)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('synthesis-images', 'synthesis-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 누구나 업로드/읽기 가능
CREATE POLICY "Anyone upload synthesis images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'synthesis-images');

CREATE POLICY "Anyone read synthesis images" ON storage.objects
    FOR SELECT USING (bucket_id = 'synthesis-images');

-- ============================================
-- 완료 메시지
-- ============================================
SELECT '✅ 모든 테이블이 성공적으로 생성되었습니다!' AS message;
