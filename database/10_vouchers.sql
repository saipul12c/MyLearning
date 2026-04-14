-- ============================================
-- 10. VOUCHERS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value INTEGER NOT NULL,
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  min_purchase INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 0, -- 0 = unlimited
  used_count INTEGER DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  max_discount INTEGER DEFAULT 0, -- 0 = no cap
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vouchers_instructor ON vouchers(instructor_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_course ON vouchers(course_id);

COMMENT ON TABLE vouchers IS 'Tabel untuk sistem voucher diskon/redeem code';
COMMENT ON COLUMN vouchers.instructor_id IS 'Jika diisi, voucher hanya berlaku untuk kursus pengajar ini';
COMMENT ON COLUMN vouchers.course_id IS 'Jika diisi, voucher hanya berlaku untuk kursus spesifik ini';

-- Update courses to include admin discount
ALTER TABLE courses ADD COLUMN IF NOT EXISTS admin_discount_price INTEGER DEFAULT 0;

-- Update enrollments to link with vouchers
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- ============================================
-- 11. VOUCHER TRACKING & SECURITY
-- ============================================

-- Record of who used which voucher to prevent double-dipping
CREATE TABLE IF NOT EXISTS voucher_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voucher_id, user_id)
);

-- ATOMIC REDEEM FUNCTION (Strictly managed in DB)
-- This function handles the check and increment in one transaction
CREATE OR REPLACE FUNCTION redeem_voucher_by_id(
    p_voucher_id UUID,
    p_user_id UUID,
    p_enroll_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_voucher RECORD;
BEGIN
    -- 1. Lock voucher row for update to prevent race conditions
    SELECT * INTO v_voucher 
    FROM vouchers 
    WHERE id = p_voucher_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher tidak ditemukan atau sudah tidak aktif.');
    END IF;

    -- 2. Check Expiry
    IF v_voucher.expiry_date IS NOT NULL AND v_voucher.expiry_date < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher sudah kadaluarsa.');
    END IF;

    -- 3. Check Global Limit
    IF v_voucher.usage_limit > 0 AND v_voucher.used_count >= v_voucher.usage_limit THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kuota voucher sudah habis.');
    END IF;

    -- 4. Check Per-User Limit (One use per person)
    IF EXISTS (SELECT 1 FROM voucher_usage WHERE voucher_id = v_voucher.id AND user_id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anda sudah pernah menggunakan voucher ini.');
    END IF;

    -- 5. PERFORM REDEMPTION
    UPDATE vouchers 
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = v_voucher.id;

    INSERT INTO voucher_usage (voucher_id, user_id, enrollment_id)
    VALUES (v_voucher.id, p_user_id, p_enroll_id);

    RETURN jsonb_build_object('success', true, 'voucher_id', v_voucher.id);
END;
$$ LANGUAGE plpgsql;

-- Optimized 1-Shot Validation RPC
CREATE OR REPLACE FUNCTION validate_voucher_optimized(
    p_code TEXT,
    p_course_id UUID,
    p_instructor_id UUID,
    p_price INTEGER,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_voucher RECORD;
    v_usage_exists BOOLEAN := FALSE;
    v_discount_amount INTEGER := 0;
BEGIN
    SELECT * INTO v_voucher FROM vouchers WHERE code = p_code AND is_active = true LIMIT 1;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Kode voucher tidak valid.'); END IF;
    IF v_voucher.expiry_date IS NOT NULL AND v_voucher.expiry_date < NOW() THEN RETURN jsonb_build_object('success', false, 'error', 'Voucher kadaluarsa.'); END IF;
    IF v_voucher.usage_limit > 0 AND v_voucher.used_count >= v_voucher.usage_limit THEN RETURN jsonb_build_object('success', false, 'error', 'Kuota habis.'); END IF;
    IF p_user_id IS NOT NULL THEN
        SELECT EXISTS (SELECT 1 FROM voucher_usage WHERE voucher_id = v_voucher.id AND user_id = p_user_id) INTO v_usage_exists;
        IF v_usage_exists THEN RETURN jsonb_build_object('success', false, 'error', 'Sudah pernah digunakan.'); END IF;
    END IF;
    IF v_voucher.min_purchase > 0 AND p_price < v_voucher.min_purchase THEN RETURN jsonb_build_object('success', false, 'error', 'Min. pembelian tidak terpenuhi.'); END IF;
    IF v_voucher.course_id IS NOT NULL AND v_voucher.course_id != p_course_id THEN RETURN jsonb_build_object('success', false, 'error', 'Tidak berlaku untuk kursus ini.'); END IF;
    IF v_voucher.instructor_id IS NOT NULL AND v_voucher.instructor_id != p_instructor_id THEN RETURN jsonb_build_object('success', false, 'error', 'Tidak berlaku untuk instruktur ini.'); END IF;
    IF v_voucher.discount_type = 'percentage' THEN 
        v_discount_amount := floor((p_price * v_voucher.discount_value) / 100); 
        -- Apply max discount cap if defined
        IF v_voucher.max_discount > 0 AND v_discount_amount > v_voucher.max_discount THEN
            v_discount_amount := v_voucher.max_discount;
        END IF;
    ELSE 
        v_discount_amount := v_voucher.discount_value; 
    END IF;

    IF v_discount_amount > p_price THEN v_discount_amount := p_price; END IF;
    RETURN jsonb_build_object('success', true, 'discount_amount', v_discount_amount, 'voucher', jsonb_build_object('id', v_voucher.id, 'code', v_voucher.code, 'discount_type', v_voucher.discount_type, 'discount_value', v_voucher.discount_value, 'max_discount', v_voucher.max_discount, 'instructor_id', v_voucher.instructor_id, 'course_id', v_voucher.course_id, 'min_purchase', v_voucher.min_purchase, 'usage_limit', v_voucher.usage_limit, 'used_count', v_voucher.used_count, 'expiry_date', v_voucher.expiry_date, 'is_active', v_voucher.is_active, 'created_at', v_voucher.created_at));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_voucher_optimized TO anon, authenticated, service_role;

