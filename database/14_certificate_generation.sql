-- ============================================
-- 14_certificate_generation.sql
-- Certificate Generation for MyLearning Events
-- ============================================

-- Certificates table (if not already exists)
CREATE TABLE IF NOT EXISTS event_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES platform_events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  certificate_url TEXT,
  certificate_number VARCHAR(100) UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_certificates_user_id ON event_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_event_id ON event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_certificate_number ON event_certificates(certificate_number);

-- RLS
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own certificates" ON event_certificates;
CREATE POLICY "Users see own certificates" ON event_certificates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all certificates" ON event_certificates;
CREATE POLICY "Admins view all certificates" ON event_certificates
  FOR SELECT USING (is_admin() OR is_instructor());

-- ============================================
-- CERTIFICATE GENERATION RPC FUNCTIONS
-- ============================================

/**
 * Generate certificate number in format: CERT-EVENTID-DATE-RANDOMID
 */
CREATE OR REPLACE FUNCTION generate_certificate_number(p_event_id UUID)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_slug VARCHAR;
  v_cert_number VARCHAR;
  v_random_suffix VARCHAR;
BEGIN
  SELECT slug INTO v_event_slug FROM platform_events WHERE id = p_event_id;
  v_random_suffix := SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  v_cert_number := 'CERT-' || UPPER(v_event_slug) || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || v_random_suffix;
  
  RETURN v_cert_number;
EXCEPTION WHEN OTHERS THEN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
END;
$$;

/**
 * Auto-generate certificate when user is marked as attended
 * Called from trigger when registration status changes to 'attended'
 */
CREATE OR REPLACE FUNCTION generate_event_certificate(
  p_registration_id UUID,
  p_user_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cert_number VARCHAR;
  v_event_title VARCHAR;
  v_user_name VARCHAR;
  v_certificate_url TEXT;
  v_existing_cert UUID;
BEGIN
  -- Check if certificate already exists
  SELECT id INTO v_existing_cert
  FROM event_certificates
  WHERE user_id = p_user_id AND event_id = p_event_id;

  IF v_existing_cert IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Certificate already exists for this user and event',
      'certificateId', v_existing_cert
    );
  END IF;

  -- Get event and user info
  SELECT title INTO v_event_title FROM platform_events WHERE id = p_event_id;
  SELECT full_name INTO v_user_name FROM user_profiles WHERE user_id = p_user_id;

  -- Generate certificate number
  v_cert_number := generate_certificate_number(p_event_id);

  -- Generate certificate URL (template - customize based on your certificate generation service)
  -- This assumes a certificate generation endpoint exists
  v_certificate_url := '/certificates/' || p_user_id || '-' || p_event_id || '.pdf';

  -- Insert certificate record
  INSERT INTO event_certificates (
    user_id, event_id, registration_id, certificate_number, certificate_url, issued_at
  ) VALUES (
    p_user_id, p_event_id, p_registration_id, v_cert_number, v_certificate_url, NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Certificate generated successfully',
    'certificateNumber', v_cert_number,
    'issuedAt', NOW()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', format('Certificate generation error: %s', SQLERRM)
  );
END;
$$;

/**
 * Get certificate for a user and event
 */
CREATE OR REPLACE FUNCTION get_event_certificate(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'certificateNumber', certificate_number,
    'certificateUrl', certificate_url,
    'issuedAt', issued_at
  ) INTO v_result
  FROM event_certificates
  WHERE user_id = p_user_id AND event_id = p_event_id;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Certificate not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', v_result
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

/**
 * List all certificates for a user
 */
CREATE OR REPLACE FUNCTION list_user_certificates(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  event_id UUID,
  event_title VARCHAR,
  certificate_number VARCHAR,
  certificate_url TEXT,
  issued_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.event_id,
    pe.title,
    ec.certificate_number,
    ec.certificate_url,
    ec.issued_at
  FROM event_certificates ec
  JOIN platform_events pe ON ec.event_id = pe.id
  WHERE ec.user_id = p_user_id
  ORDER BY ec.issued_at DESC;
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$$;

/**
 * Revoke a certificate (admin only)
 */
CREATE OR REPLACE FUNCTION revoke_event_certificate(p_certificate_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin/instructor
  IF NOT (is_admin() OR is_instructor()) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Delete certificate
  DELETE FROM event_certificates WHERE id = p_certificate_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Certificate revoked successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_certificate_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_event_certificate(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_certificate(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION list_user_certificates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_event_certificate(UUID) TO authenticated;
