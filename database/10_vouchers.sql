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

