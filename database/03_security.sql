-- ======================================================
-- 03_security.sql
-- MyLearning - Security & RBAC (Role-Based Access Control)
-- ======================================================

-- 0. HELPER FUNCTIONS (JWT-based to Avoid Infinite Recursion)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  -- Checks role directly from JWT claims (app_metadata) to avoid infinite recursion
  -- This is the SAFEST way as it does not query any table.
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_instructor() 
RETURNS boolean AS $$
BEGIN
  -- Checks role directly from JWT claims (app_metadata)
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'instructor';
END;
$$ LANGUAGE plpgsql STABLE;


-- 1. USER PROFILES Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view user profile headers" ON user_profiles;
CREATE POLICY "Anyone can view user profile headers" ON user_profiles 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Separate policies to avoid recursion during SELECT
-- Separate policies to avoid recursion during SELECT
-- Ensure we dropdown any potentially recursive legacy policies first
DROP POLICY IF EXISTS "Instructors can view profiles of their students" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view users" ON user_profiles;

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles" ON user_profiles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update profiles" ON user_profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete profiles" ON user_profiles FOR DELETE USING (is_admin());

-- IMPORTANT: We removed the redundant "Instructors can see profiles of their students" policy 
-- because it was recursive and already covered by the "Anyone can view" policy.

-- 2. INSTRUCTORS Policies
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view instructors" ON instructors;
CREATE POLICY "Anyone can view instructors" ON instructors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Instructors can update own data" ON instructors;
CREATE POLICY "Instructors can update own data" ON instructors FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all instructors" ON instructors;
CREATE POLICY "Admins can manage all instructors" ON instructors FOR ALL USING (is_admin());

-- 3. COURSES Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Admins/Instructors can view all courses" ON courses;
CREATE POLICY "Admins/Instructors can view all courses" ON courses FOR SELECT USING (is_admin() OR is_instructor());
DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;
CREATE POLICY "Instructors can manage own courses" ON courses FOR ALL USING (EXISTS (SELECT 1 FROM instructors WHERE instructors.user_id = auth.uid() AND instructors.id = courses.instructor_id));
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
CREATE POLICY "Admins can manage all courses" ON courses FOR ALL USING (is_admin());

-- 4. LESSONS Policies
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Instructors can manage lessons of own courses" ON lessons;
CREATE POLICY "Instructors can manage lessons of own courses" ON lessons FOR ALL USING (EXISTS (SELECT 1 FROM courses c JOIN instructors i ON c.instructor_id = i.id WHERE c.id = lessons.course_id AND i.user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage all lessons" ON lessons;
CREATE POLICY "Admins can manage all lessons" ON lessons FOR ALL USING (is_admin());

-- 5. ENROLLMENTS Policies
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON enrollments;
CREATE POLICY "Instructors can view enrollments for their courses" 
ON enrollments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM courses c 
        JOIN instructors i ON c.instructor_id = i.id 
        WHERE c.id = enrollments.course_id AND i.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can enroll themselves" ON enrollments;
CREATE POLICY "Users can enroll themselves" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment proof" ON enrollments;
CREATE POLICY "Users can update own payment proof" ON enrollments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;
CREATE POLICY "Admins can manage all enrollments" ON enrollments FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Instructors can update enrollments for their courses" ON enrollments;
CREATE POLICY "Instructors can update enrollments for their courses" 
ON enrollments FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM courses c 
        JOIN instructors i ON c.instructor_id = i.id 
        WHERE c.id = enrollments.course_id AND i.user_id = auth.uid()
    )
);

-- 6. CONTENT ACCESS (Paywall)
DROP POLICY IF EXISTS "Access lesson content" ON lessons;
CREATE POLICY "Access lesson content" ON lessons FOR SELECT USING (is_free_preview = true OR is_admin() OR EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = lessons.course_id AND enrollments.user_id = auth.uid() AND enrollments.payment_status IN ('paid', 'completed')) OR EXISTS (SELECT 1 FROM courses c JOIN instructors i ON c.instructor_id = i.id WHERE c.id = lessons.course_id AND i.user_id = auth.uid()));

-- PROGRESS MONITORING FOR INSTRUCTORS
DROP POLICY IF EXISTS "Instructors can view lesson progress for their courses" ON lesson_progress;
CREATE POLICY "Instructors can view lesson progress for their courses" ON lesson_progress FOR SELECT USING (is_instructor() AND EXISTS (SELECT 1 FROM enrollments e JOIN courses c ON e.course_id = c.id JOIN instructors i ON c.instructor_id = i.id WHERE e.id = lesson_progress.enrollment_id AND i.user_id = auth.uid()));

DROP POLICY IF EXISTS "Instructors can view quiz progress for their courses" ON quiz_progress;
CREATE POLICY "Instructors can view quiz progress for their courses" ON quiz_progress FOR SELECT USING (is_instructor() AND EXISTS (SELECT 1 FROM enrollments e JOIN courses c ON e.course_id = c.id JOIN instructors i ON c.instructor_id = i.id WHERE e.id = quiz_progress.enrollment_id AND i.user_id = auth.uid()));

