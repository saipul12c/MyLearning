-- SEED DATA FOR PLATFORM EVENTS
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

INSERT INTO platform_events (
  title, 
  slug, 
  short_description, 
  description, 
  thumbnail_url, 
  event_date, 
  location, 
  price, 
  is_published, 
  is_featured
) VALUES 
(
  'Mastering Next.js 16 & Supabase', 
  'mastering-nextjs-16-supabase', 
  'Pelajari cara membangun aplikasi modern dengan Next.js 16 (App Router) dan Supabase.', 
  'Di webinar ini, kita akan membahas: \n1. Server Components vs Client Components\n2. Realtime Database dengan Supabase\n3. Edge Functions & Storage\n4. Praktik Terbaik Security dengan RLS.', 
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop', 
  NOW() + INTERVAL '7 days', 
  'Zoom Meeting', 
  0, 
  true, 
  true
),
(
  'UI/UX Design Masterclass', 
  'uiux-design-masterclass', 
  'Workshop intensif desain UI/UX dari wireframing hingga high-fidelity prototype.', 
  'Workshop ini fokus pada:\n- Design Thinking Process\n- Auto Layout & Components in Figma\n- Prototyping & Animation\n- User Testing & Feedback Loop.', 
  'https://images.unsplash.com/photo-1561070791-2a6288339c19?q=80&w=2070&auto=format&fit=crop', 
  NOW() + INTERVAL '14 days', 
  'Google Meet', 
  0, 
  true, 
  true
),
(
  'Strategi Menembus Perusahaan Tech Global', 
  'tech-career-talk', 
  'Talkshow bersama alumni MyLearning yang kini bekerja di Google dan Amazon.', 
  'Dapatkan tips mengenai:\n- Cara membuat CV ATS-friendly\n- Menjawab pertanyaan behavioral interview\n- Menyiapkan portfolio yang menjual\n- Networking strategy.', 
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop', 
  NOW() + INTERVAL '21 days', 
  'YouTube Live', 
  0, 
  true, 
  false
),
(
  '24 Hours Coding Challenge: Build a SaaS', 
  'coding-challenge-saas', 
  'Tantangan 24 jam membangun Resume Builder SaaS dari nol.', 
  'Peraturan:\n- Gunakan stack bebas (Rekomendasi: Next.js)\n- Wajib menggunakan Database\n- Penilaian berdasarkan: Design, Fitur, dan Clean Code.', 
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop', 
  NOW() + INTERVAL '30 days', 
  'Discord Platform', 
  0, 
  true,
  true
),
(
  'Bug Hunter Program: MyLearning', 
  'bug-hunter-mylearning', 
  'Temukan bug / celah keamanan di platform MyLearning dan dapatkan 3 course gratis bebas pilih!', 
  'Event kompetisi Bug Bounty terbuka untuk siapapun. \nSyarat & Ketentuan:\n1. Laporkan bug/celah keamanan yang valid (XSS, SQLi, Logic Bypass, dll).\n2. Wajib menyertakan bukti berupa screenshot/video langkah reproduksi.\n3. Jika valid, admin akan menghubungi via platform ini dengan voucher 3 course gratis.\n4. Bukti/Submission harap diunggah melalui formulir di dasbor peserta.', 
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop', 
  NOW() + INTERVAL '90 days', 
  'Online / Submission', 
  0, 
  true, 
  true
),
(
  'Siber Sekuriti Masterclass 2026', 
  'cyber-security-masterclass', 
  'Mengeksplorasi ancaman keamanan siber era modern dan cara mitigasinya.', 
  'Dapatkan insight dari ahli keamanan jaringan terkemuka. Materi mencakup:\n- OSINT & Reconnaissance\n- Web Application Firewall\n- Menghadapi ancaman AI-driven botnets\nSertifikat kehadiran tersedia bagi partisipan aktif.', 
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop', 
  NOW() + INTERVAL '45 days', 
  'Zoom Webinar', 
  50000, 
  true, 
  false
),
(
  'Web Penetration Testing Workshop', 
  'web-pentest-workshop', 
  'Hands-on praktikal simulasi serangan web dan peretasan secara etis (Ethical Hacking).', 
  'Peserta wajib membawa laptop sendiri. Alat yang akan digunakan:\n- Burp Suite\n- Nmap\n- Metasploit\nAcara ini bersifat berbayar. Harap unggah bukti pembayaran setelah mendaftar di profil event Anda.', 
  'https://images.unsplash.com/photo-1510511459019-5efa37024817?q=80&w=2070&auto=format&fit=crop', 
  NOW() + INTERVAL '60 days', 
  'Gedung Cyber, Jakarta', 
  150000, 
  true, 
  true
);
