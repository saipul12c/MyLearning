-- ============================================
-- 23_live_cs_enhancements.sql
-- Enhancing Live CS with Context-Awareness and Better Tracking
-- ============================================

-- 1. Add Metadata and Tracking Columns to live_chats
ALTER TABLE live_chats ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_chats ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE live_chats ADD COLUMN IF NOT EXISTS unread_count_agent INTEGER DEFAULT 0;
ALTER TABLE live_chats ADD COLUMN IF NOT EXISTS unread_count_user INTEGER DEFAULT 0;

-- 2. Add Index for Sorting in Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_live_chats_last_message_at ON live_chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chats_status_last ON live_chats(status, last_message_at DESC);

-- 3. Function to automatically update last_message_at
CREATE OR REPLACE FUNCTION update_chat_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_chats
  SET 
    last_message_at = NEW.created_at,
    unread_count_agent = CASE 
      WHEN NEW.sender_type = 'user' THEN unread_count_agent + 1 
      ELSE unread_count_agent 
    END,
    unread_count_user = CASE 
      WHEN NEW.sender_type IN ('agent', 'bot') THEN unread_count_user + 1 
      ELSE unread_count_user 
    END
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for live_chat_messages
DROP TRIGGER IF EXISTS tr_update_chat_timestamp ON live_chat_messages;
CREATE TRIGGER tr_update_chat_timestamp
AFTER INSERT ON live_chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_message_at();

-- 5. Function to reset unread count
CREATE OR REPLACE FUNCTION reset_chat_unread_count(chat_uuid UUID, target_type VARCHAR)
RETURNS VOID AS $$
BEGIN
  IF target_type = 'agent' THEN
    UPDATE live_chats SET unread_count_agent = 0 WHERE id = chat_uuid;
  ELSE
    UPDATE live_chats SET unread_count_user = 0 WHERE id = chat_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 6. Hardening & Security (Merged from 24_live_cs_hardening)
-- ============================================

-- Add Fingerprint/Session Token for Guest Security
ALTER TABLE live_chats ADD COLUMN IF NOT EXISTS fingerprint TEXT;
CREATE INDEX IF NOT EXISTS idx_live_chats_fingerprint ON live_chats(fingerprint);

-- Refine RLS Policies for live_chats
DROP POLICY IF EXISTS "View Policy: Users see own, Admins see all, Guests see anon chats" ON live_chats;
DROP POLICY IF EXISTS "Secure View Policy: Ownership or Admin" ON live_chats;

CREATE POLICY "Secure View Policy: Ownership or Admin" ON live_chats
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (fingerprint IS NOT NULL AND fingerprint = (current_setting('request.headers', true)::jsonb->>'x-client-fingerprint')) OR
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Message Rate Limiting Table
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES live_chats(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count_window INTEGER DEFAULT 0,
  UNIQUE(chat_id)
);

-- Rate Limiting Function for Messages
CREATE OR REPLACE FUNCTION enforce_chat_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_limit INTEGER := 10; -- Max 10 messages per minute
  v_window_seconds INTEGER := 60;
  v_count INTEGER;
BEGIN
  -- Get current window stats
  INSERT INTO chat_rate_limits (chat_id, last_message_at, message_count_window)
  VALUES (NEW.chat_id, NOW(), 1)
  ON CONFLICT (chat_id) DO UPDATE SET
    message_count_window = CASE 
      WHEN chat_rate_limits.last_message_at < (NOW() - (v_window_seconds || ' seconds')::interval) THEN 1
      ELSE chat_rate_limits.message_count_window + 1
    END,
    last_message_at = CASE 
      WHEN chat_rate_limits.last_message_at < (NOW() - (v_window_seconds || ' seconds')::interval) THEN NOW()
      ELSE chat_rate_limits.last_message_at
    END
  RETURNING message_count_window INTO v_count;

  IF v_count > v_limit THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait a moment.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Rate Limiting Trigger
DROP TRIGGER IF EXISTS tr_enforce_chat_rate_limit ON live_chat_messages;
CREATE TRIGGER tr_enforce_chat_rate_limit
BEFORE INSERT ON live_chat_messages
FOR EACH ROW
EXECUTE FUNCTION enforce_chat_rate_limit();

-- Function to automatically close stale chats
CREATE OR REPLACE FUNCTION close_stale_chats()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE live_chats
  SET status = 'closed'
  WHERE status IN ('open', 'active')
    AND last_message_at < (NOW() - INTERVAL '24 hours');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

