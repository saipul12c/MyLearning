-- ============================================
-- 08_signatures.sql
-- Digital Signature Verification Fields
-- ============================================

-- 1. Update user_profiles (for Admin signatures)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS signature_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS signature_last_updated TIMESTAMPTZ;

-- 2. Update instructors (for Instructor signatures)
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS signature_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS signature_last_updated TIMESTAMPTZ;

-- 3. Update certificates (to lock signature versions)
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS instructor_signature_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS admin_signature_id VARCHAR(100);

-- 4. Create Storage Bucket (Note: This usually needs to be done via Supabase Dashboard or CLI)
-- For the sake of this prompt, we assume the bucket 'signatures' exists and is private.
