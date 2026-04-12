-- ======================================================
-- MIGRASI DATA USER & INSTRUKTUR (v4)
-- Jalankan script ini di SQL Editor Supabase Anda
-- ======================================================

-- 1. Tambahkan Fungsi Helper untuk membuat User Auth (Jika belum ada)
-- Ini memungkinkan pembuatan user dari SQL Editor secara aman
CREATE OR REPLACE FUNCTION create_seed_user(
    email TEXT,
    password TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user'
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- 1. Check if user already exists to make script re-runnable
    SELECT id INTO new_user_id FROM auth.users WHERE auth.users.email = create_seed_user.email;

    IF new_user_id IS NULL THEN
        -- 2. Masukkan ke auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, recovery_sent_at, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
            'authenticated', 'authenticated', email, crypt(password, gen_salt('bf')),
            NOW(), NOW(), NOW(),
            '{"provider":"email","providers":["email"]}',
            format('{"full_name":"%s"}', full_name)::jsonb,
            NOW(), NOW(), '', '', '', ''
        )
        RETURNING id INTO new_user_id;
    END IF;

    -- 3. Masukkan ke public.user_profiles
    -- Penggunaan ON CONFLICT sangat penting karena trigger 'on_auth_user_created' 
    -- mungkin sudah membuat profil default 'user' saat insert ke auth.users di atas.
    INSERT INTO public.user_profiles (user_id, full_name, role)
    VALUES (new_user_id, full_name, role)
    ON CONFLICT (user_id) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SEED DATA (Admin & Instruktur dari LocalStorage)
DO $$
DECLARE
    uid_admin UUID;
    uid_sari UUID;
    uid_budi UUID;
    uid_ahmad UUID;
    uid_rina UUID;
BEGIN
    -- Buat Admin Utama
    uid_admin := create_seed_user('admin@mylearning.id', 'admin123', 'Administrator', 'admin');

    -- Buat Instruktur - Sari Dewi
    uid_sari := create_seed_user('sari.dewi@mylearning.id', 'instructor123', 'Sari Dewi', 'instructor');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, qris_url)
    VALUES (uid_sari, 'Sari Dewi', 'sari-dewi', 'Pakar Data Science dengan pengalaman lebih dari 10 tahun.', 'Data Scientist & ML Engineer', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SariDewi-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- Buat Instruktur - Budi Santoso
    uid_budi := create_seed_user('budi.santoso@mylearning.id', 'instructor123', 'Budi Santoso', 'instructor');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, qris_url)
    VALUES (uid_budi, 'Budi Santoso', 'budi-santoso', 'Senior Product Designer spesialis UI/UX.', 'UI/UX & Product Design Specialist', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BudiSantoso-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- Buat Instruktur - Ahmad Rizki
    uid_ahmad := create_seed_user('ahmad.rizki@mylearning.id', 'instructor123', 'Ahmad Rizki', 'instructor');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, qris_url)
    VALUES (uid_ahmad, 'Ahmad Rizki', 'ahmad-rizki', 'Full Stack Developer dengan gairah untuk mengajar.', 'Full-Stack Web Developer', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=AhmadRizki-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- Buat Instruktur - Rina Permata
    uid_rina := create_seed_user('rina.permata@mylearning.id', 'instructor123', 'Rina Permata', 'instructor');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, qris_url)
    VALUES (uid_rina, 'Rina Permata', 'rina-permata', 'Mobile Engineer yang jatuh cinta dengan Flutter.', 'Senior Mobile Engineer', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RinaPermata-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- 3. GHOST USERS (Untuk Testimoni)
    PERFORM create_seed_user('dimas.testimoni@mylearning.id', 'student123', 'Dimas Pratama', 'user');
    PERFORM create_seed_user('anisa.putri@mylearning.id', 'student123', 'Anisa Putri', 'user');
    PERFORM create_seed_user('raka.mahendra@mylearning.id', 'student123', 'Raka Mahendra', 'user');
    PERFORM create_seed_user('siti.aminah@mylearning.id', 'student123', 'Siti Aminah', 'user');
    PERFORM create_seed_user('budi.test@mylearning.id', 'student123', 'Budi Cahyono', 'user');
    PERFORM create_seed_user('cindy.test@mylearning.id', 'student123', 'Cindy Lestari', 'user');
    PERFORM create_seed_user('david.test@mylearning.id', 'student123', 'David Wijaya', 'user');
    PERFORM create_seed_user('eva.test@mylearning.id', 'student123', 'Eva Maria', 'user');
    PERFORM create_seed_user('fajar.test@mylearning.id', 'student123', 'Fajar Ramadhan', 'user');
    PERFORM create_seed_user('gita.test@mylearning.id', 'student123', 'Gita Permatasari', 'user');
    PERFORM create_seed_user('hana.test@mylearning.id', 'student123', 'Hana Syarifah', 'user');
    PERFORM create_seed_user('indra.test@mylearning.id', 'student123', 'Indra Kusuma', 'user');
    PERFORM create_seed_user('joko.test@mylearning.id', 'student123', 'Joko Susanto', 'user');
    PERFORM create_seed_user('kartika.test@mylearning.id', 'student123', 'Kartika Sari', 'user');

END $$;
