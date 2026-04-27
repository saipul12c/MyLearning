-- ============================================
-- 11_gamification.sql
-- MyLearning - Gamification & Engagement
-- ============================================

-- 1. EXTEND USER PROFILES
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS xp BIGINT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_streak_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_lessons_completed INTEGER DEFAULT 0;

-- 2. BADGES DEFINITION
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50), -- Lucide icon name
    xp_reward INTEGER DEFAULT 0,
    criteria_type VARCHAR(50), -- 'lessons', 'streaks', 'quiz_score', 'event_participation'
    criteria_value INTEGER,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER EARNED BADGES
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 4. XP TRANSACTION LOGS (For History/Audit)
CREATE TABLE IF NOT EXISTS xp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'lesson_completed', 'daily_streak', 'badge_earned', 'event_attended'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LEVEL PROGRESSION TABLE (Optional, but good for custom scaling)
CREATE TABLE IF NOT EXISTS level_definitions (
    level INTEGER PRIMARY KEY,
    xp_required BIGINT NOT NULL,
    title VARCHAR(100)
);

-- Populate Level Definitions (Standard RPG scaling: 100 * level^1.5)
INSERT INTO level_definitions (level, xp_required, title)
VALUES 
(1, 0, 'Starter'),
(2, 100, 'Novice'),
(3, 250, 'Learner'),
(4, 500, 'Apprentice'),
(5, 1000, 'Practitioner'),
(10, 5000, 'Expert'),
(20, 20000, 'Master'),
(50, 100000, 'Grandmaster')
ON CONFLICT (level) DO NOTHING;

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_xp ON user_profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id, created_at DESC);

-- 7. FUNCTION: ADD XP & CHECK LEVEL UP
CREATE OR REPLACE FUNCTION add_user_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason VARCHAR
) RETURNS VOID AS $$
DECLARE
    v_current_xp BIGINT;
    v_new_xp BIGINT;
    v_new_level INTEGER;
BEGIN
    -- 1. Log XP
    INSERT INTO xp_logs (user_id, amount, reason)
    VALUES (p_user_id, p_amount, p_reason);

    -- 2. Update User XP
    UPDATE user_profiles
    SET xp = xp + p_amount
    WHERE user_id = p_user_id
    RETURNING xp INTO v_new_xp;

    -- 3. Calculate New Level (Simple formula if level_definitions doesn't have exact match)
    -- Formula: level = floor(sqrt(xp / 100)) + 1
    v_new_level := FLOOR(SQRT(v_new_xp / 100)) + 1;

    -- 4. Update Level if increased
    UPDATE user_profiles
    SET level = v_new_level
    WHERE user_id = p_user_id AND level < v_new_level;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER: XP ON LESSON COMPLETION
CREATE OR REPLACE FUNCTION trigger_xp_on_lesson_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL)) THEN
        -- Add 50 XP for completing a lesson
        PERFORM add_user_xp(NEW.user_id, 50, 'lesson_completed');
        
        -- Update total lessons completed
        UPDATE user_profiles 
        SET total_lessons_completed = total_lessons_completed + 1
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_xp_on_lesson_completion ON lesson_progress;
CREATE TRIGGER trg_xp_on_lesson_completion
AFTER INSERT OR UPDATE OF is_completed ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_xp_on_lesson_completion();

-- 9. FUNCTION: UPDATE STREAK
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_streak TIMESTAMPTZ;
    v_diff INTERVAL;
BEGIN
    SELECT last_streak_at INTO v_last_streak FROM user_profiles WHERE user_id = p_user_id;
    
    IF v_last_streak IS NULL THEN
        UPDATE user_profiles SET streak_count = 1, last_streak_at = NOW() WHERE user_id = p_user_id;
        PERFORM add_user_xp(p_user_id, 20, 'daily_streak');
    ELSE
        v_diff := NOW() - v_last_streak;
        
        IF v_diff < INTERVAL '24 hours' THEN
            -- Already updated today (or very recently), do nothing
            RETURN;
        ELSIF v_diff < INTERVAL '48 hours' THEN
            -- Consecutive day!
            UPDATE user_profiles 
            SET streak_count = streak_count + 1, last_streak_at = NOW() 
            WHERE user_id = p_user_id;
            PERFORM add_user_xp(p_user_id, 20 + (LEAST(streak_count, 10) * 5), 'daily_streak');
        ELSE
            -- Streak broken :(
            UPDATE user_profiles SET streak_count = 1, last_streak_at = NOW() WHERE user_id = p_user_id;
            PERFORM add_user_xp(p_user_id, 20, 'daily_streak');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. TRIGGER: XP ON QUIZ COMPLETION
CREATE OR REPLACE FUNCTION trigger_xp_on_quiz_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.passed = true AND (OLD.passed = false OR OLD.passed IS NULL)) THEN
        -- Add 100 XP for passing a quiz
        PERFORM add_user_xp(NEW.user_id, 100, 'quiz_passed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_xp_on_quiz_completion ON quiz_progress;
CREATE TRIGGER trg_xp_on_quiz_completion
AFTER INSERT OR UPDATE OF passed ON quiz_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_xp_on_quiz_completion();

-- 11. RLS POLICIES
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own xp logs" ON xp_logs FOR SELECT USING (auth.uid() = user_id);

-- 11. INITIAL DATA
INSERT INTO badges (name, slug, description, icon_name, xp_reward, criteria_type, criteria_value, rarity)
VALUES 
('Pencetak Sejarah', 'first-lesson', 'Menyelesaikan pelajaran pertama Anda.', 'Zap', 100, 'lessons', 1, 'common'),
('Pembelajar Tekun', '7-day-streak', 'Mencapai streak belajar selama 7 hari.', 'Flame', 500, 'streaks', 7, 'rare'),
('Master Kuis', 'perfect-quiz', 'Mendapatkan nilai 100 pada kuis apapun.', 'Target', 300, 'quiz_score', 100, 'rare'),
('Warga Aktif', 'first-event', 'Mendaftar dan mengikuti event pertama Anda.', 'Calendar', 200, 'event_participation', 1, 'common')
ON CONFLICT (slug) DO NOTHING;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- MyLearning - Lesson Notes System
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    video_timestamp INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_notes_user_lesson ON lesson_notes(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_created ON lesson_notes(created_at DESC);

-- RLS
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" 
ON lesson_notes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
