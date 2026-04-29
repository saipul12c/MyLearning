-- ============================================
-- 19_tiers_and_achievements.sql
-- MyLearning - Tiers and Achievements System
-- ============================================

-- 1. TIERS DEFINITION
CREATE TABLE IF NOT EXISTS tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    benefits JSONB DEFAULT '[]'::jsonb,
    icon_name VARCHAR(50), -- Lucide icon name
    color_hex VARCHAR(20) DEFAULT '#7c3aed',
    level_required INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACHIEVEMENTS DEFINITION
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50), -- Lucide icon name
    xp_reward INTEGER DEFAULT 0,
    category VARCHAR(50), -- 'course', 'quiz', 'event', 'project', 'assignment', 'social'
    criteria_type VARCHAR(50),
    criteria_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXTEND USER PROFILES
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES tiers(id) ON DELETE SET NULL;

-- 4. USER ACHIEVEMENTS (EARNED)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 5. SEED TIERS (10 Categories)
INSERT INTO tiers (name, slug, description, price, benefits, icon_name, color_hex)
VALUES 
('Bronze Learner', 'bronze', 'Langkah pertama menuju penguasaan. Dapatkan akses ke materi dasar.', 50000, '["Akses materi dasar", "Badge Bronze"]', 'Award', '#cd7f32'),
('Silver Scholar', 'silver', 'Tingkatkan kemampuan Anda dengan akses lebih luas.', 150000, '["Akses materi menengah", "Sertifikat standar", "Badge Silver"]', 'Award', '#c0c0c0'),
('Gold Expert', 'gold', 'Menjadi ahli di bidang pilihan Anda.', 350000, '["Akses semua materi", "Konsultasi grup", "Badge Gold"]', 'Award', '#ffd700'),
('Platinum Pro', 'platinum', 'Profesional sejati dengan wawasan mendalam.', 750000, '["Prioritas review tugas", "Grup eksklusif", "Badge Platinum"]', 'Award', '#e5e4e2'),
('Diamond Elite', 'diamond', 'Elite dalam komunitas pembelajaran.', 1500000, '["Akses beta fitur baru", "Workshop bulanan", "Badge Diamond"]', 'Gem', '#b9f2ff'),
('Emerald Master', 'emerald', 'Menguasai keterampilan dengan presisi tinggi.', 3000000, '["Mentoring 1-on-1 (1x)", "Akses seumur hidup", "Badge Emerald"]', 'Gem', '#50c878'),
('Ruby Specialist', 'ruby', 'Spesialisasi mendalam yang diakui.', 5000000, '["Review portofolio", "Rekomendasi karir", "Badge Ruby"]', 'Gem', '#e0115f'),
('Sapphire Visionary', 'sapphire', 'Visioner yang membangun masa depan.', 8000000, '["Akses networking VIP", "Undangan event fisik", "Badge Sapphire"]', 'Gem', '#0f52ba'),
('Mastermind', 'mastermind', 'Pemimpin pemikiran dalam teknologi.', 12000000, '["Kesempatan menjadi pembicara", "Profil di-feature", "Badge Mastermind"]', 'Brain', '#4b0082'),
('Legendary Hero', 'legendary', 'Legenda abadi di MyLearning.', 25000000, '["Semua manfaat di atas", "Plakat fisik", "Akses VIP selamanya"]', 'Crown', '#ff4500')
ON CONFLICT (slug) DO NOTHING;

-- 6. SEED ACHIEVEMENTS (10 Categories)
INSERT INTO achievements (name, slug, description, icon_name, xp_reward, category, criteria_type, criteria_value)
VALUES 
('Pencetak Sejarah', 'first-lesson-comp', 'Menyelesaikan pelajaran pertama Anda.', 'Zap', 100, 'course', 'lesson_count', 1),
('Quiz Master', 'quiz-ace', 'Lulus 5 kuis dengan nilai sempurna.', 'Target', 500, 'quiz', 'perfect_quiz_count', 5),
('Pencari Ilmu', 'course-finisher', 'Menyelesaikan 1 kursus penuh.', 'CheckCircle', 1000, 'course', 'course_count', 1),
('Penjelajah Event', 'event-attendee', 'Mengikuti 3 event webinar atau workshop.', 'Calendar', 300, 'event', 'event_count', 3),
('Arsitek Proyek', 'project-hero', 'Menyelesaikan proyek akhir pertama Anda.', 'Layout', 2000, 'project', 'project_count', 1),
('Pelajar Konsisten', 'streak-week', 'Belajar selama 7 hari berturut-turut.', 'Flame', 700, 'social', 'streak_days', 7),
('Raja Tugas', 'assignment-king', 'Menyelesaikan 10 tugas dengan nilai baik.', 'FileText', 1200, 'assignment', 'assignment_count', 10),
('Pembelajar Cepat', 'fast-learner', 'Menyelesaikan kursus dalam waktu kurang dari 3 hari.', 'Wind', 800, 'course', 'completion_speed', 1),
('Pionir MyLearning', 'pioneer', 'Menjadi 1000 pengguna pertama yang aktif.', 'Flag', 500, 'social', 'early_adopter', 1),
('Bintang Komunitas', 'social-star', 'Memberikan 20 catatan atau diskusi bermanfaat.', 'MessageSquare', 600, 'social', 'discussion_count', 20)
ON CONFLICT (slug) DO NOTHING;

-- 7. RLS POLICIES
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tiers" ON tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- 8. TRIGGER FUNCTION TO AWARD ACHIEVEMENTS (Internal Helper)
CREATE OR REPLACE FUNCTION check_and_award_achievement(
    p_user_id UUID,
    p_slug VARCHAR
) RETURNS VOID AS $$
DECLARE
    v_achievement_id UUID;
    v_xp_reward INTEGER;
BEGIN
    -- Get achievement details
    SELECT id, xp_reward INTO v_achievement_id, v_xp_reward 
    FROM achievements WHERE slug = p_slug;

    IF v_achievement_id IS NOT NULL THEN
        -- Insert if not already earned
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement_id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        
        -- If inserted (could check row count or just always try to add XP)
        IF FOUND THEN
            PERFORM add_user_xp(p_user_id, v_xp_reward, 'achievement_earned: ' || p_slug);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
