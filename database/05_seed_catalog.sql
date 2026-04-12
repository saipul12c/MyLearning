-- ======================================================
-- 05_seed_catalog.sql
-- MyLearning - Full Course Catalog (14 Courses)
-- ======================================================

-- 1. CATEGORIES
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Pemrograman',  'pemrograman',  'Kursus pemrograman web, backend, dan software development', '💻', 1),
  ('Data Science', 'data-science', 'Kursus data analysis, machine learning, dan AI', '📊', 2),
  ('Desain',       'desain',       'Kursus UI/UX design, graphic design, dan visual arts', '🎨', 3),
  ('Bisnis',       'bisnis',       'Kursus entrepreneurship, marketing, dan business strategy', '💼', 4),
  ('Mobile Dev',   'mobile-dev',   'Kursus pengembangan aplikasi mobile iOS dan Android', '📱', 5),
  ('DevOps',       'devops',       'Kursus containerization, CI/CD, dan cloud infrastructure', '⚙️', 6)
ON CONFLICT (slug) DO NOTHING;

-- 2. COURSES
DO $$
DECLARE
    -- Categories
    cat_pemrograman UUID;
    cat_data_science UUID;
    cat_desain UUID;
    cat_bisnis UUID;
    cat_mobile UUID;
    cat_devops UUID;
    -- Instructors
    inst_ahmad UUID;
    inst_sari UUID;
    inst_budi UUID;
    inst_rina UUID;
