-- ============================================
-- 02_logic.sql (Consolidated)
-- MyLearning - Database Automation
-- ============================================

-- 1. TRIGGER FUNCTION: Update Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TRIGGER FUNCTION: Sync Course Content Statistics
-- Automatically updates total_lessons AND duration_hours whenever a lesson is changed
CREATE OR REPLACE FUNCTION sync_course_content_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
BEGIN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    
    UPDATE courses 
    SET 
        total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = v_course_id),
        duration_hours = ROUND((SELECT COALESCE(SUM(duration_minutes), 0) FROM lessons WHERE course_id = v_course_id) / 60.0, 1)
    WHERE id = v_course_id;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 2a. TRIGGER FUNCTION: Sync Course Review Statistics
-- Automatically updates rating AND total_reviews whenever a review is added/updated/deleted
CREATE OR REPLACE FUNCTION sync_course_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
BEGIN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    
    UPDATE courses 
    SET 
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE course_id = v_course_id AND is_approved = true), 0.0),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE course_id = v_course_id AND is_approved = true)
    WHERE id = v_course_id;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 2b. TRIGGER FUNCTION: Sync Course Enrollment Statistics
-- Automatically updates total_students whenever an enrollment is confirmed
CREATE OR REPLACE FUNCTION sync_course_enrollment_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
BEGIN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    
    UPDATE courses 
    SET total_students = (SELECT COUNT(*) FROM enrollments WHERE course_id = v_course_id AND payment_status IN ('paid', 'completed'))
    WHERE id = v_course_id;
    
    -- Also sync Instructor total_students
    UPDATE instructors
    SET total_students = (
        SELECT COUNT(*) 
        FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        WHERE c.instructor_id = (SELECT instructor_id FROM courses WHERE id = v_course_id)
        AND e.payment_status IN ('paid', 'completed')
    )
    WHERE id = (SELECT instructor_id FROM courses WHERE id = v_course_id);
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 3. TRIGGER FUNCTION: Calculate Enrollment Progress
-- Automates the progress_percentage calculation based on completed items
CREATE OR REPLACE FUNCTION calculate_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_enroll_id UUID;
    v_total_items INTEGER;
    v_completed_count INTEGER;
    v_lessons_count INTEGER;
    v_quizzes_count INTEGER;
    v_assignments_count INTEGER;
    v_fp_completed BOOLEAN;
BEGIN
    -- Handle calls from progress tables (enrollment_id) OR enrollments table (id)
    v_enroll_id := COALESCE(NEW.enrollment_id, OLD.enrollment_id, NEW.id, OLD.id);

    SELECT COUNT(*) INTO v_lessons_count FROM lesson_progress WHERE enrollment_id = v_enroll_id AND is_completed = true;
    SELECT COUNT(*) INTO v_quizzes_count FROM quiz_progress WHERE enrollment_id = v_enroll_id AND passed = true;
    SELECT COUNT(*) INTO v_assignments_count FROM assignment_progress WHERE enrollment_id = v_enroll_id AND passed = true;

    SELECT total_items, final_project_completed 
    INTO v_total_items, v_fp_completed
    FROM enrollments 
    WHERE id = v_enroll_id;

    v_completed_count := v_lessons_count + v_quizzes_count + v_assignments_count;
    
    IF v_fp_completed THEN
        v_completed_count := v_completed_count + 1;
    END IF;

    v_total_items := COALESCE(v_total_items, 0);
    IF v_total_items <= 0 THEN 
        -- Fallback: Count lessons + Project (Assuming 1 project if none defined yet)
        SELECT total_lessons INTO v_total_items FROM courses c JOIN enrollments e ON e.course_id = c.id WHERE e.id = v_enroll_id;
        
        -- Check if there's a final project definition for this course
        IF EXISTS (SELECT 1 FROM assessment_definitions ad JOIN enrollments e ON e.course_id = ad.course_id WHERE e.id = v_enroll_id AND ad.assessment_type = 'final_project') THEN
            v_total_items := v_total_items + 1;
        END IF;

        v_total_items := COALESCE(v_total_items, 1);
        IF v_total_items <= 0 THEN v_total_items := 1; END IF;
    END IF;

    UPDATE enrollments 
    SET progress_percentage = LEAST(100, ROUND((v_completed_count::DECIMAL / v_total_items::DECIMAL) * 100))
    WHERE id = v_enroll_id;

    RETURN NULL;
