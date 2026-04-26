-- ============================================
-- 13_rate_limiting.sql
-- Rate Limiting Functions for MyLearning Events
-- ============================================

-- Table to track registration attempts
CREATE TABLE IF NOT EXISTS registration_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES platform_events(id) ON DELETE CASCADE,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_registration_rate_limits_user_id ON registration_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_rate_limits_window_start ON registration_rate_limits(window_start);

-- RLS
ALTER TABLE registration_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own rate limits" ON registration_rate_limits;
CREATE POLICY "Users see own rate limits" ON registration_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all rate limits" ON registration_rate_limits;
CREATE POLICY "Admins view all rate limits" ON registration_rate_limits
  FOR SELECT USING (is_admin() OR is_instructor());

-- ============================================
-- RATE LIMITING RPC FUNCTIONS
-- ============================================

/**
 * Check and enforce registration rate limiting
 * Prevents same user registering to same event multiple times within 5 minute window
 * Returns: { allowed: boolean, attempts: integer, message: string }
 */
CREATE OR REPLACE FUNCTION check_registration_rate_limit(
  p_user_id UUID,
  p_event_id UUID,
  p_max_attempts INTEGER DEFAULT 3,
  p_window_minutes INTEGER DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Get existing rate limit record
  SELECT attempt_count, window_start 
  INTO v_attempt_count, v_window_start
  FROM registration_rate_limits
  WHERE user_id = p_user_id AND event_id = p_event_id
  FOR UPDATE;

  -- Calculate window end
  v_window_end := v_window_start + INTERVAL '1 minute' * p_window_minutes;

  -- If window has expired, reset counter
  IF v_window_end < v_now OR v_attempt_count IS NULL THEN
    INSERT INTO registration_rate_limits (user_id, event_id, attempt_count, window_start)
    VALUES (p_user_id, p_event_id, 1, v_now)
    ON CONFLICT (user_id, event_id) 
    DO UPDATE SET 
      attempt_count = 1,
      window_start = v_now,
      updated_at = v_now;

    RETURN jsonb_build_object(
      'allowed', true,
      'attempts', 1,
      'message', 'Registration attempt allowed'
    );
  END IF;

  -- Check if limit exceeded
  IF v_attempt_count >= p_max_attempts THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'attempts', v_attempt_count,
      'message', format('Terlalu banyak percobaan. Silakan coba lagi dalam %s menit', 
        CEIL(EXTRACT(EPOCH FROM (v_window_end - v_now)) / 60))
    );
  END IF;

  -- Increment attempt counter
  UPDATE registration_rate_limits
  SET attempt_count = attempt_count + 1,
      updated_at = v_now
  WHERE user_id = p_user_id AND event_id = p_event_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'attempts', v_attempt_count + 1,
    'message', 'Registration attempt allowed'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'allowed', false,
    'attempts', 0,
    'message', format('Rate limit check error: %s', SQLERRM)
  );
END;
$$;

/**
 * Reset rate limit for a user (admin use only)
 */
CREATE OR REPLACE FUNCTION reset_registration_rate_limit(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin/instructor
  IF NOT (is_admin() OR is_instructor()) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  DELETE FROM registration_rate_limits
  WHERE user_id = p_user_id AND event_id = p_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rate limit reset for user'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

/**
 * Clean up expired rate limit entries (for periodic maintenance)
 */
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM registration_rate_limits
    WHERE (window_start + INTERVAL '30 minutes') < NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN QUERY SELECT v_deleted_count;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 0;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_registration_rate_limit(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_registration_rate_limit(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO authenticated;