DROP POLICY IF EXISTS "Instructors can view assignment progress for their courses" ON assignment_progress;
CREATE POLICY "Instructors can view assignment progress for their courses" ON assignment_progress FOR SELECT USING (is_instructor() AND EXISTS (SELECT 1 FROM enrollments e JOIN courses c ON e.course_id = c.id JOIN instructors i ON c.instructor_id = i.id WHERE e.id = assignment_progress.enrollment_id AND i.user_id = auth.uid()));

-- 7. PROGRESS TRACKING
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own lesson progress" ON lesson_progress;
CREATE POLICY "Users manage own lesson progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);

ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own quiz progress" ON quiz_progress;
CREATE POLICY "Users manage own quiz progress" ON quiz_progress FOR ALL USING (auth.uid() = user_id);

ALTER TABLE assignment_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own assignment progress" ON assignment_progress;
CREATE POLICY "Users manage own assignment progress" ON assignment_progress FOR ALL USING (auth.uid() = user_id);

-- 8. DISCUSSIONS & NOTIFICATIONS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view discussions" ON discussions;
CREATE POLICY "Anyone can view discussions" ON discussions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create discussions" ON discussions;
CREATE POLICY "Users can create discussions" ON discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own discussions" ON discussions;
CREATE POLICY "Users can manage own discussions" ON discussions FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- 9. ASSESSMENTS
ALTER TABLE assessment_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view assessments" ON assessment_definitions;
CREATE POLICY "Anyone can view assessments" ON assessment_definitions FOR SELECT USING (true);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enrolled students can view questions" ON assessment_questions;
CREATE POLICY "Enrolled students can view questions" ON assessment_questions FOR SELECT USING (EXISTS (SELECT 1 FROM assessment_definitions ad JOIN enrollments e ON ad.course_id = e.course_id WHERE ad.id = assessment_questions.assessment_id AND e.user_id = auth.uid() AND e.payment_status IN ('paid', 'completed')) OR is_admin() OR is_instructor());

-- 9.5 REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (is_approved = true);
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own reviews" ON reviews;
CREATE POLICY "Users can manage own reviews" ON reviews FOR ALL USING (auth.uid() = user_id);

-- 10. OTHER
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send messages" ON contact_messages;
CREATE POLICY "Anyone can send messages" ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage messages" ON contact_messages;
CREATE POLICY "Admins can manage messages" ON contact_messages FOR ALL USING (is_admin());

-- 11. CERTIFICATES
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view certificates" ON certificates;
CREATE POLICY "Public can view certificates" ON certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can request revision for their own certificate" ON certificates;
CREATE POLICY "Users can request revision for their own certificate"
ON certificates FOR UPDATE
USING (auth.uid() = user_id AND revision_count < 1)
WITH CHECK (auth.uid() = user_id AND revision_status = 'pending');

DROP POLICY IF EXISTS "Admins can manage all certificates" ON certificates;
CREATE POLICY "Admins can manage all certificates" ON certificates FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Instructors can view certificates for their courses" ON certificates;
CREATE POLICY "Instructors can view certificates for their courses" 
ON certificates FOR SELECT 
USING (
    (is_instructor() AND EXISTS (
        SELECT 1 FROM courses c 
        JOIN instructors i ON c.instructor_id = i.id 
        WHERE c.id = certificates.course_id AND i.user_id = auth.uid()
    ))
);

-- 12. PROMOTIONS & ADS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
CREATE POLICY "Anyone can view active promotions" ON promotions FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "Admins can manage all promotions" ON promotions;
CREATE POLICY "Admins can manage all promotions" ON promotions FOR ALL USING (is_admin());

ALTER TABLE promotion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and manage own requests" ON promotion_requests;
CREATE POLICY "Users can view and manage own requests" ON promotion_requests FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all requests" ON promotion_requests;
CREATE POLICY "Admins can manage all requests" ON promotion_requests FOR ALL USING (is_admin());

ALTER TABLE promotion_impression_logs ENABLE ROW LEVEL SECURITY;
-- Logs are primarily written via SECURITY DEFINER functions, so we only need to restrict SELECT
DROP POLICY IF EXISTS "Only admins can view logs" ON promotion_impression_logs;
CREATE POLICY "Only admins can view logs" ON promotion_impression_logs FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "System can insert logs" ON promotion_impression_logs;
CREATE POLICY "System can insert logs" ON promotion_impression_logs FOR INSERT WITH CHECK (true); -- Functions use this

-- 14. VOUCHERS Policies
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON vouchers;
CREATE POLICY "Public can view active coupons" ON vouchers 
FOR SELECT USING (
    is_active = true AND 
    (target_user_id IS NULL OR target_user_id = auth.uid()) AND
    (start_date <= NOW()) AND
    (expiry_date IS NULL OR expiry_date > NOW())
);

