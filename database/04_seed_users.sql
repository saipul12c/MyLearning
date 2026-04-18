-- ======================================================
-- MIGRASI DATA USER & INSTRUKTUR (v4)
-- Jalankan script ini di SQL Editor Supabase Anda
-- ======================================================

-- 1. Tambahkan Fungsi Helper untuk membuat User Auth (Jika belum ada)
-- Ini memungkinkan pembuatan user dari SQL Editor secara aman
-- 1. Tambahkan Fungsi Helper untuk membuat User Auth (Jika belum ada)
-- Ini memungkinkan pembuatan user dari SQL Editor secara aman
CREATE OR REPLACE FUNCTION create_seed_user(
    email TEXT,
    password TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    avatar_url TEXT DEFAULT NULL
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
            jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', role),
            jsonb_build_object('full_name', full_name, 'avatar_url', avatar_url),
            NOW(), NOW(), '', '', '', ''
        )
        RETURNING id INTO new_user_id;
    END IF;

    -- 3. Masukkan ke public.user_profiles
    -- Penggunaan ON CONFLICT sangat penting karena trigger 'on_auth_user_created' 
    -- mungkin sudah membuat profil default 'user' saat insert ke auth.users di atas.
    INSERT INTO public.user_profiles (user_id, full_name, role, email, avatar_url)
    VALUES (new_user_id, full_name, role, email, avatar_url)
    ON CONFLICT (user_id) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SEED DATA (Admin & Instruktur dengan Metadata Lengkap)
DO $$
DECLARE
    uid_admin UUID;
    uid_sari UUID;
    uid_budi UUID;
    uid_ahmad UUID;
    uid_rina UUID;
BEGIN
    -- Buat Admin Utama
    uid_admin := create_seed_user('admin@mylearning.id', 'admin123', 'Administrator', 'admin', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200');

    -- Buat Instruktur - Sari Dewi
    uid_sari := create_seed_user('sari.dewi@mylearning.id', 'instructor123', 'Sari Dewi', 'instructor', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, avatar_url, qris_url)
    VALUES (uid_sari, 'Sari Dewi', 'sari-dewi', 'Pakar Data Science dengan pengalaman lebih dari 10 tahun.', 'Data Scientist & ML Engineer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SariDewi-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        avatar_url = EXCLUDED.avatar_url,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- Buat Instruktur - Budi Santoso
    uid_budi := create_seed_user('budi.santoso@mylearning.id', 'instructor123', 'Budi Santoso', 'instructor', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, avatar_url, qris_url)
    VALUES (uid_budi, 'Budi Santoso', 'budi-santoso', 'Senior Product Designer spesialis UI/UX.', 'UI/UX & Product Design Specialist', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BudiSantoso-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        avatar_url = EXCLUDED.avatar_url,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- Buat Instruktur - Ahmad Rizki
    uid_ahmad := create_seed_user('ahmad.rizki@mylearning.id', 'instructor123', 'Ahmad Rizki', 'instructor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, avatar_url, qris_url)
    VALUES (uid_ahmad, 'Ahmad Rizki', 'ahmad-rizki', 'Full Stack Developer dengan gairah untuk mengajar.', 'Full-Stack Web Developer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=AhmadRizki-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        avatar_url = EXCLUDED.avatar_url,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- Buat Instruktur - Rina Permata
    uid_rina := create_seed_user('rina.permata@mylearning.id', 'instructor123', 'Rina Permata', 'instructor', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200');
    INSERT INTO public.instructors (user_id, name, slug, bio, expertise, avatar_url, qris_url)
    VALUES (uid_rina, 'Rina Permata', 'rina-permata', 'Mobile Engineer yang jatuh cinta dengan Flutter.', 'Senior Mobile Engineer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RinaPermata-MyLearning')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        expertise = EXCLUDED.expertise,
        avatar_url = EXCLUDED.avatar_url,
        qris_url = EXCLUDED.qris_url,
        updated_at = NOW();

    -- 3. GHOST USERS (Untuk Testimoni & Demo Pengguna)
    PERFORM create_seed_user('dimas.testimoni@mylearning.id', 'student123', 'Dimas Pratama', 'user', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('anisa.putri@mylearning.id', 'student123', 'Anisa Putri', 'user', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('raka.mahendra@mylearning.id', 'student123', 'Raka Mahendra', 'user', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('siti.aminah@mylearning.id', 'student123', 'Siti Aminah', 'user', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('budi.test@mylearning.id', 'student123', 'Budi Cahyono', 'user', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('cindy.test@mylearning.id', 'student123', 'Cindy Lestari', 'user', 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('david.test@mylearning.id', 'student123', 'David Wijaya', 'user', 'https://images.unsplash.com/photo-150425740623f-125c896bd97b?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('eva.test@mylearning.id', 'student123', 'Eva Maria', 'user', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('fajar.test@mylearning.id', 'student123', 'Fajar Ramadhan', 'user', 'https://images.unsplash.com/photo-1542343633-ce3256f2183e?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('gita.test@mylearning.id', 'student123', 'Gita Permatasari', 'user', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('hana.test@mylearning.id', 'student123', 'Hana Syarifah', 'user', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('indra.test@mylearning.id', 'student123', 'Indra Kusuma', 'user', 'https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('joko.test@mylearning.id', 'student123', 'Joko Susanto', 'user', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200&h=200');
    PERFORM create_seed_user('kartika.test@mylearning.id', 'student123', 'Kartika Sari', 'user', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200&h=200');

END $$;
