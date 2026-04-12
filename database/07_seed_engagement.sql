-- ======================================================
-- 07_seed_engagement.sql
-- MyLearning - Reviews, Testimonials & Audit Tools
-- ======================================================

-- 1. REVIEWS & TESTIMONIALS
DO $$
DECLARE
    -- User IDs (From 04_seed_users.sql)
    id_dimas UUID; id_anisa UUID; id_raka UUID; id_siti UUID;
    id_budi UUID; id_cindy UUID; id_david UUID; id_eva UUID; id_fajar UUID;
    id_gita UUID; id_hana UUID; id_indra UUID; id_joko UUID; id_kartika UUID;
    -- Course IDs
    cid_react UUID; cid_python UUID; cid_uiux UUID; cid_flutter UUID;
    cid_ai UUID; cid_devops UUID; cid_marketing UUID; cid_illustrator UUID;
    cid_js UUID; cid_node UUID; cid_rn UUID; cid_sql UUID;
    cid_startup UUID; cid_ts UUID;
BEGIN
    -- GET COURSE IDs
    SELECT id INTO cid_react FROM courses WHERE slug = 'mastering-react-nextjs';
    SELECT id INTO cid_python FROM courses WHERE slug = 'python-data-science-ml';
    SELECT id INTO cid_uiux FROM courses WHERE slug = 'uiux-design-figma';
    SELECT id INTO cid_flutter FROM courses WHERE slug = 'flutter-mobile-development';
    SELECT id INTO cid_ai FROM courses WHERE slug = 'deep-learning-ai';
    SELECT id INTO cid_devops FROM courses WHERE slug = 'devops-for-engineers';
    SELECT id INTO cid_marketing FROM courses WHERE slug = 'digital-marketing-mastery';
    SELECT id INTO cid_illustrator FROM courses WHERE slug = 'illustrator-pro';
    SELECT id INTO cid_js FROM courses WHERE slug = 'javascript-fundamental';
    SELECT id INTO cid_node FROM courses WHERE slug = 'nodejs-mastery';
    SELECT id INTO cid_rn FROM courses WHERE slug = 'react-native-pro';
    SELECT id INTO cid_sql FROM courses WHERE slug = 'sql-mastery';
    SELECT id INTO cid_startup FROM courses WHERE slug = 'startup-modern';
    SELECT id INTO cid_ts FROM courses WHERE slug = 'typescript-pro';

    -- GET GHOST USER IDs
    SELECT user_id INTO id_dimas FROM user_profiles WHERE full_name = 'Dimas Pratama' LIMIT 1;
    SELECT user_id INTO id_anisa FROM user_profiles WHERE full_name = 'Anisa Putri' LIMIT 1;
    SELECT user_id INTO id_raka FROM user_profiles WHERE full_name = 'Raka Mahendra' LIMIT 1;
    SELECT user_id INTO id_siti FROM user_profiles WHERE full_name = 'Siti Aminah' LIMIT 1;
    SELECT user_id INTO id_budi FROM user_profiles WHERE full_name = 'Budi Cahyono' LIMIT 1;
    SELECT user_id INTO id_cindy FROM user_profiles WHERE full_name = 'Cindy Lestari' LIMIT 1;
    SELECT user_id INTO id_david FROM user_profiles WHERE full_name = 'David Wijaya' LIMIT 1;
    SELECT user_id INTO id_eva FROM user_profiles WHERE full_name = 'Eva Maria' LIMIT 1;
    SELECT user_id INTO id_fajar FROM user_profiles WHERE full_name = 'Fajar Ramadhan' LIMIT 1;
    SELECT user_id INTO id_gita FROM user_profiles WHERE full_name = 'Gita Permatasari' LIMIT 1;
    SELECT user_id INTO id_hana FROM user_profiles WHERE full_name = 'Hana Syarifah' LIMIT 1;
    SELECT user_id INTO id_indra FROM user_profiles WHERE full_name = 'Indra Kusuma' LIMIT 1;
    SELECT user_id INTO id_joko FROM user_profiles WHERE full_name = 'Joko Susanto' LIMIT 1;
    SELECT user_id INTO id_kartika FROM user_profiles WHERE full_name = 'Kartika Sari' LIMIT 1;

    -- INSERT TESTIMONIAL REVIEWS (One per course, matching unique users)
    
    -- 1. Dimas -> React
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_react, id_dimas, 5, 'Kursus React & Next.js di MyLearning benar-benar mengubah karir saya. Dalam 3 bulan, saya berhasil landing job sebagai developer di perusahaan unicorn!', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 2. Anisa -> Python
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_python, id_anisa, 5, 'Materi Python untuk Data Science sangat komprehensif. Instrukturnya sabar dan menjelaskan konsep kompleks dengan cara yang mudah dipahami.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 3. Raka -> UIUX
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_uiux, id_raka, 5, 'Setelah menyelesaikan kursus UI/UX Design, portofolio saya meningkat drastis. Sekarang saya bisa mendapatkan klien freelance dari luar negeri.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 4. Siti -> Flutter
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_flutter, id_siti, 5, 'Belajar Flutter di sini sangat menyenangkan. Kurikulumnya sangat up-to-date dengan kebutuhan industri saat ini.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 5. Budi -> Deep Learning AI
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_ai, id_budi, 5, 'Sangat membantu untuk memahami konsep AI yang rumit. Penjelasannya sangat mendalam.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 6. Cindy -> DevOps
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_devops, id_cindy, 5, 'Materi Docker dan Kubernetes-nya terbaik! Sangat aplikatif untuk pekerjaan sehari-hari.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 7. David -> Digital Marketing
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_marketing, id_david, 5, 'Strategi marketing yang diajarkan sangat relevan. Penjualan produk saya naik setelah menerapkan ilmunya.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 8. Eva -> Illustrator
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_illustrator, id_eva, 5, 'Adobe Illustrator jadi terasa mudah. Teknik shadingnya benar-benar pro!', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 9. Fajar -> JavaScript
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_js, id_fajar, 5, 'Dasar-dasar JS dijelaskan sangat detail. Sangat cocok untuk pemula seperti saya.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 10. Gita -> Node.js
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_node, id_gita, 5, 'Backend development jadi jauh lebih asyik. Penjelasan JWT-nya sangat jelas.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 11. Hana -> React Native
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_rn, id_hana, 5, 'Bisa bikin aplikasi iOS & Android sekaligus itu impian banget. Terima kasih MyLearning!', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 12. Indra -> SQL
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_sql, id_indra, 5, 'Query kompleks jadi kerasa gampang kalau sudah paham konsepnya di sini.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 13. Joko -> Startup
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_startup, id_joko, 5, 'Wawasan bisnisnya sangat luas. Membuka pikiran banget buat yang mau bangun startup.', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    -- 14. Kartika -> TypeScript
    INSERT INTO reviews (course_id, user_id, rating, comment, is_approved)
    VALUES (cid_ts, id_kartika, 5, 'TypeScript bikin kerjaan tim jadi lebih solid dan minim error. Wajib dipelajari!', true)
    ON CONFLICT (course_id, user_id) DO NOTHING;

    RAISE NOTICE 'Testimonials synchronized successfully for all 14 courses!';
END $$;

-- 2. AUDIT VIEW (Health Check Tool)
-- This view allows you to verify that stored course stats match actual calculated data.
CREATE OR REPLACE VIEW vw_course_audit AS
SELECT 
    c.title,
    c.slug,
    -- Lessons Count
    c.total_lessons as stored_lessons,
    (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as actual_lessons,
    -- Duration
    c.duration_hours as stored_hours,
    ROUND((SELECT COALESCE(SUM(duration_minutes), 0) FROM lessons l WHERE l.course_id = c.id) / 60.0, 1) as actual_hours,
    -- Students
    c.total_students as stored_students,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND payment_status IN ('paid', 'completed')) as actual_students,
    -- Rating
    c.rating as stored_rating,
    COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews r WHERE r.course_id = c.id AND is_approved = true), 0.0) as actual_rating,
    -- Reviews
    c.total_reviews as stored_reviews,
    (SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id AND is_approved = true) as actual_reviews
FROM courses c;

-- 3. INITIAL COMMAND
-- Recalculate everything once to ensure 100% synchronization of the seed data
DO $$ 
BEGIN
    CALL repair_all_stats();
    RAISE NOTICE 'Engagement seed complete. You can check consistency using: SELECT * FROM vw_course_audit;';
END $$;

