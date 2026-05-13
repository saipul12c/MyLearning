-- ============================================
-- 24_user_feature_implementation.sql
-- MyLearning - Implementation of 30 User Features
-- ============================================

-- 1. FREE FEATURES LOGIC
-- --------------------------------------------

-- Learning Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    streak_frozen_until TIMESTAMPTZ
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    deck_name VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Quests
CREATE TABLE IF NOT EXISTS daily_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 50,
    quest_type VARCHAR(50) NOT NULL, -- 'watch_video', 'solve_quiz', 'post_discussion'
    target_value INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_quest_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    reset_at TIMESTAMPTZ DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
    UNIQUE(user_id, quest_id, reset_at)
);

-- 2. PAID FEATURES LOGIC
-- --------------------------------------------

-- Mentorship Sessions
CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    meeting_link TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resume/CV Exports (AI Assisted)
CREATE TABLE IF NOT EXISTS resume_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    template_name VARCHAR(50) DEFAULT 'modern',
    content_json JSONB NOT NULL,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SPECIAL FEATURES LOGIC
-- --------------------------------------------

-- AI Learning Paths
CREATE TABLE IF NOT EXISTS ai_learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    goal_title VARCHAR(200) NOT NULL,
    generated_curriculum JSONB NOT NULL, -- Array of course/lesson sequence
    progress_score DECIMAL(5,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Matching AI
CREATE TABLE IF NOT EXISTS job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    job_title VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
    job_link TEXT,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'applied', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill Radar Fingerprinting
CREATE TABLE IF NOT EXISTS skill_fingerprints (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    skills_json JSONB DEFAULT '{}'::jsonb, -- e.g. {"frontend": 80, "backend": 45, "design": 90}
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaborative Playgrounds (Sandbox Sessions)
CREATE TABLE IF NOT EXISTS sandbox_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    environment_type VARCHAR(50) DEFAULT 'nodejs',
    initial_code TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SECURITY & PERMISSIONS
-- --------------------------------------------
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their sessions" ON mentorship_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their AI paths" ON ai_learning_paths FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their job matches" ON job_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their skills" ON skill_fingerprints FOR SELECT USING (auth.uid() = user_id);

-- 5. INITIAL DATA
-- --------------------------------------------
INSERT INTO daily_quests (title, description, xp_reward, quest_type, target_value)
VALUES 
('Morning Scholar', 'Tonton 1 video pelajaran di pagi hari.', 50, 'watch_video', 1),
('Problem Solver', 'Selesaikan 2 kuis dengan nilai di atas 80.', 150, 'solve_quiz', 2),
('Social Learner', 'Berikan 1 komentar bermanfaat di forum diskusi.', 30, 'post_discussion', 1)
ON CONFLICT DO NOTHING;

-- Refresh schema
NOTIFY pgrst, 'reload schema';


-- ============================================
-- MyLearning - Registering 30 User Features to Sentinel Gatekeeper
-- ============================================

-- Inserting feature flags for the 30 features into Sentinel Configs
-- This allows Admins to control rollouts, maintenance, and visibility

INSERT INTO public.sentinel_configs (key, value, description, category, is_public, rollout_percentage, targeting_roles)
VALUES 
-- Free Pack Flags
('feature_free_pack_enabled', 'true', 'Master switch untuk 10 fitur gratis (Starter)', 'feature', TRUE, 100, '{}'),
('feature_learning_streaks', 'true', 'Sistem konsistensi harian (streaks)', 'feature', TRUE, 100, '{}'),
('feature_flashcards', 'true', 'Alat bantu hafal interaktif', 'feature', TRUE, 100, '{}'),
('feature_daily_quests', 'true', 'Tantangan mikro harian dengan hadiah XP', 'feature', TRUE, 100, '{}'),

-- Paid Pack Flags
('feature_paid_pack_enabled', 'true', 'Master switch untuk 10 fitur premium (Pro)', 'feature', TRUE, 100, '{}'),
('feature_mentorship_sessions', 'true', 'Sistem penjadwalan konsultasi instruktur', 'feature', TRUE, 100, '{"admin", "instructor"}'),
('feature_resume_builder_ai', 'true', 'Ekspor pencapaian ke CV berbasis AI', 'feature', TRUE, 100, '{}'),
('feature_offline_vault', 'true', 'Akses materi secara offline', 'feature', TRUE, 100, '{}'),

-- Special Pack Flags
('feature_special_pack_enabled', 'false', 'Master switch untuk 10 fitur elite (Special)', 'feature', TRUE, 0, '{"admin"}'),
('feature_ai_learning_path', 'false', 'Kurikulum adaptif bertenaga AI (Gemini)', 'feature', TRUE, 10, '{"admin", "instructor"}'),
('feature_job_matching_ai', 'false', 'Sistem perjodohan karir otomatis', 'feature', TRUE, 0, '{"admin"}'),
('feature_sandbox_playground', 'false', 'Environment coding/sandbox di browser', 'feature', TRUE, 0, '{"admin"}'),
('feature_skill_radar', 'true', 'Visualisasi radar chart untuk analisis skill', 'feature', TRUE, 100, '{}'),
('feature_ar_visualizer', 'false', 'Visualisasi materi berbasis Augmented Reality', 'feature', TRUE, 0, '{"admin"}')

ON CONFLICT (key) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_public = EXCLUDED.is_public;

-- Metadata updates for changelog
UPDATE public.sentinel_configs 
SET metadata = metadata || jsonb_build_object(
    'last_audit', NOW(),
    'implemented_by', 'Sentinel Gatekeeper',
    'feature_group', '30_user_features_v1'
)
WHERE key LIKE 'feature_%';

-- Refresh schema
NOTIFY pgrst, 'reload schema';
