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

-- 4. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Policies for 'signatures'
-- Allow public read access (Needed for certificate verification)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'signatures' );

-- Allow ONLY admins and instructors to upload signatures
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authorized Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( 
  bucket_id = 'signatures' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'instructor')
  )
);

-- Allow users to manage ONLY their own signature files if they have the right role
DROP POLICY IF EXISTS "Owner Update/Delete" ON storage.objects;
DROP POLICY IF EXISTS "Owner Management" ON storage.objects;
CREATE POLICY "Owner Management"
ON storage.objects FOR ALL
TO authenticated
USING ( 
  bucket_id = 'signatures' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'instructor')
  ) AND
  name LIKE 'signatures/' || auth.uid()::text || '%'
);
