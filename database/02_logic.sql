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
    v_instructor_id UUID;
BEGIN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    
    -- 1. Update Course Stats
    UPDATE courses 
    SET 
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE course_id = v_course_id AND is_approved = true), 0.0),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE course_id = v_course_id AND is_approved = true)
    WHERE id = v_course_id;

    -- 2. Update Instructor Stats (Aggregated from all their courses)
    SELECT instructor_id INTO v_instructor_id FROM courses WHERE id = v_course_id;
    
    IF v_instructor_id IS NOT NULL THEN
        UPDATE instructors
        SET rating = COALESCE((
            SELECT ROUND(AVG(r.rating)::numeric, 1)
            FROM reviews r
            JOIN courses c ON r.course_id = c.id
            WHERE c.instructor_id = v_instructor_id
            AND r.is_approved = true
        ), 0.0)
        WHERE id = v_instructor_id;
    END IF;
    
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

-- 7. TRIGGER FUNCTION: Automasi Pembuatan Sertifikat
-- Mencegah Race Condition & Inkonsistensi Data
CREATE OR REPLACE FUNCTION handle_certificate_generation()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_short_id TEXT;
    v_random_hex TEXT;
    v_new_cert_number TEXT;
    v_instructor_name TEXT;
    v_instructor_signature_id TEXT;
    v_admin_signature_id TEXT;
    v_full_name TEXT;
    v_valid_until TIMESTAMPTZ;
BEGIN
    -- Logika Pemicu:
    -- 1. Progres mencapai/melebihi 100%
    -- 2. Status pembayaran adalah 'paid' (Sudah lunas)
    
    IF (NEW.progress_percentage >= 100 AND (NEW.payment_status = 'paid' OR NEW.payment_status = 'completed')) THEN
        -- Only generate if certificate_id is missing (Avoid duplicates on every update)
        IF (NEW.certificate_id IS NULL) THEN
            -- A. Generate Certificate Number (ML-YYYY-SHORTID-HEX)
            v_year := TO_CHAR(NOW(), 'YYYY');
            v_short_id := UPPER(LEFT(NEW.id::text, 8));
            v_random_hex := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 4));
            v_new_cert_number := 'ML-' || v_year || '-' || v_short_id || '-' || v_random_hex;

            -- B. Ambil Data Nama Siswa
            SELECT full_name INTO v_full_name FROM public.user_profiles WHERE user_id = NEW.user_id;

            -- C. Ambil Data Instruktur & Tanda Tangannya
            SELECT i.name, i.signature_id INTO v_instructor_name, v_instructor_signature_id
            FROM public.courses c
            JOIN public.instructors i ON c.instructor_id = i.id
            WHERE c.id = NEW.course_id;

            -- D. Ambil Tanda Tangan Admin Platform (Terbaru)
            SELECT signature_id INTO v_admin_signature_id
            FROM public.user_profiles
            WHERE role = 'admin' AND signature_id IS NOT NULL
            ORDER BY signature_last_updated DESC
            LIMIT 1;

            -- E. FALLBACK: Jika TTD Instruktur kosong, gunakan TTD Admin/Direktur
            IF v_instructor_signature_id IS NULL THEN
                v_instructor_signature_id := v_admin_signature_id;
            END IF;

            -- F. Hitung Masa Berlaku (2 Tahun)
            v_valid_until := NOW() + INTERVAL '2 years';

            -- G. Insert atau Update ke Tabel Certificates
            INSERT INTO public.certificates (
                enrollment_id, user_id, course_id, certificate_number, 
                course_title, user_name, instructor_name, 
                instructor_signature_id, admin_signature_id, issued_at
            ) VALUES (
                NEW.id, NEW.user_id, NEW.course_id, v_new_cert_number,
                NEW.course_title, COALESCE(v_full_name, 'Siswa MyLearning'), COALESCE(v_instructor_name, 'Instruktur MyLearning'),
                v_instructor_signature_id, v_admin_signature_id, NOW()
            )
            ON CONFLICT (enrollment_id) DO UPDATE SET
                certificate_number = EXCLUDED.certificate_number,
                issued_at = EXCLUDED.issued_at;

            -- G. Update Kolom di Tabel Enrollments
            NEW.certificate_id := v_new_cert_number;
            NEW.certificate_valid_until := v_valid_until;
            NEW.payment_status := 'completed';
            NEW.completed_at := NOW();
        END IF;

    END IF;
    
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

