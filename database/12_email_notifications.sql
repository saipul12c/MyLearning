-- ============================================
-- 12_email_notifications.sql
-- Email Notification System for MyLearning Events
-- ============================================

-- Table to track email sending
CREATE TABLE IF NOT EXISTS event_email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES platform_events(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- registration, payment_approved, reminder, recording_available
  email_address VARCHAR(300) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_email_logs_user_id ON event_email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_email_logs_event_id ON event_email_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_email_logs_status ON event_email_logs(status);

-- RLS for event_email_logs
ALTER TABLE event_email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View own email logs" ON event_email_logs;
CREATE POLICY "View own email logs" ON event_email_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all email logs" ON event_email_logs;
CREATE POLICY "Admins view all email logs" ON event_email_logs
  FOR SELECT USING (is_admin() OR is_instructor());

-- ============================================
-- RPC FUNCTIONS FOR EMAIL NOTIFICATIONS
-- ============================================

-- 1. Send Registration Confirmation Email
CREATE OR REPLACE FUNCTION send_registration_email(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_event_title TEXT;
  v_event_link TEXT;
  v_result jsonb;
BEGIN
  -- Get user email and event details
  SELECT up.email INTO v_user_email
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  SELECT pe.title, pe.slug INTO v_event_title, v_event_link
  FROM platform_events pe
  WHERE pe.id = p_event_id;

  IF v_user_email IS NULL OR v_event_title IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User or event not found');
  END IF;

  -- Log the email
  INSERT INTO event_email_logs (user_id, event_id, email_type, email_address, status)
  VALUES (p_user_id, p_event_id, 'registration', v_user_email, 'pending');

  -- TODO: Integrate with Resend/SendGrid
  -- For now, return success for testing
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Confirmation email queued for sending',
    'email', v_user_email,
    'event', v_event_title
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 2. Send Payment Approved Email
CREATE OR REPLACE FUNCTION send_payment_approved_email(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_event_title TEXT;
  v_event_link TEXT;
  v_result jsonb;
BEGIN
  SELECT up.email INTO v_user_email
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  SELECT pe.title, pe.slug INTO v_event_title, v_event_link
  FROM platform_events pe
  WHERE pe.id = p_event_id;

  IF v_user_email IS NULL OR v_event_title IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User or event not found');
  END IF;

  INSERT INTO event_email_logs (user_id, event_id, email_type, email_address, status)
  VALUES (p_user_id, p_event_id, 'payment_approved', v_user_email, 'pending');

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Payment approved email queued for sending',
    'email', v_user_email,
    'event', v_event_title
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. Send Event Reminder Email (24 hours before)
CREATE OR REPLACE FUNCTION send_event_reminder_email(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_event_title TEXT;
  v_event_date TIMESTAMPTZ;
  v_result jsonb;
BEGIN
  SELECT up.email INTO v_user_email
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  SELECT pe.title, pe.event_date INTO v_event_title, v_event_date
  FROM platform_events pe
  WHERE pe.id = p_event_id;

  IF v_user_email IS NULL OR v_event_title IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User or event not found');
  END IF;

  INSERT INTO event_email_logs (user_id, event_id, email_type, email_address, status)
  VALUES (p_user_id, p_event_id, 'reminder', v_user_email, 'pending');

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Reminder email queued for sending',
    'email', v_user_email,
    'event', v_event_title,
    'eventDate', v_event_date
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. Send Recording Available Email
CREATE OR REPLACE FUNCTION send_recording_available_email(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_event_title TEXT;
  v_recording_link TEXT;
  v_result jsonb;
BEGIN
  SELECT up.email INTO v_user_email
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  SELECT pe.title, pe.recording_url INTO v_event_title, v_recording_link
  FROM platform_events pe
  WHERE pe.id = p_event_id;

  IF v_user_email IS NULL OR v_event_title IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User or event not found');
  END IF;

  INSERT INTO event_email_logs (user_id, event_id, email_type, email_address, status)
  VALUES (p_user_id, p_event_id, 'recording_available', v_user_email, 'pending');

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Recording notification email queued for sending',
    'email', v_user_email,
    'event', v_event_title,
    'recordingLink', v_recording_link
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 5. Mark Email as Sent (for webhook callback from email service)
CREATE OR REPLACE FUNCTION mark_email_as_sent(
  p_log_id UUID,
  p_status VARCHAR(20) DEFAULT 'sent'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE event_email_logs
  SET status = p_status,
      sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
      updated_at = NOW()
  WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true, 'message', 'Email status updated');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION send_registration_email(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_payment_approved_email(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_reminder_email(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_recording_available_email(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_email_as_sent(UUID, VARCHAR) TO authenticated;
