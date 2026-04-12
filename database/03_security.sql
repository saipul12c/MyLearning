-- ======================================================
-- 03_security.sql
-- MyLearning - Security & RBAC (Role-Based Access Control)
-- ======================================================

-- 0. HELPER FUNCTIONS (Avoid Infinite Recursion)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_instructor() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'instructor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. USER PROFILES Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view user profile headers" ON user_profiles;
CREATE POLICY "Anyone can view user profile headers" ON user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (is_admin());

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
CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM courses JOIN instructors ON courses.instructor_id = instructors.id WHERE courses.id = enrollments.course_id AND instructors.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own payment proof" ON enrollments;
CREATE POLICY "Users can update own payment proof" ON enrollments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;
CREATE POLICY "Admins can manage all enrollments" ON enrollments FOR ALL USING (is_admin());

-- 6. CONTENT ACCESS (Paywall)
DROP POLICY IF EXISTS "Access lesson content" ON lessons;
CREATE POLICY "Access lesson content" ON lessons FOR SELECT USING (is_free_preview = true OR is_admin() OR EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = lessons.course_id AND enrollments.user_id = auth.uid() AND enrollments.payment_status IN ('paid', 'completed')) OR EXISTS (SELECT 1 FROM courses c JOIN instructors i ON c.instructor_id = i.id WHERE c.id = lessons.course_id AND i.user_id = auth.uid()));

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

-- 10. OTHER
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send messages" ON contact_messages;
CREATE POLICY "Anyone can send messages" ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage messages" ON contact_messages;
CREATE POLICY "Admins can manage messages" ON contact_messages FOR ALL USING (is_admin());