END;
$$ language 'plpgsql';

-- 4. TRIGGER FUNCTION: Auto-resolve course_id
CREATE OR REPLACE FUNCTION resolve_course_id_from_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.course_id IS NULL AND NEW.course_slug IS NOT NULL THEN
        SELECT id INTO NEW.course_id FROM courses WHERE slug = NEW.course_slug;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. TRIGGER FUNCTION: Sync Instructor Course Statistics
-- Automatically updates total_courses whenever a course is added/deleted
CREATE OR REPLACE FUNCTION sync_instructor_course_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_instructor_id UUID;
BEGIN
    v_instructor_id := COALESCE(NEW.instructor_id, OLD.instructor_id);
    
    UPDATE instructors 
    SET total_courses = (SELECT COUNT(*) FROM courses WHERE instructor_id = v_instructor_id)
    WHERE id = v_instructor_id;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 6. TRIGGER FUNCTION: Handle New User (Auth to Profile Sync)
-- Automatically creates a profile record when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url', 
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- APPLY TRIGGERS
-- ============================================

-- Timestamps
DROP TRIGGER IF EXISTS set_updated_at_user_profiles ON user_profiles;
CREATE TRIGGER set_updated_at_user_profiles BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_instructors ON instructors;
CREATE TRIGGER set_updated_at_instructors BEFORE UPDATE ON instructors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_courses ON courses;
CREATE TRIGGER set_updated_at_courses BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_reviews ON reviews;
CREATE TRIGGER set_updated_at_reviews BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_definitions_updated_at ON assessment_definitions;
CREATE TRIGGER update_assessment_definitions_updated_at BEFORE UPDATE ON assessment_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Course Content Stats
DROP TRIGGER IF EXISTS trigger_sync_course_content ON lessons;
CREATE TRIGGER trigger_sync_course_content AFTER INSERT OR UPDATE OR DELETE ON lessons FOR EACH ROW EXECUTE FUNCTION sync_course_content_stats();

-- Course Review Stats
DROP TRIGGER IF EXISTS trigger_sync_course_reviews ON reviews;
CREATE TRIGGER trigger_sync_course_reviews AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION sync_course_review_stats();

-- Course Enrollment Stats
DROP TRIGGER IF EXISTS trigger_sync_course_enrollments ON enrollments;
CREATE TRIGGER trigger_sync_course_enrollments AFTER INSERT OR UPDATE OR DELETE ON enrollments FOR EACH ROW EXECUTE FUNCTION sync_course_enrollment_stats();

-- Instructor Stats
DROP TRIGGER IF EXISTS trigger_sync_instructor_courses ON courses;
CREATE TRIGGER trigger_sync_instructor_courses AFTER INSERT OR DELETE ON courses FOR EACH ROW EXECUTE FUNCTION sync_instructor_course_stats();

-- Enrollment Auto-resolve
DROP TRIGGER IF EXISTS trigger_resolve_course_id ON enrollments;
CREATE TRIGGER trigger_resolve_course_id BEFORE INSERT ON enrollments FOR EACH ROW EXECUTE FUNCTION resolve_course_id_from_slug();

-- Enrollment Progress
DROP TRIGGER IF EXISTS trigger_update_progress_lessons ON lesson_progress;
CREATE TRIGGER trigger_update_progress_lessons AFTER INSERT OR UPDATE OR DELETE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION calculate_enrollment_progress();

