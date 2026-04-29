-- ============================================
-- 20_achievement_triggers.sql
-- MyLearning - Hooking achievements into existing system
-- ============================================

-- 1. EXTEND LESSON COMPLETION TRIGGER
CREATE OR REPLACE FUNCTION trigger_achievements_on_lesson_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_total_completed INTEGER;
    v_role VARCHAR;
BEGIN
    -- Get user details
    SELECT total_lessons_completed, role INTO v_total_completed, v_role 
    FROM user_profiles WHERE user_id = NEW.user_id;

    -- Only for regular users
    IF v_role != 'user' THEN
        RETURN NEW;
    END IF;

    -- Award "Pencetak Sejarah" achievement if first lesson
    IF v_total_completed >= 1 THEN
        PERFORM check_and_award_achievement(NEW.user_id, 'first-lesson-comp');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_achievements_on_lesson_completion ON lesson_progress;
CREATE TRIGGER trg_achievements_on_lesson_completion
AFTER INSERT OR UPDATE OF is_completed ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_achievements_on_lesson_completion();

-- 2. EXTEND QUIZ COMPLETION TRIGGER
CREATE OR REPLACE FUNCTION trigger_achievements_on_quiz_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_perfect_quizzes INTEGER;
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role FROM user_profiles WHERE user_id = NEW.user_id;
    IF v_role != 'user' THEN
        RETURN NEW;
    END IF;

    IF (NEW.passed = true AND (OLD.passed = false OR OLD.passed IS NULL)) THEN
        -- Check if perfect score (100)
        IF NEW.score >= 100 THEN
            -- Count perfect quizzes
            SELECT COUNT(*) INTO v_perfect_quizzes 
            FROM quiz_progress WHERE user_id = NEW.user_id AND score >= 100;

            IF v_perfect_quizzes >= 5 THEN
                PERFORM check_and_award_achievement(NEW.user_id, 'quiz-ace');
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_achievements_on_quiz_completion ON quiz_progress;
CREATE TRIGGER trg_achievements_on_quiz_completion
AFTER INSERT OR UPDATE OF passed ON quiz_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_achievements_on_quiz_completion();

-- 3. EVENT REGISTRATION TRIGGER
CREATE OR REPLACE FUNCTION trigger_achievements_on_event_registration()
RETURNS TRIGGER AS $$
DECLARE
    v_event_count INTEGER;
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role FROM user_profiles WHERE user_id = NEW.user_id;
    IF v_role != 'user' THEN
        RETURN NEW;
    END IF;

    IF (NEW.status = 'registered' OR NEW.status = 'attended') THEN
        SELECT COUNT(*) INTO v_event_count 
        FROM event_registrations WHERE user_id = NEW.user_id AND (status = 'registered' OR status = 'attended');

        IF v_event_count >= 3 THEN
            PERFORM check_and_award_achievement(NEW.user_id, 'event-attendee');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_achievements_on_event_registration ON event_registrations;
CREATE TRIGGER trg_achievements_on_event_registration
AFTER INSERT OR UPDATE OF status ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION trigger_achievements_on_event_registration();

-- 4. COURSE COMPLETION TRIGGER (On Enrollments Update)
CREATE OR REPLACE FUNCTION trigger_achievements_on_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_course_count INTEGER;
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role FROM user_profiles WHERE user_id = NEW.user_id;
    IF v_role != 'user' THEN
        RETURN NEW;
    END IF;

    IF (NEW.progress_percentage >= 100 AND OLD.progress_percentage < 100) THEN
        -- Award "Pencari Ilmu" for 1st course
        PERFORM check_and_award_achievement(NEW.user_id, 'course-finisher');

        -- Count completed courses
        SELECT COUNT(*) INTO v_course_count 
        FROM enrollments WHERE user_id = NEW.user_id AND progress_percentage >= 100;

        IF v_course_count >= 5 THEN
            PERFORM check_and_award_achievement(NEW.user_id, 'fast-learner'); -- simplified criteria
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_achievements_on_course_completion ON enrollments;
CREATE TRIGGER trg_achievements_on_course_completion
AFTER UPDATE OF progress_percentage ON enrollments
FOR EACH ROW
EXECUTE FUNCTION trigger_achievements_on_course_completion();

-- 5. STREAK TRIGGER
CREATE OR REPLACE FUNCTION trigger_achievements_on_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Role check
    IF NEW.role != 'user' THEN
        RETURN NEW;
    END IF;

    IF (NEW.streak_count >= 7 AND OLD.streak_count < 7) THEN
        PERFORM check_and_award_achievement(NEW.user_id, 'streak-week');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_achievements_on_streak ON user_profiles;
CREATE TRIGGER trg_achievements_on_streak
AFTER UPDATE OF streak_count ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_achievements_on_streak();

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
