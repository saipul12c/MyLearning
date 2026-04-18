-- ============================================
-- 10_vouchers.sql (FIXED & UPDATED)
-- MyLearning - Voucher & Discount System v2.1
-- ============================================

-- 1. Extend vouchers table with robust targeting & metadata
ALTER TABLE IF EXISTS public.vouchers 
ADD COLUMN IF NOT EXISTS category_slug TEXT,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add index for performance on targeting
CREATE INDEX IF NOT EXISTS idx_vouchers_targeting ON vouchers(category_slug, target_user_id, is_active);

-- 2. New Table: Voucher Wallet (To track saved vouchers)
CREATE TABLE IF NOT EXISTS public.voucher_wallet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT false,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    UNIQUE(user_id, voucher_id)
);

-- DYNAMIC CLEANUP: Remove all overloaded versions of functions to prevent shadowing or parameter name errors
DO $$ 
DECLARE
    _v_rec RECORD;
BEGIN
    FOR _v_rec IN 
        SELECT oid::regprocedure as function_sig
        FROM pg_proc 
        WHERE proname = 'validate_voucher_optimized' 
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || _v_rec.function_sig;
    END LOOP;
END $$;

DO $$ 
DECLARE
    _v_rec RECORD;
BEGIN
    FOR _v_rec IN 
        SELECT oid::regprocedure as function_sig
        FROM pg_proc 
        WHERE proname = 'redeem_voucher_by_id' 
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || _v_rec.function_sig;
    END LOOP;
END $$;