-- Certificate Generation (Fires on INSERT and UPDATE)
DROP TRIGGER IF EXISTS trg_auto_generate_certificate ON public.enrollments;
CREATE TRIGGER trg_auto_generate_certificate
BEFORE INSERT OR UPDATE OF progress_percentage, payment_status ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION handle_certificate_generation();

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
            total_courses = (SELECT COUNT(*) FROM courses WHERE instructor_id = r_instructor.id),
            rating = COALESCE((
                SELECT ROUND(AVG(r.rating)::numeric, 1)
                FROM reviews r
                JOIN courses c ON r.course_id = c.id
                WHERE c.instructor_id = r_instructor.id
                AND r.is_approved = true
            ), 0.0)
        WHERE id = r_instructor.id;
    END LOOP;

    -- 3. REPAIR ROLES
    -- Pastikan semua akun yang terdaftar di tabel instructors memiliki role 'instructor'
    UPDATE public.user_profiles
    SET role = 'instructor'
    WHERE user_id IN (SELECT user_id FROM public.instructors WHERE user_id IS NOT NULL)
    AND role = 'user';

    RAISE NOTICE 'Repair Selesai! Seluruh statistik dan role telah disinkronkan.';
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

-- Procedure to repair missing certificates for completed courses
CREATE OR REPLACE PROCEDURE repair_missing_certificates()
LANGUAGE plpgsql
AS $$
BEGIN
    -- This update will trigger 'trg_auto_generate_certificate' for every row
    -- because it's an UPDATE OF progress_percentage.
    UPDATE public.enrollments 
    SET progress_percentage = 100 
    WHERE payment_status = 'completed' AND certificate_id IS NULL;
    
    RAISE NOTICE 'Perbaikan sertifikat selesai.';
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

-- 6. TRIGGER FUNCTION: Handle Certificate Revision Approval
-- Automatically updates user_name and increments revision_count when approved
CREATE OR REPLACE FUNCTION handle_certificate_revision_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to approved
    IF (NEW.revision_status = 'approved' AND (OLD.revision_status IS NULL OR OLD.revision_status != 'approved')) THEN
        -- 1. Update the actual name with the requested one
        NEW.user_name := COALESCE(NEW.requested_name, NEW.user_name);
        
        -- 2. Increment revision count (Limit check is done in UI, but this tracks it)
        NEW.revision_count := NEW.revision_count + 1;
        
        -- 3. Clear the status after update so it doesn't stay 'approved' forever (or keep it for history)
        -- We keep it as 'approved' so UI knows it was successfully revised.
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- CREATE TRIGGER trg_on_certificate_revision_approved
-- BEFORE UPDATE ON certificates
-- FOR EACH ROW
-- WHEN (OLD.revision_status IS DISTINCT FROM NEW.revision_status)
-- EXECUTE FUNCTION handle_certificate_revision_approval();

-- Ensure trigger is created safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_on_certificate_revision_approved') THEN
        CREATE TRIGGER trg_on_certificate_revision_approved
        BEFORE UPDATE ON certificates
        FOR EACH ROW
        EXECUTE FUNCTION handle_certificate_revision_approval();
    END IF;
END $$;

-- DYNAMIC CLEANUP: Must drop before recreate because we changed parameter names or signatures
DO $$ 
DECLARE
    _v_rec RECORD;
BEGIN
    FOR _v_rec IN 
        SELECT oid::regprocedure as function_sig
        FROM pg_proc 
        WHERE proname IN ('increment_ad_impressions', 'increment_ad_impressions_batch')
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || _v_rec.function_sig;
    END LOOP;
END $$;