DROP POLICY IF EXISTS "Instructors can manage own vouchers" ON vouchers;
CREATE POLICY "Instructors can manage own vouchers" ON vouchers 
FOR ALL USING (
    is_admin() OR 
    (is_instructor() AND EXISTS (
        SELECT 1 FROM instructors 
        WHERE instructors.user_id = auth.uid() AND instructors.id = vouchers.instructor_id
    ))
);

DROP POLICY IF EXISTS "Admins can manage all vouchers" ON vouchers;
CREATE POLICY "Admins can manage all vouchers" ON vouchers 
FOR ALL USING (is_admin());

-- 15. VOUCHER WALLET Policies
ALTER TABLE voucher_wallet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wallet" ON voucher_wallet;
CREATE POLICY "Users can manage own wallet" ON voucher_wallet 
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON voucher_wallet;
CREATE POLICY "Admins can view all wallets" ON voucher_wallet 
FOR SELECT USING (is_admin());

-- 16. PLATFORM EVENTS Policies
ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published events" ON platform_events;
CREATE POLICY "Anyone can view published events" ON platform_events FOR SELECT USING (is_published = true OR is_admin() OR (is_instructor() AND auth.uid() = created_by));
DROP POLICY IF EXISTS "Admins can manage all events" ON platform_events;
CREATE POLICY "Admins can manage all events" ON platform_events FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Instructors can manage own events" ON platform_events;
CREATE POLICY "Instructors can manage own events" ON platform_events FOR ALL USING (is_instructor() AND auth.uid() = created_by) WITH CHECK (is_instructor() AND auth.uid() = created_by);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can register themselves" ON event_registrations;
CREATE POLICY "Users can register themselves" ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own registration" ON event_registrations;
CREATE POLICY "Users can manage own registration" ON event_registrations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;
CREATE POLICY "Admins can manage all registrations" ON event_registrations FOR ALL USING (is_admin());

-- ======================================================
-- 13. STORAGE POLICIES
-- ======================================================

-- 13.1 STORAGE: thumbnails (Course Thumbnails & Promos)
-- Anyone can view
DROP POLICY IF EXISTS "Public Access thumbnails" ON storage.objects;
CREATE POLICY "Public Access thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');

-- Admins & Instructors can manage
DROP POLICY IF EXISTS "Admin/Instructor manage thumbnails" ON storage.objects;
CREATE POLICY "Admin/Instructor manage thumbnails" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'thumbnails' AND (is_admin() OR is_instructor())
)
WITH CHECK (
  bucket_id = 'thumbnails' AND (is_admin() OR is_instructor())
);


-- 13.2 STORAGE: avatars (User Profiles)
-- Anyone can view
DROP POLICY IF EXISTS "Public Access avatars" ON storage.objects;
CREATE POLICY "Public Access avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Users can manage their own avatar, Admins can manage all
DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
CREATE POLICY "Users can manage own avatar" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (auth.uid()::text = (storage.foldername(name))[1]) OR is_admin()
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND (
    (auth.uid()::text = (storage.foldername(name))[1]) OR is_admin()
  )
);


-- 13.3 STORAGE: payments (Payment Proofs)
-- Only owner and admins can view
DROP POLICY IF EXISTS "Owner/Admin view payments" ON storage.objects;
CREATE POLICY "Owner/Admin view payments" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payments' AND (
    (auth.uid()::text = (storage.foldername(name))[1]) OR is_admin()
  )
);

-- Users can upload their own proof
DROP POLICY IF EXISTS "Users upload own payment proof" ON storage.objects;
CREATE POLICY "Users upload own payment proof" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payments' AND (
    auth.uid()::text = (storage.foldername(name))[1]
  )
);


-- 13.4 STORAGE: chat_attachments (Help Center)
DROP POLICY IF EXISTS "Users/Admin access chat files" ON storage.objects;
CREATE POLICY "Users/Admin access chat files" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'chat_attachments' AND (
    (auth.uid()::text = (storage.foldername(name))[1]) OR is_admin()
  )
)
WITH CHECK (
  bucket_id = 'chat_attachments' AND (
    (auth.uid()::text = (storage.foldername(name))[1]) OR is_admin()
  )
);


-- 13.5 STORAGE: submissions (Assignments)
DROP POLICY IF EXISTS "Students/Admin access submissions" ON storage.objects;
CREATE POLICY "Students/Admin access submissions" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'submissions' AND (
    (auth.uid()::text = (storage.foldername(name))[1]) OR is_admin() OR is_instructor()
  )
)
WITH CHECK (
  bucket_id = 'submissions' AND (
    (auth.uid()::text = (storage.foldername(name))[1]) OR is_admin() OR is_instructor()
  )
);


-- 13.6 STORAGE: videos (Course Lessons)
-- Admins/Instructors manage, Enrolled students can view (handled via app logic usually, but here is base)
DROP POLICY IF EXISTS "Admin/Instructor manage videos" ON storage.objects;
CREATE POLICY "Admin/Instructor manage videos" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'videos' AND (is_admin() OR is_instructor())
)
WITH CHECK (
  bucket_id = 'videos' AND (is_admin() OR is_instructor())
);

DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
CREATE POLICY "Public can view videos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos'); -- Actual paywall is handled by App & Lesson policies