-- 3. Optimized Validation RPC
CREATE OR REPLACE FUNCTION validate_voucher_optimized(
    p_code TEXT,
    p_course_id UUID,
    p_instructor_id UUID,
    p_price NUMERIC,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    _v_voucher RECORD;
    _v_discount_amount NUMERIC := 0;
    _v_usage_count INTEGER;
    _v_course_category TEXT;
BEGIN
    -- 1. Fetch voucher with explicit column naming to avoid ambiguity
    SELECT * INTO _v_voucher FROM vouchers WHERE vouchers.code = p_code AND vouchers.is_active = true;
    
    IF _v_voucher.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kode voucher tidak valid atau sudah tidak aktif.');
    END IF;

    -- 2. Check Expiry
    IF _v_voucher.expiry_date IS NOT NULL AND _v_voucher.expiry_date < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher ini sudah kadaluarsa.');
    END IF;

    IF _v_voucher.start_date IS NOT NULL AND _v_voucher.start_date > NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher ini belum dapat digunakan.');
    END IF;

    -- 3. Check Usage Limit
    IF _v_voucher.usage_limit > 0 AND _v_voucher.used_count >= _v_voucher.usage_limit THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher ini sudah mencapai batas penggunaan.');
    END IF;

    -- 4. Check Individual User Limit (if applicable)
    IF p_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO _v_usage_count FROM voucher_usage WHERE voucher_id = _v_voucher.id AND user_id = p_user_id;
        IF _v_usage_count > 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Anda sudah menggunakan voucher ini.');
        END IF;
    END IF;

    -- 5. Validate Scope (Course, Instructor, Category, User)
    
    -- Course specific
    IF _v_voucher.course_id IS NOT NULL AND _v_voucher.course_id != p_course_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher ini tidak berlaku untuk kursus ini.');
    END IF;

    -- Instructor specific
    IF _v_voucher.instructor_id IS NOT NULL AND _v_voucher.instructor_id != p_instructor_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher ini tidak berlaku untuk instruktur ini.');
    END IF;

    -- Category specific
    IF _v_voucher.category_slug IS NOT NULL THEN
        SELECT c.slug INTO _v_course_category 
        FROM categories c 
        JOIN courses co ON co.category_id = c.id 
        WHERE co.id = p_course_id;

        IF _v_course_category IS NULL OR _v_course_category != _v_voucher.category_slug THEN
            RETURN jsonb_build_object('success', false, 'error', 'Voucher ini hanya berlaku untuk kategori ' || _v_voucher.category_slug || '.');
        END IF;
    END IF;

    -- User specific (Targeted Vouchers)
    IF _v_voucher.target_user_id IS NOT NULL AND (p_user_id IS NULL OR _v_voucher.target_user_id != p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher ini hanya berlaku untuk pengguna tertentu.');
    END IF;

    -- 6. Check Minimum Purchase
    IF p_price < _v_voucher.min_purchase THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pembelian minimal untuk voucher ini adalah Rp' || _v_voucher.min_purchase);
    END IF;

    -- 7. Calculate Discount
    IF _v_voucher.discount_type = 'percentage' THEN
        _v_discount_amount := (p_price * _v_voucher.discount_value / 100);
        IF _v_voucher.max_discount > 0 THEN
            _v_discount_amount := LEAST(_v_discount_amount, _v_voucher.max_discount);
        END IF;
    ELSE
        _v_discount_amount := _v_voucher.discount_value;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'discount_amount', _v_discount_amount,
        'voucher_id', _v_voucher.id,
        'final_price', GREATEST(0, p_price - _v_discount_amount)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure Redemption RPC with Atomic Updates
CREATE OR REPLACE FUNCTION redeem_voucher_by_id(
    p_voucher_id UUID,
    p_user_id UUID,
    p_enroll_id UUID
) RETURNS JSONB AS $$
DECLARE
    _v_voucher RECORD;
BEGIN
    -- Select with locking to prevent race conditions
    SELECT * INTO _v_voucher 
    FROM vouchers 
    WHERE vouchers.id = p_voucher_id
    FOR UPDATE;

    IF _v_voucher.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher tidak ditemukan.');
    END IF;

    -- Check if user has already used this voucher
    IF EXISTS (SELECT 1 FROM voucher_usage WHERE voucher_usage.voucher_id = _v_voucher.id AND user_id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anda sudah menggunakan voucher ini.');
    END IF;

    -- Check usage limit
    IF _v_voucher.usage_limit > 0 AND _v_voucher.used_count >= _v_voucher.usage_limit THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher sudah habis.');
    END IF;

    -- Record usage
    INSERT INTO voucher_usage (voucher_id, user_id, enrollment_id)
    VALUES (_v_voucher.id, p_user_id, p_enroll_id);

    -- Update voucher stats
    UPDATE vouchers 
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE vouchers.id = _v_voucher.id;

    -- Mark as used in wallet if present
    UPDATE voucher_wallet 
    SET is_used = true, used_at = NOW() 
    WHERE user_id = p_user_id AND voucher_id = _v_voucher.id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION validate_voucher_optimized TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION redeem_voucher_by_id TO authenticated, service_role;
 
 -- 5. Optimized Fetch for User Wallet
 CREATE OR REPLACE FUNCTION get_vouchers_for_user_v2(p_user_id UUID)
 RETURNS JSONB AS $$
 DECLARE
     _v_vouchers JSONB;
 BEGIN
     SELECT jsonb_agg(v) INTO _v_vouchers
     FROM (
         SELECT 
             v.*,
             i.name as instructor_name
         FROM vouchers v
         LEFT JOIN instructors i ON v.instructor_id = i.id
         WHERE v.is_active = true
           AND (v.target_user_id IS NULL OR v.target_user_id = p_user_id)
           AND v.start_date <= NOW()
           AND (v.expiry_date IS NULL OR v.expiry_date > NOW())
           AND (v.usage_limit = 0 OR v.used_count < v.usage_limit)
           AND NOT EXISTS (
               SELECT 1 FROM voucher_usage vu 
               WHERE vu.voucher_id = v.id AND vu.user_id = p_user_id
           )
         ORDER BY v.created_at DESC
     ) v;
 
     RETURN COALESCE(_v_vouchers, '[]'::jsonb);
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 
 GRANT EXECUTE ON FUNCTION get_vouchers_for_user_v2 TO authenticated, service_role;