-- 7. FUNCTION: Increment Ad Impressions
CREATE OR REPLACE FUNCTION increment_ad_impressions(
    p_promo_id UUID, 
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_last_log TIMESTAMPTZ;
    v_final_ip TEXT;
BEGIN
    -- Use provided IP or try to get it from request headers (Supabase compatible)
    v_final_ip := COALESCE(p_ip_address, current_setting('request.headers', true)::json->>'x-forwarded-for');

    -- Check for recent log from same user or IP (within 5 minutes)
    IF p_user_id IS NOT NULL OR v_final_ip IS NOT NULL THEN
        SELECT created_at INTO v_last_log 
        FROM promotion_impression_logs 
        WHERE promotion_impression_logs.promo_id = p_promo_id 
          AND (
              (p_user_id IS NOT NULL AND user_id = p_user_id) OR 
              (v_final_ip IS NOT NULL AND ip_address = v_final_ip)
          )
          AND created_at > NOW() - INTERVAL '5 minutes'
        LIMIT 1;
    END IF;

    -- If no recent log, proceed with increment
    IF v_last_log IS NULL THEN
        UPDATE promotions
        SET 
            current_impressions = current_impressions + 1,
            is_active = CASE 
                WHEN (target_impressions > 0 AND (current_impressions + 1) >= target_impressions) OR (end_date IS NOT NULL AND NOW() >= end_date) THEN FALSE 
                ELSE is_active 
            END,
            updated_at = NOW()
        WHERE id = p_promo_id;

        -- Log the impression
        INSERT INTO promotion_impression_logs (promo_id, user_id, ip_address)
        VALUES (p_promo_id, p_user_id, v_final_ip);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7b. FUNCTION: Batch Increment Ad Impressions
CREATE OR REPLACE FUNCTION increment_ad_impressions_batch(
    promo_ids UUID[], 
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_pid UUID;
BEGIN
    FOREACH v_pid IN ARRAY promo_ids LOOP
        PERFORM increment_ad_impressions(v_pid, p_user_id, p_ip_address);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNCTION: Increment Ad Click
CREATE OR REPLACE FUNCTION increment_ad_click(promo_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE promotions SET current_clicks = current_clicks + 1 WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. PROCEDURE: Ad System Maintenance
-- Run this to cleanup stale requests, deactivate expired ads, and archive old data
CREATE OR REPLACE PROCEDURE ad_system_maintenance()
LANGUAGE plpgsql
AS $$
BEGIN
    -- A. Deactivate ads that passed their end date
    UPDATE promotions 
    SET is_active = FALSE 
    WHERE is_active = TRUE AND end_date IS NOT NULL AND NOW() >= end_date;

    -- B. Archive completed/inactive ads older than 3 months
    INSERT INTO promotion_archives (
        id, course_id, user_id, title, description, location, 
        target_impressions, current_impressions, current_clicks, 
        start_date, end_date
    )
    SELECT 
        id, course_id, user_id, title, description, location, 
        target_impressions, current_impressions, current_clicks, 
        start_date, end_date
    FROM promotions
    WHERE is_active = FALSE AND updated_at < NOW() - INTERVAL '3 months';

    DELETE FROM promotions 
    WHERE is_active = FALSE AND updated_at < NOW() - INTERVAL '3 months';

    -- C. Cleanup stale drafts or unverified requests older than 7 days
    UPDATE promotion_requests
    SET status = 'rejected', admin_notes = 'Otomatis ditolak sistem karena melewati batas waktu pembayaran (7 hari).'
    WHERE status IN ('draft', 'waiting_verification') AND created_at < NOW() - INTERVAL '7 days';

    RAISE NOTICE 'Pemeliharaan sistem iklan selesai.';
END;
$$;

-- Explicit grants for API access
GRANT SELECT ON vw_popular_courses_master TO anon, authenticated, service_role;
COMMENT ON VIEW vw_popular_courses_master IS 'View utama untuk kursus terpopuler - MyLearning Masterpiece';

-- DYNAMIC CLEANUP: Remove all overloaded versions
DO $$ 
DECLARE
    _v_rec RECORD;
BEGIN
    FOR _v_rec IN 
        SELECT oid::regprocedure as function_sig
        FROM pg_proc 
        WHERE proname = 'get_active_promotions_optimized' 
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || _v_rec.function_sig;
    END LOOP;
END $$;

-- Optimized Promotion Discovery RPC with Category Targeting & Randomization
CREATE OR REPLACE FUNCTION get_active_promotions_optimized(
    p_location TEXT,
    p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID, course_id UUID, user_id UUID, title VARCHAR, description TEXT, 
    image_url TEXT, link_url TEXT, location VARCHAR, badge_text VARCHAR, 
    is_active BOOLEAN, is_external BOOLEAN, priority INTEGER, bg_color VARCHAR, 
    target_impressions INTEGER, current_impressions INTEGER, current_clicks INTEGER, 
    start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.course_id, p.user_id, p.title, p.description, p.image_url, 
        p.link_url, p.location, p.badge_text, p.is_active, p.is_external, 
        p.priority, p.bg_color, p.target_impressions, p.current_impressions, 
        p.current_clicks, p.start_date, p.end_date, p.created_at, p.updated_at
    FROM promotions p
    LEFT JOIN courses c ON p.course_id = c.id
    WHERE (p.location = p_location OR p.location = 'all')
      AND p.is_active = true
      AND (p.course_id IS NULL OR c.is_published = true)
      AND (p.end_date IS NULL OR p.end_date > NOW())
      AND (p.target_impressions = 0 OR p.current_impressions < p.target_impressions)
    ORDER BY 
        -- Relevancy Priority: Exact category match gets top billing
        (CASE WHEN p_category_id IS NOT NULL AND c.category_id = p_category_id THEN 2 ELSE 1 END) DESC,
        p.priority DESC, 
        RANDOM(); -- Randomize within same priority level to prevent ad fatigue
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_active_promotions_optimized TO anon, authenticated, service_role;

-- 10. TRIGGER FUNCTION: Validate Ad Request Price
-- Recalculates price on server-side to prevent client-side manipulation
CREATE OR REPLACE FUNCTION validate_ad_request_price() 
RETURNS TRIGGER AS $$
DECLARE
    v_base_rate INTEGER;
    v_location_mult DECIMAL;
    v_calculated_price INTEGER;
BEGIN
    -- 1. Determine Base CPM Rate based on Volume
    IF NEW.target_impressions >= 20000 THEN v_base_rate := 10000;
    ELSIF NEW.target_impressions >= 5000 THEN v_base_rate := 13000;
    ELSE v_base_rate := 16000;
    END IF;

    -- 2. Location Multipliers
    v_location_mult := CASE NEW.location
        WHEN 'homepage_banner' THEN 1.3
        WHEN 'dashboard_card' THEN 1.1
        WHEN 'course_sidebar' THEN 1.0
        WHEN 'course_listing' THEN 1.2
        WHEN 'global_announcement' THEN 1.6
        WHEN 'verify_page' THEN 1.0
        WHEN 'search_recovery' THEN 1.1
        WHEN 'quiz_success' THEN 1.2
        WHEN 'lesson_sidebar' THEN 1.0
        WHEN 'course_listing_spotlight' THEN 1.4
        ELSE 1.0
    END;

    -- 3. Calculate Final Price
    v_calculated_price := ROUND((NEW.target_impressions::DECIMAL / 1000.0) * v_base_rate::DECIMAL * v_location_mult) + (NEW.duration_days * 2000);

    -- 4. Force calculation or reject if mismatch
    -- We'll automatically correct it to ensure the business always gets the right amount
    IF NEW.total_price IS DISTINCT FROM v_calculated_price THEN
        RAISE WARNING 'Price mismatch detected. Client: %, Server: %. Automatically correcting.', NEW.total_price, v_calculated_price;
        NEW.total_price := v_calculated_price;
    END IF;

    -- Also ensure amount_paid doesn't exceed total_price after correction (or matches total_price for full payment)
    NEW.amount_paid := v_calculated_price;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. TRIGGER FUNCTION: Handle Ad Approval
-- Automatically creates a promotion record when a request is set to 'active'
CREATE OR REPLACE FUNCTION handle_ad_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active')) THEN
        INSERT INTO promotions (
          id, course_id, user_id, title, description, image_url, 
          link_url, location, target_impressions, 
          start_date, end_date, is_active
        ) VALUES (
          NEW.id, -- Use same ID for 1:1 mapping
          NEW.course_id, NEW.user_id, NEW.title, NEW.description, NEW.image_url,
          NEW.link_url, NEW.location, NEW.target_impressions,
          NOW(), NOW() + (NEW.duration_days || ' days')::INTERVAL, true
        )
        ON CONFLICT (id) DO UPDATE SET
          is_active = true,
          updated_at = NOW();
          
        NEW.processed_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_ad_approval ON promotion_requests;
CREATE TRIGGER trg_on_ad_approval
BEFORE UPDATE OF status ON promotion_requests
FOR EACH ROW EXECUTE FUNCTION handle_ad_approval();
-- 12. TRIGGER FUNCTION: Sinkronisasi Role ke Metadata Auth
-- Menghindari "Infinite Recursion" di RLS dengan menyimpan role di JWT
CREATE OR REPLACE FUNCTION public.sync_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_role_on_update ON public.user_profiles;
CREATE TRIGGER trg_sync_role_on_update
AFTER INSERT OR UPDATE OF role ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_auth();

-- ============================================
-- EVENT SYSTEM: Triggers & RPC Functions
-- ============================================

-- E1. TRIGGER: updated_at for platform_events
DROP TRIGGER IF EXISTS set_updated_at_platform_events ON platform_events;
CREATE TRIGGER set_updated_at_platform_events BEFORE UPDATE ON platform_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- E2. TRIGGER FUNCTION: Validate Event Capacity & Status on Registration
CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_max_capacity INTEGER;
  v_is_published BOOLEAN;
  v_event_date TIMESTAMPTZ;
  v_reg_deadline TIMESTAMPTZ;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Fetch event info (FOR UPDATE prevents race condition on concurrent registration)
  SELECT max_slots, is_published, event_date, registration_deadline
  INTO v_max_capacity, v_is_published, v_event_date, v_reg_deadline
  FROM platform_events
  WHERE id = NEW.event_id
  FOR UPDATE;

  -- Check published
  IF NOT v_is_published THEN
    RAISE EXCEPTION 'Event belum dipublikasikan.';
  END IF;

  -- Check deadline (use registration_deadline if set, otherwise event_date)
  v_deadline := COALESCE(v_reg_deadline, v_event_date);
  IF NOW() > v_deadline THEN
    RAISE EXCEPTION 'Pendaftaran untuk event ini sudah ditutup.';
  END IF;

  -- Count active registrations (exclude cancelled)
  SELECT COUNT(*) INTO v_current_count
  FROM event_registrations
  WHERE event_id = NEW.event_id AND status NOT IN ('cancelled');

  -- If full, set to waitlisted instead of rejecting
  IF v_current_count >= v_max_capacity THEN
    NEW.status := 'waitlisted';
    -- Calculate waitlist position
    NEW.waitlist_position := (
      SELECT COALESCE(MAX(waitlist_position), 0) + 1
      FROM event_registrations
      WHERE event_id = NEW.event_id AND status = 'waitlisted'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_event_capacity ON event_registrations;
CREATE TRIGGER trg_check_event_capacity
BEFORE INSERT ON event_registrations
FOR EACH ROW EXECUTE FUNCTION check_event_capacity();

-- E3. TRIGGER FUNCTION: Sync registration counts (confirmed, waitlisted, total)
CREATE OR REPLACE FUNCTION sync_event_registration_count()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_confirmed_count INTEGER;
  v_waitlisted_count INTEGER;
BEGIN
  v_event_id := COALESCE(NEW.event_id, OLD.event_id);

  -- Count confirmed (registered/attended) registrations
  SELECT COUNT(*) INTO v_confirmed_count
  FROM event_registrations
  WHERE event_id = v_event_id 
    AND status IN ('registered', 'attended');

  -- Count waitlisted registrations
  SELECT COUNT(*) INTO v_waitlisted_count
  FROM event_registrations
  WHERE event_id = v_event_id 
    AND status = 'waitlisted';

  -- Update event with accurate counts
  UPDATE platform_events
  SET 
    confirmed_registrations = v_confirmed_count,
    waitlisted_count = v_waitlisted_count,
    registration_count = v_confirmed_count + v_waitlisted_count,
    updated_at = NOW()
  WHERE id = v_event_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_event_reg_count ON event_registrations;
CREATE TRIGGER trg_sync_event_reg_count
AFTER INSERT OR UPDATE OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION sync_event_registration_count();

-- E4. RPC: Safe Event Registration (validates everything server-side)
CREATE OR REPLACE FUNCTION register_for_event_safe(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_event RECORD;
  v_deadline TIMESTAMPTZ;
  v_existing RECORD;
  v_price INTEGER;
  v_payment_status TEXT;
  v_result RECORD;
BEGIN
  -- 1. Fetch event
  SELECT * INTO v_event FROM platform_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Event tidak ditemukan.');
  END IF;

  -- 2. Check published
  IF NOT v_event.is_published THEN
    RETURN json_build_object('success', false, 'error', 'Event belum dipublikasikan.');
  END IF;

  -- 3. Check deadline
  v_deadline := COALESCE(v_event.registration_deadline, v_event.event_date);
  IF NOW() > v_deadline THEN
    RETURN json_build_object('success', false, 'error', 'Pendaftaran untuk event ini sudah ditutup.');
  END IF;

  -- 4. Check duplicate
  SELECT * INTO v_existing FROM event_registrations
  WHERE event_id = p_event_id AND user_id = p_user_id;
  IF FOUND THEN
    IF v_existing.status = 'cancelled' THEN
      -- Re-register: update cancelled to registered
      v_price := v_event.price;
      v_payment_status := CASE WHEN v_price > 0 THEN 'pending' ELSE 'free' END;
      UPDATE event_registrations
      SET status = 'registered', payment_status = v_payment_status, payment_amount = v_price
      WHERE id = v_existing.id;
      RETURN json_build_object('success', true, 'message', 'Berhasil mendaftar kembali.', 'id', v_existing.id, 'status', 'registered');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Anda sudah terdaftar untuk event ini.');
    END IF;
  END IF;

  -- 5. Insert (capacity check handled by trigger trg_check_event_capacity)
  v_price := v_event.price;
  v_payment_status := CASE WHEN v_price > 0 THEN 'pending' ELSE 'free' END;

  INSERT INTO event_registrations (event_id, user_id, status, payment_status, payment_amount)
  VALUES (p_event_id, p_user_id, 'registered', v_payment_status, v_price)
  RETURNING * INTO v_result;

  RETURN json_build_object(
    'success', true,
    'message', CASE
      WHEN v_result.status = 'waitlisted' THEN 'Event penuh. Anda masuk dalam waiting list di posisi #' || v_result.waitlist_position || '.'
      WHEN v_price > 0 THEN 'Berhasil mendaftar. Silakan lengkapi pembayaran di Dasbor Anda.'
      ELSE 'Selamat! Kamu berhasil mendaftar untuk event ini.'
    END,
    'id', v_result.id,
    'status', v_result.status,
    'waitlist_position', v_result.waitlist_position
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION register_for_event_safe TO authenticated;

-- E5. RPC: Cancel Event Registration
CREATE OR REPLACE FUNCTION cancel_event_registration(
  p_registration_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_reg RECORD;
  v_promoted RECORD;
BEGIN
  -- 1. Fetch registration
  SELECT er.*, pe.event_date INTO v_reg
  FROM event_registrations er
  JOIN platform_events pe ON pe.id = er.event_id
  WHERE er.id = p_registration_id AND er.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Registrasi tidak ditemukan.');
  END IF;

  -- 2. Cannot cancel if already attended
  IF v_reg.status = 'attended' THEN
    RETURN json_build_object('success', false, 'error', 'Tidak bisa membatalkan — Anda sudah tercatat hadir.');
  END IF;

  IF v_reg.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Registrasi sudah dibatalkan sebelumnya.');
  END IF;

  -- 3. Cancel
  UPDATE event_registrations SET status = 'cancelled', waitlist_position = NULL
  WHERE id = p_registration_id;

  -- 4. Promote first waitlisted user (if any)
  SELECT id INTO v_promoted
  FROM event_registrations
  WHERE event_id = v_reg.event_id AND status = 'waitlisted'
  ORDER BY waitlist_position ASC
  LIMIT 1;

  IF FOUND THEN
    UPDATE event_registrations
    SET status = 'registered', waitlist_position = NULL
    WHERE id = v_promoted.id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Registrasi berhasil dibatalkan.');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cancel_event_registration TO authenticated;

-- E6. RPC: Safe Proof Upload (restricts which fields user can update)
CREATE OR REPLACE FUNCTION update_event_registration_proof(
  p_registration_id UUID,
  p_user_id UUID,
  p_field TEXT, -- 'payment_proof' or 'submission'
  p_file_path TEXT
)
RETURNS JSON AS $$
BEGIN
  -- Validate ownership
  IF NOT EXISTS (
    SELECT 1 FROM event_registrations WHERE id = p_registration_id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Registrasi tidak ditemukan.');
  END IF;

  IF p_field = 'payment_proof' THEN
    UPDATE event_registrations
    SET payment_proof_url = p_file_path, payment_status = 'waiting_verification'
    WHERE id = p_registration_id AND user_id = p_user_id;
  ELSIF p_field = 'submission' THEN
    UPDATE event_registrations
    SET submission_url = p_file_path
    WHERE id = p_registration_id AND user_id = p_user_id;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Field tidak valid.');
  END IF;

  RETURN json_build_object('success', true, 'message', 'File berhasil diunggah.');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_event_registration_proof TO authenticated;

-- E7. RPC: Validate Event Manager (used by client-side updateRegistration for security)
CREATE OR REPLACE FUNCTION validate_event_manager(
  p_registration_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_event_id UUID;
  v_event_creator UUID;
  v_caller_role TEXT;
BEGIN
  -- Get event_id from registration
  SELECT event_id INTO v_event_id
  FROM event_registrations
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'Registration not found.');
  END IF;

  -- Check if caller is admin
  v_caller_role := (auth.jwt() -> 'app_metadata' ->> 'role');
  IF v_caller_role = 'admin' THEN
    RETURN json_build_object('allowed', true);
  END IF;

  -- Check if caller is instructor AND owns the event
  IF v_caller_role = 'instructor' THEN
    SELECT created_by INTO v_event_creator
    FROM platform_events
    WHERE id = v_event_id;

    IF v_event_creator = auth.uid() THEN
      RETURN json_build_object('allowed', true);
    END IF;
  END IF;

  RETURN json_build_object('allowed', false, 'reason', 'Not authorized to manage this registration.');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('allowed', false, 'reason', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_event_manager TO authenticated;

-- E8. TRIGGER: Auto-update updated_at on event_registrations
CREATE OR REPLACE FUNCTION update_event_registration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_event_registration_timestamp ON event_registrations;
CREATE TRIGGER trg_update_event_registration_timestamp
BEFORE UPDATE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION update_event_registration_timestamp();

-- E9. HELPER: Get Accurate Event Capacity Info
CREATE OR REPLACE FUNCTION get_event_capacity_info(p_event_id UUID)
RETURNS TABLE(
  total_capacity INTEGER,
  confirmed_registrations INTEGER,
  waitlisted_count INTEGER,
  registration_count INTEGER,
  available_slots INTEGER,
  is_full BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_slots INTEGER;
  v_confirmed_count INTEGER;
  v_waitlisted_count INTEGER;
  v_registration_count INTEGER;
  v_available_slots INTEGER;
BEGIN
  SELECT 
    pe.max_slots,
    pe.confirmed_registrations,
    pe.waitlisted_count,
    pe.registration_count
  INTO 
    v_max_slots,
    v_confirmed_count,
    v_waitlisted_count,
    v_registration_count
  FROM platform_events pe
  WHERE pe.id = p_event_id;

  v_available_slots := GREATEST(0, COALESCE(v_max_slots, 100) - COALESCE(v_confirmed_count, 0));

  RETURN QUERY SELECT 
    COALESCE(v_max_slots, 100),
    COALESCE(v_confirmed_count, 0),
    COALESCE(v_waitlisted_count, 0),
    COALESCE(v_registration_count, 0),
    v_available_slots,
    (v_available_slots = 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_capacity_info(UUID) TO authenticated;

-- E10. UTILITY: Fix/Recalculate all event capacity counts
-- Usage: SELECT * FROM fix_all_event_capacities();
CREATE OR REPLACE FUNCTION fix_all_event_capacities()
RETURNS TABLE(event_id UUID, confirmed INTEGER, waitlisted INTEGER, total INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH event_counts AS (
    SELECT 
      pe.id,
      COUNT(CASE WHEN er.status IN ('registered', 'attended') THEN 1 END)::INTEGER as confirmed_count,
      COUNT(CASE WHEN er.status = 'waitlisted' THEN 1 END)::INTEGER as waitlisted_count,
      COUNT(CASE WHEN er.status NOT IN ('cancelled') THEN 1 END)::INTEGER as total_count
    FROM platform_events pe
    LEFT JOIN event_registrations er ON pe.id = er.event_id
    GROUP BY pe.id
  )
  UPDATE platform_events
  SET 
    confirmed_registrations = ec.confirmed_count,
    waitlisted_count = ec.waitlisted_count,
    registration_count = ec.total_count
  FROM event_counts ec
  WHERE platform_events.id = ec.id
  RETURNING platform_events.id, ec.confirmed_count, ec.waitlisted_count, ec.total_count;
END;
$$;

-- ============================================
-- E11. MISSING FUNCTIONS ADDED FROM AUDIT
-- ============================================

-- 1. SEARCH: Ranked Course Search
DROP FUNCTION IF EXISTS search_courses_ranked(TEXT, TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_courses_ranked(
  p_query TEXT,
  p_category_slug TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  slug VARCHAR,
  short_description VARCHAR,
  thumbnail_url TEXT,
  price INTEGER,
  discount_price INTEGER,
  admin_discount_price INTEGER,
  level VARCHAR,
  language VARCHAR,
  duration_hours NUMERIC,
  total_lessons INTEGER,
  rating NUMERIC,
  total_reviews INTEGER,
  total_students INTEGER,
  is_published BOOLEAN,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  category_id UUID,
  category_name VARCHAR,
  category_slug VARCHAR,
  instructor_name VARCHAR,
  instructor_slug VARCHAR,
  instructor_avatar_url TEXT,
  instructor_website_url TEXT,
  instructor_linkedin_url TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.slug,
    c.short_description,
    c.thumbnail_url,
    c.price,
    c.discount_price,
    c.admin_discount_price,
    c.level,
    c.language,
    c.duration_hours,
    c.total_lessons,
    c.rating,
    c.total_reviews,
    c.total_students,
    c.is_published,
    c.is_featured,
    c.created_at,
    c.updated_at,
    c.tags,
    cat.id AS category_id,
    cat.name AS category_name,
    cat.slug AS category_slug,
    i.name AS instructor_name,
    i.slug AS instructor_slug,
    i.avatar_url AS instructor_avatar_url,
    i.website_url AS instructor_website_url,
    i.linkedin_url AS instructor_linkedin_url,
    ts_rank(c.title_description_vector, websearch_to_tsquery('indonesian', p_query)) AS rank
  FROM courses c
  JOIN categories cat ON c.category_id = cat.id
  JOIN instructors i ON c.instructor_id = i.id
  WHERE c.is_published = true
    AND c.title_description_vector @@ websearch_to_tsquery('indonesian', p_query)
    AND (p_category_slug = 'all' OR cat.slug = p_category_slug)
  ORDER BY rank DESC, c.total_students DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION search_courses_ranked TO anon, authenticated, service_role;

-- 2. AD ANALYTICS: Revenue Summary
DROP FUNCTION IF EXISTS get_ad_revenue_summary();
CREATE OR REPLACE FUNCTION get_ad_revenue_summary()
RETURNS TABLE (
  total_revenue BIGINT,
  total_active_campaigns BIGINT,
  total_completed_campaigns BIGINT,
  total_pending_requests BIGINT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  average_ctr NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(total_price)::BIGINT FROM promotion_requests WHERE status = 'active' OR status = 'completed'), 0),
    COALESCE((SELECT COUNT(*)::BIGINT FROM promotions WHERE is_active = true), 0),
    COALESCE((SELECT COUNT(*)::BIGINT FROM promotions WHERE is_active = false), 0),
    COALESCE((SELECT COUNT(*)::BIGINT FROM promotion_requests WHERE status IN ('draft', 'waiting_verification')), 0),
    COALESCE((SELECT SUM(current_impressions)::BIGINT FROM promotions), 0),
    COALESCE((SELECT SUM(current_clicks)::BIGINT FROM promotions), 0),
    CASE 
      WHEN COALESCE((SELECT SUM(current_impressions) FROM promotions), 0) > 0
      THEN ROUND(
        (COALESCE((SELECT SUM(current_clicks) FROM promotions), 0)::NUMERIC / 
         COALESCE((SELECT SUM(current_impressions) FROM promotions), 1)::NUMERIC) * 100, 2
      )
      ELSE 0
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ad_revenue_summary TO authenticated;

-- 3. AD ANALYTICS: Monthly Revenue
DROP FUNCTION IF EXISTS get_monthly_ad_revenue(INTEGER);
CREATE OR REPLACE FUNCTION get_monthly_ad_revenue(p_year INTEGER)
RETURNS TABLE (
  month INTEGER,
  month_name TEXT,
  revenue BIGINT,
  campaigns BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(MONTH FROM pr.created_at)::INTEGER AS month,
    TO_CHAR(pr.created_at, 'Mon') AS month_name,
    COALESCE(SUM(pr.total_price)::BIGINT, 0) AS revenue,
    COUNT(*)::BIGINT AS campaigns
  FROM promotion_requests pr
  WHERE EXTRACT(YEAR FROM pr.created_at) = p_year
    AND pr.status IN ('active', 'completed')
  GROUP BY EXTRACT(MONTH FROM pr.created_at), TO_CHAR(pr.created_at, 'Mon')
  ORDER BY month;
END;
$$;

GRANT EXECUTE ON FUNCTION get_monthly_ad_revenue TO authenticated;

-- 4. AD ANALYTICS: Top Performing Ads
DROP FUNCTION IF EXISTS get_top_performing_ads(INTEGER);
CREATE OR REPLACE FUNCTION get_top_performing_ads(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  location VARCHAR,
  current_impressions INTEGER,
  current_clicks INTEGER,
  ctr NUMERIC,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.location,
    p.current_impressions,
    p.current_clicks,
    CASE 
      WHEN p.current_impressions > 0 
      THEN ROUND((p.current_clicks::NUMERIC / p.current_impressions::NUMERIC) * 100, 2)
      ELSE 0
    END AS ctr,
    p.is_active
  FROM promotions p
  WHERE p.current_impressions > 0
  ORDER BY p.current_clicks DESC, p.current_impressions DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_top_performing_ads TO authenticated;

-- 5. AD ANALYTICS: Revenue by Location
DROP FUNCTION IF EXISTS get_ad_revenue_by_location();
CREATE OR REPLACE FUNCTION get_ad_revenue_by_location()
RETURNS TABLE (
  location VARCHAR,
  total_revenue BIGINT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  campaign_count BIGINT,
  average_ctr NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.location,
    COALESCE(SUM(pr.total_price)::BIGINT, 0) AS total_revenue,
    COALESCE(SUM(p.current_impressions)::BIGINT, 0) AS total_impressions,
    COALESCE(SUM(p.current_clicks)::BIGINT, 0) AS total_clicks,
    COUNT(DISTINCT p.id)::BIGINT AS campaign_count,
    CASE 
      WHEN SUM(p.current_impressions) > 0
      THEN ROUND((SUM(p.current_clicks)::NUMERIC / SUM(p.current_impressions)::NUMERIC) * 100, 2)
      ELSE 0
    END AS average_ctr
  FROM promotions p
  LEFT JOIN promotion_requests pr ON p.id = pr.id
  GROUP BY p.location
  ORDER BY total_revenue DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ad_revenue_by_location TO authenticated;

-- 6. AD ANALYTICS: Archived Promotions
DROP FUNCTION IF EXISTS get_archived_promotions(INTEGER);
CREATE OR REPLACE FUNCTION get_archived_promotions(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  location VARCHAR,
  target_impressions INTEGER,
  current_impressions INTEGER,
  current_clicks INTEGER,
  total_price INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.title,
    pa.location,
    pa.target_impressions,
    pa.current_impressions,
    pa.current_clicks,
    pa.total_price,
    pa.start_date,
    pa.end_date,
    pa.archived_at
  FROM promotion_archives pa
  ORDER BY pa.archived_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_archived_promotions TO authenticated;

-- 7. AD ANALYTICS: Impression Logs
DROP FUNCTION IF EXISTS get_impression_logs(UUID, INTEGER);
CREATE OR REPLACE FUNCTION get_impression_logs(
  p_promo_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  promo_id UUID,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pil.id,
    pil.promo_id,
    pil.user_id,
    pil.ip_address,
    pil.created_at
  FROM promotion_impression_logs pil
  WHERE (p_promo_id IS NULL OR pil.promo_id = p_promo_id)
  ORDER BY pil.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_impression_logs TO authenticated;

-- 8. AD ANALYTICS: Suspicious Activity Detection
DROP FUNCTION IF EXISTS get_suspicious_ad_activity(INTEGER);
CREATE OR REPLACE FUNCTION get_suspicious_ad_activity(p_threshold INTEGER DEFAULT 50)
RETURNS TABLE (
  ip_address TEXT,
  user_id UUID,
  impression_count BIGINT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  promo_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pil.ip_address,
    pil.user_id,
    COUNT(*)::BIGINT AS impression_count,
    MIN(pil.created_at) AS first_seen,
    MAX(pil.created_at) AS last_seen,
    ARRAY_AGG(DISTINCT pil.promo_id) AS promo_ids
  FROM promotion_impression_logs pil
  WHERE pil.created_at > NOW() - INTERVAL '1 hour'
  GROUP BY pil.ip_address, pil.user_id
  HAVING COUNT(*) >= p_threshold
  ORDER BY impression_count DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_suspicious_ad_activity TO authenticated;

-- 9. FIX: Missing Trigger for validate_ad_request_price
-- Fungsi sudah ada di 02_logic.sql tapi trigger-nya
-- tidak pernah di-CREATE. Ini celah keamanan!
DROP TRIGGER IF EXISTS trg_validate_ad_request_price ON promotion_requests;
CREATE TRIGGER trg_validate_ad_request_price
BEFORE INSERT OR UPDATE OF target_impressions, duration_days, location, total_price ON promotion_requests
FOR EACH ROW EXECUTE FUNCTION validate_ad_request_price();
