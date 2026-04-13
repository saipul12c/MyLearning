-- ============================================
-- MyLearning Database Schema (v1.2 - Consolidated)
-- Platform Belajar Online
-- Compatible with Supabase (PostgreSQL)
-- ============================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USER PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'instructor', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'Profil pengguna dengan sistem role (admin/user)';

-- ============================================
-- 2. CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INSTRUCTORS
-- ============================================
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  expertise VARCHAR(200),
  website_url TEXT,
  linkedin_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_students INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  qris_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. COURSES
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  thumbnail_url TEXT,
  preview_video_url TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  discount_price INTEGER,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
  level VARCHAR(20) NOT NULL DEFAULT 'Starter' CHECK (level IN ('Starter', 'Accelerator', 'Mastery')),
  language VARCHAR(50) DEFAULT 'Bahasa Indonesia',
  duration_hours DECIMAL(5,1) DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  learning_points JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT FALSE,
  content_type VARCHAR(20) DEFAULT 'video' CHECK (content_type IN ('video', 'article', 'quiz')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, title)
);

-- ============================================
-- 6. ENROLLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  course_slug TEXT,
  course_title TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_verification', 'paid', 'rejected', 'refunded', 'failed', 'completed', 'expired')),
  payment_amount INTEGER DEFAULT 0,
  payment_proof_url TEXT,
  rejection_reason TEXT,
  payment_retry_count INTEGER DEFAULT 0,
  expiry_days INTEGER DEFAULT 30,
  expired_at TIMESTAMPTZ,
  certificate_id TEXT UNIQUE,
  certificate_url TEXT,
  certificate_valid_until TIMESTAMPTZ,
  final_project_completed BOOLEAN DEFAULT FALSE,
  total_lessons INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  
  -- Extra Columns from 07
  final_project_url TEXT,
  final_project_notes TEXT,
  final_project_feedback TEXT,
  
  UNIQUE(course_id, user_id),
  CONSTRAINT enrollments_user_id_course_slug_key UNIQUE (user_id, course_slug)
);

-- ============================================
-- 7. PROGRESS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  watch_duration_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS quiz_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    quiz_id VARCHAR(100) NOT NULL,
    score INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    answers JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enrollment_id, quiz_id)
);

CREATE TABLE IF NOT EXISTS assignment_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    assignment_id VARCHAR(100) NOT NULL,
    score INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    results JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Extra Columns from 07
    submission_url TEXT,
    submission_notes TEXT,
    admin_feedback TEXT,
    
    UNIQUE(enrollment_id, assignment_id)
);

-- ============================================
-- 8. ASSESSMENTS DEFINITIONS
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('quiz', 'assignment', 'final_project')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_estimate_minutes INTEGER DEFAULT 15,
  order_index INTEGER DEFAULT 0,
  slug VARCHAR(100),
  instructions TEXT,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  questions_list JSONB DEFAULT '[]'::jsonb,
  correct_answers_list JSONB DEFAULT '[]'::jsonb,
  objectives JSONB DEFAULT '[]'::jsonb,
  deliverables JSONB DEFAULT '[]'::jsonb,
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  estimated_hours INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  time_limit_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, assessment_type, slug)
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessment_definitions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'short_answer')),
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer_index TEXT,
  explanation TEXT,
  hint TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN assessment_definitions.max_attempts IS 'Batas maksimal percobaan pengerjaan (0 = tidak terbatas)';
COMMENT ON COLUMN assessment_definitions.time_limit_minutes IS 'Batas waktu pengerjaan dalam menit (0 = tidak ada batas)';
COMMENT ON COLUMN assessment_questions.points IS 'Bobot poin untuk pertanyaan ini';

-- ============================================
-- 9. DISCUSSIONS & NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. REVIEWS, CERTIFICATES, CONTACT
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  instructor_name VARCHAR(200),
  course_title VARCHAR(500),
  user_name VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(300) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. VIEWS
-- ============================================
CREATE OR REPLACE VIEW sales_analytics AS
SELECT 
    DATE_TRUNC('day', enrolled_at) as sale_date,
    COUNT(id) as total_enrollments,
    SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as successful_sales,
    SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END) as total_revenue
FROM enrollments
WHERE payment_status IN ('paid', 'completed')
GROUP BY sale_date
ORDER BY sale_date DESC;

-- ============================================
-- 12. PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_slug ON instructors(slug);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published_featured ON courses(is_published, is_featured) WHERE is_published = true;
-- Indonesian Full-Text Search Vector
ALTER TABLE courses ADD COLUMN IF NOT EXISTS title_description_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_courses_fulltext ON courses USING gin(title_description_vector);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(payment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_date ON enrollments(enrolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson ON discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_assessment_def_course ON assessment_definitions(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_ques_def ON assessment_questions(assessment_id);

-- NOTE: TRIGGERS AND FUNCTIONS ARE MOVED TO 02_logic.sql
