-- =========================================
-- 헤어살롱 앱 Supabase DB 스키마
-- =========================================
-- Supabase Dashboard > SQL Editor에서 실행하세요.
-- https://supabase.com/dashboard

-- 0. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. salons (미용실 테이블)
-- =========================================
CREATE TABLE IF NOT EXISTS salons (
    id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    theme_color TEXT DEFAULT '#c06c8e',
    reservation_url TEXT,
    phone TEXT,
    address TEXT,
    business_hours TEXT DEFAULT '10:00-20:00',
    session_timeout_min INTEGER DEFAULT 30,
    daily_limit INTEGER DEFAULT 50,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_active ON salons(is_active);

-- =========================================
-- 2. hairstyles (헤어스타일 테이블)
-- =========================================
CREATE TABLE IF NOT EXISTS hairstyles (
    id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('female', 'male')),
    category TEXT NOT NULL CHECK (category IN ('best', 'short', 'medium', 'long', 'perm', 'color')),
    image_url TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_best BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hairstyles_salon ON hairstyles(salon_id);
CREATE INDEX IF NOT EXISTS idx_hairstyles_gender ON hairstyles(salon_id, gender);

-- =========================================
-- 3. reservations (예약 테이블)
-- =========================================
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    style_name TEXT,
    color_hex TEXT,
    result_image_url TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TEXT NOT NULL,
    memo TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_salon ON reservations(salon_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(salon_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(salon_id, status);

-- =========================================
-- 4. synthesis_logs (합성 로그 테이블)
-- =========================================
CREATE TABLE IF NOT EXISTS synthesis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    style_name TEXT,
    color_hex TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER,
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_synthesis_salon ON synthesis_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_synthesis_date ON synthesis_logs(salon_id, created_at);

-- =========================================
-- 5. subscriptions (구독/결제 테이블)
-- =========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    payment_method TEXT,
    monthly_price INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_salon ON subscriptions(salon_id);

-- =========================================
-- 6. daily_usage (일일 사용량 추적)
-- =========================================
CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    api_calls INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    UNIQUE(salon_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_salon_date ON daily_usage(salon_id, usage_date);

-- =========================================
-- 7. RLS (Row Level Security) 정책
-- =========================================

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salons_select_active" ON salons FOR SELECT USING (is_active = true);
CREATE POLICY "salons_owner_all" ON salons FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE hairstyles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hairstyles_select_all" ON hairstyles FOR SELECT USING (true);
CREATE POLICY "hairstyles_owner_all" ON hairstyles FOR ALL USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = hairstyles.salon_id AND salons.owner_id = auth.uid())
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations_owner_all" ON reservations FOR ALL USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = reservations.salon_id AND salons.owner_id = auth.uid())
);
CREATE POLICY "reservations_insert_public" ON reservations FOR INSERT WITH CHECK (true);

ALTER TABLE synthesis_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synthesis_logs_insert_public" ON synthesis_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "synthesis_logs_owner_select" ON synthesis_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = synthesis_logs.salon_id AND salons.owner_id = auth.uid())
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_owner_all" ON subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = subscriptions.salon_id AND salons.owner_id = auth.uid())
);

ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_usage_insert_public" ON daily_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "daily_usage_update_public" ON daily_usage FOR UPDATE USING (true);
CREATE POLICY "daily_usage_owner_select" ON daily_usage FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = daily_usage.salon_id AND salons.owner_id = auth.uid())
);

-- =========================================
-- 8. 자동 updated_at 트리거
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salons_updated_at BEFORE UPDATE ON salons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
