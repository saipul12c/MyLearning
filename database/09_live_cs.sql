-- ============================================
-- 09_live_cs.sql
-- Live Chat System for MyLearning
-- ============================================

-- 1. Add Presence Columns to user_profiles if not already there
-- (Handled in code logic, but good to have here for reference)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Live Chat Sessions
CREATE TABLE IF NOT EXISTS live_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name VARCHAR(200),
  guest_email VARCHAR(300),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed')),
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Live Chat Messages
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES live_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type VARCHAR(10) CHECK (sender_type IN ('user', 'agent', 'bot')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_messages;

-- RLS
ALTER TABLE live_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. Policies for live_chats
CREATE POLICY "View Policy: Users see own, Admins see all, Guests see anon chats" ON live_chats
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (user_id IS NULL) OR -- Allow guest access to anonymous chats
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Insert Policy: Anyone can create a chat" ON live_chats
  FOR INSERT WITH CHECK (true);

-- 2. Policies for live_chat_messages
CREATE POLICY "View Policy: Anyone can view messages if they have the chat ID" ON live_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_chats 
      WHERE id = chat_id AND (
        user_id = auth.uid() OR 
        user_id IS NULL OR -- Allow guest access
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'instructor'))
      )
    )
  );

CREATE POLICY "Insert Policy: Anyone can send messages" ON live_chat_messages
  FOR INSERT WITH CHECK (true);