BEGIN
    -- GET CATEGORY IDs
    SELECT id INTO cat_pemrograman FROM categories WHERE slug = 'pemrograman';
    SELECT id INTO cat_data_science FROM categories WHERE slug = 'data-science';
    SELECT id INTO cat_desain FROM categories WHERE slug = 'desain';
    SELECT id INTO cat_bisnis FROM categories WHERE slug = 'bisnis';
    SELECT id INTO cat_mobile FROM categories WHERE slug = 'mobile-dev';
    SELECT id INTO cat_devops FROM categories WHERE slug = 'devops';

    -- GET INSTRUCTOR IDs
    SELECT id INTO inst_ahmad FROM instructors WHERE slug = 'ahmad-rizki';
    SELECT id INTO inst_sari FROM instructors WHERE slug = 'sari-dewi';
    SELECT id INTO inst_budi FROM instructors WHERE slug = 'budi-santoso';
    SELECT id INTO inst_rina FROM instructors WHERE slug = 'rina-permata';

    -- ========== INITIAL 4 COURSES ==========

    -- 1. React & Next.js
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Mastering React & Next.js - Full Stack Development',
        'mastering-react-nextjs',
        'Pelajari React dan Next.js dari dasar hingga mahir. Bangun aplikasi web modern dengan server-side rendering, API routes, dan deployment ke production.',
        'Kuasai React & Next.js untuk membangun aplikasi web modern full-stack.',
        499000, 249000, cat_pemrograman, inst_ahmad,
        'Accelerator', 'Bahasa Indonesia', true, true,
        '["Memahami React dari fundamental hingga advanced patterns", "Membangun aplikasi full-stack dengan Next.js App Router"]'::jsonb,
        '["Dasar HTML, CSS, dan JavaScript"]'::jsonb,
        ARRAY['react', 'nextjs', 'javascript', 'fullstack']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 2. Python Data Science
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Python untuk Data Science & Machine Learning',
        'python-data-science-ml',
        'Kuasai Python untuk analisis data dan machine learning. Mulai dari Pandas, NumPy, hingga scikit-learn dan TensorFlow.',
        'Pelajari Python untuk data analysis dan machine learning dari nol.',
        599000, 299000, cat_data_science, inst_sari,
        'Starter', 'Bahasa Indonesia', true, true,
        '["Fundamental Python programming", "Data manipulation dengan Pandas dan NumPy"]'::jsonb,
        '["Tidak perlu pengalaman programming sebelumnya"]'::jsonb,
        ARRAY['python', 'data-science', 'machine-learning']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 3. UI/UX Design
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'UI/UX Design Masterclass - Figma dari Nol',
        'uiux-design-figma',
        'Pelajari prinsip desain UI/UX dan kuasai Figma dari nol. Buat wireframe, prototype interaktif, dan design system profesional.',
        'Kuasai UI/UX Design dan Figma dari dasar hingga mahir.',
        399000, 199000, cat_desain, inst_budi,
        'Starter', 'Bahasa Indonesia', true, true,
        '["Prinsip-prinsip desain UI/UX", "Menguasai Figma dari dasar hingga mahir"]'::jsonb,
        '["Akun Figma gratis"]'::jsonb,
        ARRAY['uiux', 'figma', 'design']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 4. Flutter Mobile
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Flutter Mobile App Development',
        'flutter-mobile-development',
        'Bangun aplikasi mobile cross-platform dengan Flutter dan Dart. Dari UI widget hingga integrasi API dan state management.',
        'Buat aplikasi mobile iOS & Android dengan Flutter.',
        449000, 224000, cat_mobile, inst_rina,
        'Accelerator', 'Bahasa Indonesia', true, true,
        '["Dart programming language dari dasar", "Flutter widget system"]'::jsonb,
        '["Dasar programming (bahasa apapun)"]'::jsonb,
        ARRAY['flutter', 'dart', 'mobile']
    ) ON CONFLICT (slug) DO NOTHING;

    -- ========== ADDITIONAL 10 COURSES (MEGA SEED) ==========

    -- 1. Deep Learning AI
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Deep Learning AI - Architecting Neural Networks',
        'deep-learning-ai',
        'Pelajari arsitektur neural networks modern mulai dari CNN, RNN, hingga Transformer dan GAN. Implementasikan menggunakan TensorFlow dan PyTorch.',
        'Kuasai Deep Learning untuk membangun teknologi AI masa depan.',
        899000, 649000, cat_data_science, inst_sari,
        'Mastery', 'Bahasa Indonesia', true, true,
        '["Membangun Neural Networks dari nol", "Implementasi CNN untuk Image Recognition"]'::jsonb,
        '["Dasar Python dan Pemahaman Matematika Dasar"]'::jsonb,
        ARRAY['ai', 'deep-learning', 'tensorflow']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 2. DevOps for Engineers
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'DevOps Engineering - Jenkins, Docker & K8s',
        'devops-for-engineers',
        'Kuasai pipeline CICD, containerization dengan Docker, dan orchestration dengan Kubernetes. Automasi infrastruktur Anda secara profesional.',
        'Pelajari tool DevOps modern untuk efisiensi deployment.',
        799000, 549000, cat_devops, inst_ahmad,
        'Accelerator', 'Bahasa Indonesia', true, true,
        '["Membangun Pipeline CI/CD otomatis", "Manajemen Container dengan Kubernetes"]'::jsonb,
        '["Dasar Linux Administration"]'::jsonb,
        ARRAY['devops', 'docker', 'kubernetes', 'jenkins']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 3. Digital Marketing Mastery
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Digital Marketing Mastery - Strategy & Analytics',
        'digital-marketing-mastery',
        'Pelajari SEO, SEM, Social Media Marketing, dan Meta Ads. Pahami cara riset audience dan optimasi funnel penjualan Anda.',
        'Strategi pemasaran digital lengkap untuk menumbuhkan bisnis.',
        499000, 249000, cat_bisnis, inst_budi,
        'Starter', 'Bahasa Indonesia', true, true,
        '["Riset Target Audience secara mendalam", "Optimasi Meta Ads dan Google Ads"]'::jsonb,
        '["Memiliki bisnis atau produk untuk dipasarkan"]'::jsonb,
        ARRAY['marketing', 'digital-marketing', 'seo', 'ads']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 4. Illustrator Pro
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Illustrator Pro - Digital Illustration Masterclass',
        'illustrator-pro',
        'Kuasai pembuatan logo, ilustrasi vector, dan branding menggunakan Adobe Illustrator. Belajar teknik shading dan tipografi kelas dunia.',
        'Jadilah desainer vector profesional dengan Adobe Illustrator.',
        599000, 399000, cat_desain, inst_budi,
        'Accelerator', 'Bahasa Indonesia', true, true,
        '["Teknik menggambar vector yang efisien", "Pewarnaan dan shading digital"]'::jsonb,
        '["Adobe Illustrator CC (Free Trial sudah cukup)"]'::jsonb,
        ARRAY['illustration', 'vector', 'design', 'adobe']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 5. JavaScript Fundamental
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'JavaScript Fundamental - Dasar Pemrograman Web',
        'javascript-fundamental',
        'Pelajari bahasa paling populer di dunia dari nol. Pahami Variables, DOM Manipulation, Async/Await, dan ES6+ Features.',
        'Pondasi kuat untuk menjadi Web Developer profesional.',
        399000, 199000, cat_pemrograman, inst_ahmad,
        'Starter', 'Bahasa Indonesia', true, true,
        '["Logika pemrograman dasar hingga intermediate", "Memahami Asynchronous JavaScript"]'::jsonb,
        '["Sudah mengerti HTML & CSS dasar"]'::jsonb,
        ARRAY['javascript', 'web-dev', 'fundamentals']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 6. Node.js Mastery
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Node.js Mastery - Backend Development with Express',
        'nodejs-mastery',
        'Bangun API yang scalable menggunakan Node.js dan Express. Pelajari Authentication, Database Integration, dan Security Best Practices.',
        'Kuasai backend development dengan ekosistem Node.js.',
        649000, 399000, cat_pemrograman, inst_ahmad,
        'Mastery', 'Bahasa Indonesia', true, true,
        '["Membangun RESTful API dengan Express", "Otentikasi dengan JWT"]'::jsonb,
        '["Paham JavaScript (ES6+)", "Dasar Database"]'::jsonb,
        ARRAY['nodejs', 'express', 'backend', 'backend-dev']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 7. React Native Pro
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'React Native Pro - Build Native Mobile Apps',
        'react-native-pro',
        'Gunakan skill React Anda untuk membangun aplikasi mobile iOS & Android yang berperforma tinggi. Satu codebase untuk semua platform.',
        'Bangun aplikasi mobile native dengan skill React Anda.',
        699000, 449000, cat_mobile, inst_rina,
        'Accelerator', 'Bahasa Indonesia', true, true,
        '["Custom UI Components di React Native", "Akses Hardware API (Kamera, GPS)"]'::jsonb,
        '["Sangat paham React Dasar"]'::jsonb,
        ARRAY['react-native', 'mobile', 'ios', 'android']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 8. SQL Mastery
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'SQL & PostgreSQL Mastery - Database Design',
        'sql-mastery',
        'Pelajari cara menulis query yang kompleks, optimasi index, dan perancangan skema database yang efisien menggunakan PostgreSQL.',
        'Kuasai pengolahan data dengan SQL dan PostgreSQL.',
        499000, 249000, cat_pemrograman, inst_sari,
        'Starter', 'Bahasa Indonesia', true, true,
        '["Menulis Joins, Subqueries dan CTE", "Optimasi Query Performance"]'::jsonb,
        '["Sudah terbiasa operasikan PC/Laptop"]'::jsonb,
        ARRAY['sql', 'postgresql', 'database', 'data']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 9. Startup Modern
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'Modern Startup - Building Scalable Products',
        'startup-modern',
        'Pelajari metodologi Lean Startup, MVP, Product-Market Fit, hingga strategi fundraising untuk membangun perusahaan teknologi.',
        'Bangun produk startup yang dicintai pengguna dan scalable.',
        599000, 349000, cat_bisnis, inst_budi,
        'Accelerator', 'Bahasa Indonesia', true, true,
        '["Memvalidasi ide produk dengan MVP", "Mendapatkan Product-Market Fit"]'::jsonb,
        '["Memiliki minat di dunia entrepreneurship"]'::jsonb,
        ARRAY['startup', 'business', 'entrepreneurship', 'product']
    ) ON CONFLICT (slug) DO NOTHING;

    -- 10. TypeScript Pro
    INSERT INTO courses (title, slug, description, short_description, price, discount_price, category_id, instructor_id, level, language, is_published, is_featured, learning_points, requirements, tags)
    VALUES (
        'TypeScript Pro - Strict Typing for Scalable Apps',
        'typescript-pro',
        'Tingkatkan kualitas kode JavaScript Anda dengan TypeScript. Pelajari Generics, Decorators, dan Arsitektur berskala besar.',
        'Tulis kode yang lebih aman dan mudah di-maintain dengan TypeScript.',
        549000, 399000, cat_pemrograman, inst_ahmad,
        'Accelerator', 'Bahasa Indonesia', true, true,
        '["Advanced Types and Interfaces", "Migrasi dari JS ke TS secara bertahap"]'::jsonb,
        '["Pemahaman JavaScript yang solid"]'::jsonb,
        ARRAY['typescript', 'javascript', 'backend', 'clean-code']
    ) ON CONFLICT (slug) DO NOTHING;

    RAISE NOTICE 'Catalog Seed Berhasil! Total 14 Kursus tersedia.';
END $$;