DROP TRIGGER IF EXISTS trigger_update_progress_quizzes ON quiz_progress;
CREATE TRIGGER trigger_update_progress_quizzes AFTER INSERT OR UPDATE OR DELETE ON quiz_progress FOR EACH ROW EXECUTE FUNCTION calculate_enrollment_progress();

DROP TRIGGER IF EXISTS trigger_update_progress_assignments ON assignment_progress;
CREATE TRIGGER trigger_update_progress_assignments AFTER INSERT OR UPDATE OR DELETE ON assignment_progress FOR EACH ROW EXECUTE FUNCTION calculate_enrollment_progress();

-- Enrollment Progress (Watch for Final Project)
DROP TRIGGER IF EXISTS trigger_update_progress_enrollment ON enrollments;
CREATE TRIGGER trigger_update_progress_enrollment AFTER UPDATE OF final_project_completed ON enrollments FOR EACH ROW EXECUTE FUNCTION calculate_enrollment_progress();

-- Auth to Profile Sync
-- IMPORTANT: This trigger must be run in the Supabase SQL Editor if you encounter permission errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ======================================================
-- 4. MAINTENANCE PROCEDURES
-- ======================================================

-- Procedure to force-recalculate all statistics (Run after manual data imports)
CREATE OR REPLACE PROCEDURE repair_all_stats()
LANGUAGE plpgsql
AS $$
DECLARE
    r_course RECORD;
    r_instructor RECORD;
BEGIN
    RAISE NOTICE 'Starting database statistics repair...';

    -- 1. REPAIR COURSES
    FOR r_course IN SELECT id FROM courses LOOP
        UPDATE courses 
        SET 
            total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = r_course.id),
            duration_hours = ROUND((SELECT COALESCE(SUM(duration_minutes), 0) FROM lessons WHERE course_id = r_course.id) / 60.0, 1),
            rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE course_id = r_course.id AND is_approved = true), 0.0),
            total_reviews = (SELECT COUNT(*) FROM reviews WHERE course_id = r_course.id AND is_approved = true),
            total_students = (SELECT COUNT(*) FROM enrollments WHERE course_id = r_course.id AND payment_status IN ('paid', 'completed'))
        WHERE id = r_course.id;
    END LOOP;

    -- 2. REPAIR INSTRUCTORS
    FOR r_instructor IN SELECT id FROM instructors LOOP
        UPDATE instructors
        SET 
            total_students = (
                SELECT COUNT(*) 
                FROM enrollments e 
                JOIN courses c ON e.course_id = c.id 
                WHERE c.instructor_id = r_instructor.id
                AND e.payment_status IN ('paid', 'completed')
            ),
            total_courses = (SELECT COUNT(*) FROM courses WHERE instructor_id = r_instructor.id)
        WHERE id = r_instructor.id;
    END LOOP;

    RAISE NOTICE 'Repair Selesai! Seluruh statistik Kursus dan Instruktur telah disinkronkan.';
END;
$$;

-- Procedure to cleanup old contact/offline messages (> 30 days)
-- Runs automatically to keep the database efficient
CREATE OR REPLACE PROCEDURE cleanup_old_messages()
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM contact_messages 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Pembersihan selesai: Pesan lama (>30 hari) telah dihapus.';
END;
$$;

-- 5. VIEW: Popular Course Stats (Last 3 Months)
-- Efficiently aggregates enrollment data in the database and is more stable than RPC
CREATE OR REPLACE VIEW vw_popular_courses_master AS
SELECT 
    course_id, 
    COUNT(*) as enrollment_count
FROM enrollments
WHERE enrolled_at >= NOW() - INTERVAL '3 months'
AND payment_status IN ('paid', 'completed')
GROUP BY course_id
ORDER BY enrollment_count DESC;

-- Explicit grants for API access
GRANT SELECT ON vw_popular_courses_master TO anon, authenticated, service_role;
COMMENT ON VIEW vw_popular_courses_master IS 'View utama untuk kursus terpopuler - MyLearning Masterpiece';
