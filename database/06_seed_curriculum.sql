-- ======================================================
-- 06_seed_curriculum.sql
-- MyLearning - Full Curriculum (Lessons & Assessments)
-- ======================================================

DO $$
DECLARE
    -- Course IDs
    c_react UUID; c_python UUID; c_uiux UUID; c_flutter UUID;
    c_dl_ai UUID; c_devops UUID; c_marketing UUID; c_illustrator UUID;
    c_js UUID; c_node UUID; c_rn UUID; c_sql UUID;
    c_startup UUID; c_ts UUID;
BEGIN
    -- 1. GET ALL COURSE IDs
    SELECT id INTO c_react FROM courses WHERE slug = 'mastering-react-nextjs';
    SELECT id INTO c_python FROM courses WHERE slug = 'python-data-science-ml';
    SELECT id INTO c_uiux FROM courses WHERE slug = 'uiux-design-figma';
    SELECT id INTO c_flutter FROM courses WHERE slug = 'flutter-mobile-development';
    SELECT id INTO c_dl_ai FROM courses WHERE slug = 'deep-learning-ai';
    SELECT id INTO c_devops FROM courses WHERE slug = 'devops-for-engineers';
    SELECT id INTO c_marketing FROM courses WHERE slug = 'digital-marketing-mastery';
    SELECT id INTO c_illustrator FROM courses WHERE slug = 'illustrator-pro';
    SELECT id INTO c_js FROM courses WHERE slug = 'javascript-fundamental';
    SELECT id INTO c_node FROM courses WHERE slug = 'nodejs-mastery';
    SELECT id INTO c_rn FROM courses WHERE slug = 'react-native-pro';
    SELECT id INTO c_sql FROM courses WHERE slug = 'sql-mastery';
    SELECT id INTO c_startup FROM courses WHERE slug = 'startup-modern';
    SELECT id INTO c_ts FROM courses WHERE slug = 'typescript-pro';

    -- 2. LESSONS: Mastering React & Next.js
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_react, 'Pengenalan React & Ekosistem', 15, 1, true, 'Mengenal React.js dan mengapa ia sangat populer.'),
    (c_react, 'Setup Development Environment', 20, 2, true, 'Instalasi Node.js, VS Code, dan persiapan project.'),
    (c_react, 'Memahami State & Props secara Mendalam', 25, 3, false, 'Pelajari bagaimana data mengalir di React melalui props.'),
    (c_react, 'Advanced Hooks: UseMemo, UseCallback, & Custom Hooks', 45, 4, false, 'Optimasi performa aplikasi React Anda.'),
    (c_react, 'Management State dengan Context API', 30, 5, false, 'Alternatif Redux untuk mengelola state global.'),
    (c_react, 'Next.js 14 App Router Architecture', 35, 6, true, 'Memahami struktur file, layouts, dan nesting routing.'),
    (c_react, 'Server Components vs Client Components', 28, 7, false, 'Optimasi rendering pada Next.js.'),
    (c_react, 'Data Fetching & Server Actions di Next.js', 40, 8, false, 'Cara modern menangani data dan form submission.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 3. LESSONS: Python for Data Science
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_python, 'Mengapa Data Science?', 12, 1, true, 'Peluang karir dan kegunaan data science di industri.'),
    (c_python, 'Setup Anaconda & Jupyter Notebook', 15, 2, true, 'Persiapan lingkungan kerja data science.'),
    (c_python, 'NumPy Essentials: Array Manipulation', 30, 3, false, 'Dasar-dasar komputasi numerik.'),
    (c_python, 'Pandas 101: Loading & Cleaning Data', 40, 4, false, 'Data manipulation dengan Pandas.'),
    (c_python, 'Data Visualization with Matplotlib & Seaborn', 35, 5, false, 'Seni menyajikan data menjadi informasi visual.'),
    (c_python, 'Introduction to Machine Learning with Scikit-Learn', 50, 6, false, 'Membangun model prediksi pertama Anda.'),
    (c_python, 'Project: Exploratory Data Analysis (EDA)', 60, 7, false, 'Analisis data lengkap dari dataset nyata.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 4. LESSONS: UI/UX Design Masterclass
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_uiux, 'Apa itu UI/UX Design?', 15, 1, true, 'Perbedaan User Interface dan User Experience.'),
    (c_uiux, 'Design Thinking Methodology', 20, 2, true, 'Memahami proses desain berbasis solusi user.'),
    (c_uiux, 'Figma Fundamentals: Frames, Shapes & Layers', 30, 3, true, 'Mengenal workspace dan tools dasar Figma.'),
    (c_uiux, 'Typography and Color Theory in UI', 35, 4, false, 'Memilih font dan palet warna yang profesional.'),
    (c_uiux, 'Auto Layout & Components Mastery', 45, 5, false, 'Membangun desain yang responsif dan reusable.'),
    (c_uiux, 'Interactive Prototyping & Animations', 40, 6, false, 'Membuat mockup desain terasa seperti aplikasi nyata.'),
    (c_uiux, 'Building a Professional Design System', 55, 7, false, 'Standarisasi elemen desain untuk skala besar.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 5. LESSONS: Flutter Mobile Development
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_flutter, 'Pengenalan Flutter & Dart', 18, 1, true, 'Setup Flutter SDK dan instalasi emulator.'),
    (c_flutter, 'Intro to Dart: Syntax & Types', 25, 2, true, 'Mengenal bahasa pemrograman Dart.'),
    (c_flutter, 'Stateless vs Stateful Widgets', 30, 3, false, 'Membangun UI yang statis dan dinamis.'),
    (c_flutter, 'Flutter Layouts: Row, Column, & Stack', 35, 4, false, 'Menyusun elemen UI di layar mobile.'),
    (c_flutter, 'Navigation & Routing di Flutter', 28, 5, false, 'Pindah antar layar dengan Navigator.'),
    (c_flutter, 'Fetching Data from REST API', 45, 6, false, 'Integrasi aplikasi dengan backend via HTTP.'),
    (c_flutter, 'Proyek: Aplikasi To-Do List Simple', 60, 7, false, 'Membangun aplikasi fungsional pertama Anda.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 6. LESSONS: Deep Learning AI
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_dl_ai, 'Intro ke Neural Networks', 20, 1, true, 'Bagaimana komputer meniru cara kerja otak.'),
    (c_dl_ai, 'Mathematics for Deep Learning', 45, 2, false, 'Review Linear Algebra dan Calculus yang dibutuhkan.'),
    (c_dl_ai, 'Building Perceptrons from Scratch', 35, 3, false, 'Memahami algoritma dasar pembelajaran mesin.'),
    (c_dl_ai, 'Convolutional Neural Networks (CNN)', 55, 4, false, 'Deep learning untuk pengenalan gambar.'),
    (c_dl_ai, 'Recurrent Neural Networks (RNN)', 50, 5, false, 'Deep learning untuk data sekuensial dan teks.'),
    (c_dl_ai, 'Optimizing Models: Dropout & Batch Norm', 40, 6, false, 'Teknik mencegah overfitting pada model AI.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 7. LESSONS: DevOps Engineering
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_devops, 'Intro to DevOps Culture', 15, 1, true, 'Apa itu DevOps dan mengapa industri membutuhkannya.'),
    (c_devops, 'Docker 101: Mastering Containers', 45, 2, false, 'Membuat containerize aplikasi secara efisien.'),
    (c_devops, 'Docker Compose for Multi-Container Apps', 35, 3, false, 'Mengelola database dan backend dalam satu script.'),
    (c_devops, 'Kubernetes (K8s) Fundamentals', 60, 4, false, 'Orchestration container skala besar.'),
    (c_devops, 'CI/CD Pipelines dengan GitHub Actions', 50, 5, false, 'Automasi testing dan deployment setiap ada commit.'),
    (c_devops, 'Monitoring Apps dengan Prometheus', 40, 6, false, 'Menjaga kesehatan server dan aplikasi Anda.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 8. LESSONS: Digital Marketing
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_marketing, 'Marketing Funnel Strategy', 25, 1, true, 'Memahami perjalanan pelanggan dari sadar hingga beli.'),
    (c_marketing, 'SEO Essentials for Small Business', 35, 2, false, 'Cara muncul di halaman pertama Google secara organik.'),
    (c_marketing, 'Meta Ads: Facebook & Instagram Marketing', 50, 3, false, 'Menciptakan iklan yang menghasilkan penjualan.'),
    (c_marketing, 'Copywriting yang Menghasilkan Konversi', 30, 4, false, 'Seni merangkai kata untuk memicu aksi audiens.'),
    (c_marketing, 'Email Marketing Automation', 28, 5, false, 'Membangun hubungan dengan database pelanggan.'),
    (c_marketing, 'Analyzing ROI and Performance Data', 32, 6, false, 'Membaca angka untuk menentukan strategi selanjutnya.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 9. LESSONS: Illustrator Pro
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_illustrator, 'Pen Tool Masterclass', 40, 1, true, 'Menguasai alat paling penting di Adobe Illustrator.'),
    (c_illustrator, 'Vector Illustration Principles', 30, 2, false, 'Perbedaan bitmap vs vector dan keguanaannya.'),
    (c_illustrator, 'Creating Professional Logos', 55, 3, false, 'Langkah demi langkah mendesain logo yang ikonik.'),
    (c_illustrator, 'Advanced Shading & Gradients', 45, 4, false, 'Memberikan dimensi pada ilustrasi vector Anda.'),
    (c_illustrator, 'Typographic Layouts for Posters', 35, 5, false, 'Menata teks secara estetis dan mudah dibaca.'),
    (c_illustrator, 'Exporting Assets for Print & Web', 20, 6, false, 'Menyiapkan file akhir yang siap digunakan klien.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 10. LESSONS: JavaScript Fundamental
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_js, 'Variables, Data Types & Operators', 20, 1, true, 'Fondasi bahasa pemrograman JavaScript.'),
    (c_js, 'Logic Control: If Else and Switches', 25, 2, false, 'Mengatur alur jalannya program.'),
    (c_js, 'Looping Through Data: Map, Filter, Reduce', 35, 3, false, 'Memanipulasi array seperti developer pro.'),
    (c_js, 'DOM Manipulation: Interacting with HTML', 40, 4, false, 'Cara membuat website menjadi interaktif.'),
    (c_js, 'Async/Await and API Fetching', 45, 5, false, 'Menangani proses asynchronous dan data eksternal.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 11. LESSONS: Node.js Mastery
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_node, 'Intro to Node.js Runtime', 20, 1, true, 'Menjalankan JavaScript di sisi server.'),
    (c_node, 'Express.js Fundamentals', 30, 2, false, 'Membangun web server pertama Anda.'),
    (c_node, 'Middleware and Request Lifecycle', 25, 3, false, 'Cara memproses request sebelum sampai ke route.'),
    (c_node, 'Authentication dengan JWT', 45, 4, false, 'Mengamankan API dengan token berbasis standar.'),
    (c_node, 'Database Integration with Prisma', 50, 5, false, 'Menghubungkan Node.js dengan SQL secara efisien.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 12. LESSONS: React Native Pro
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_rn, 'Intro to React Native & Expo', 25, 1, true, 'Memulai mobile dev tanpa setup yang rumit.'),
    (c_rn, 'Flexbox for Native Layouts', 30, 2, false, 'Cara menyusun UI yang pas di semua ukuran layar hp.'),
    (c_rn, 'Native Components: ScrollView & FlatList', 35, 3, false, 'Menampilkan daftar data dalam jumlah banyak.'),
    (c_rn, 'React Navigation Native', 40, 4, false, 'Tab navigation dan Stack navigation.'),
    (c_rn, 'Accessing Device Hardware (Camera)', 45, 5, false, 'Menggunakan fitur hp di dalam aplikasi Anda.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 13. LESSONS: SQL & PostgreSQL Mastery
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_sql, 'Relational Database Concepts', 20, 1, true, 'Cara kerja database relasional secara mendalam.'),
    (c_sql, 'SQL Joins Explained (Inner, Left, Right)', 35, 2, false, 'Menggabungkan data dari beberapa tabel.'),
    (c_sql, 'Subqueries & Common Table Expressions', 40, 3, false, 'Menyelesaikan problem data yang kompleks.'),
    (c_sql, 'Indexing for Performance Optimization', 30, 4, false, 'Cara membuat query database 100x lebih cepat.'),
    (c_sql, 'Designing DB Schema: Normalization', 45, 5, false, 'Merancang arsitektur data aplikasi yang baik.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 14. LESSONS: Modern Startup
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_startup, 'The Lean Startup Methodology', 25, 1, true, 'Gagal cepat, belajar cepat dalam membangun bisnis.'),
    (c_startup, 'Validating Your Product Idea', 30, 2, false, 'Cara tahu ide Anda laku atau tidak sebelum build.'),
    (c_startup, 'Building Your First MVP', 40, 3, false, 'Membuat produk minimum yang bisa dipakai pengguna.'),
    (c_startup, 'Product-Market Fit Analysis', 35, 4, false, 'Mencari kecocokan produk dengan kebutuhan pasar.'),
    (c_startup, 'Pitching to Investors for Fundraising', 45, 5, false, 'Seni mempresentasikan bisnis didepan pemodal.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 15. LESSONS: TypeScript Pro
    INSERT INTO lessons (course_id, title, duration_minutes, order_index, is_free_preview, description) VALUES
    (c_ts, 'Why TypeScript? Intro to Types', 15, 1, true, 'Mengapa butuh type safety di JavaScript.'),
    (c_ts, 'Interfaces and Custom Types', 25, 2, false, 'Mendefinisikan bentuk data aplikasi Anda.'),
    (c_ts, 'Generics for Dynamic Components', 40, 3, false, 'Membangun kode yang reusable tapi tetap aman.'),
    (c_ts, 'TypeScript with React and Hooks', 35, 4, false, 'Integrasi TS ke dalam ekosistem React.'),
    (c_ts, 'Configuring tsconfig for Production', 20, 5, false, 'Best practices konfigurasi untuk tim dev.')
    ON CONFLICT (course_id, title) DO NOTHING;

    -- 16. ASSESSMENT DEFINITIONS
    INSERT INTO assessment_definitions (course_id, assessment_type, title, description, passing_score, time_estimate_minutes, order_index, slug, instructions)
    SELECT id, 'final_project', 'Proyek Akhir Kelulusan', 'Kumpulkan proyek mandiri yang menerapkan seluruh materi.', 75, 480, 10, 'final-capstone-' || slug, 'Project wajib orisinil.'
    FROM courses
    ON CONFLICT (course_id, assessment_type, slug) DO NOTHING;

    RAISE NOTICE 'Curriculum seeded for all 14 courses.';
END $$;
