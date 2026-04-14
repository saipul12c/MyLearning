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
    
    IF (NEW.progress_percentage >= 100 AND NEW.payment_status = 'paid') THEN
        
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

        -- E. Hitung Masa Berlaku (2 Tahun)
        v_valid_until := NOW() + INTERVAL '2 years';

        -- F. Insert atau Update ke Tabel Certificates
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

-- Certificate Generation
DROP TRIGGER IF EXISTS trg_auto_generate_certificate ON public.enrollments;
CREATE TRIGGER trg_auto_generate_certificate
BEFORE UPDATE OF progress_percentage, payment_status ON public.enrollments
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
            total_courses = (SELECT COUNT(*) FROM courses WHERE instructor_id = r_instructor.id)
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

-- 7. FUNCTION: Increment Ad Impressions
-- Atomically increments current_impressions and handles completion status
-- Includes robust anti-fraud cooldown (5 minutes per user/IP)
CREATE OR REPLACE FUNCTION increment_ad_impressions(
    promo_id UUID, 
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
        WHERE promo_id = increment_ad_impressions.promo_id 
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
        WHERE id = promo_id;

        -- Log the impression
        INSERT INTO promotion_impression_logs (promo_id, user_id, ip_address)
        VALUES (promo_id, p_user_id, v_final_ip);
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

-- Optimized Promotion Discovery RPC with Category Targeting & Randomization
DROP FUNCTION IF EXISTS get_active_promotions_optimized(text);
DROP FUNCTION IF EXISTS get_active_promotions_optimized(text, uuid);
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
    WHERE p.location = p_location
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
