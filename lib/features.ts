import { supabase } from "./supabase";

export interface FeatureDefinition {
    key: string;
    name: string;
    description: string;
    category: 'free' | 'paid' | 'special';
    tier_required?: string; // slug of the tier required, or 'free'
    icon_name: string;
}

export const FEATURES_MANIFEST: FeatureDefinition[] = [
    // FREE PACK (Starter)
    { key: 'feature_smart_dashboard', name: 'Smart Dashboard', description: 'Ringkasan progres belajar dan statistik harian visual.', category: 'free', icon_name: 'LayoutDashboard' },
    { key: 'feature_public_discussion', name: 'Public Discussion', description: 'Forum komunitas untuk berdiskusi materi pelajaran.', category: 'free', icon_name: 'MessageCircle' },
    { key: 'feature_learning_streaks', name: 'Daily Streaks', description: 'Gamifikasi untuk melacak konsistensi belajar harian.', category: 'free', icon_name: 'Activity' },
    { key: 'feature_search_pro', name: 'Content Search Pro', description: 'Pencarian materi tingkat lanjut dengan filter cerdas.', category: 'free', icon_name: 'Search' },
    { key: 'feature_activity_feed', name: 'Activity Feed', description: 'Notifikasi real-time tentang materi dan event baru.', category: 'free', icon_name: 'Zap' },
    { key: 'feature_profile_portfolio', name: 'Profile Portfolio', description: 'Halaman profil publik untuk pamer lencana dan skill.', category: 'free', icon_name: 'UserCircle' },
    { key: 'feature_daily_quests', name: 'Daily Quests', description: 'Tugas mikro harian untuk mendapatkan bonus XP.', category: 'free', icon_name: 'Trophy' },
    { key: 'feature_multi_device', name: 'Multi-device Sync', description: 'Belajar di web atau mobile tanpa kehilangan progres.', category: 'free', icon_name: 'Tablet' },
    { key: 'feature_flashcards', name: 'Flashcards System', description: 'Alat bantu menghafal konsep penting secara mandiri.', category: 'free', icon_name: 'Bookmark' },
    { key: 'feature_public_events', name: 'Public Events', description: 'Akses ke webinar publik dan tantangan komunitas.', category: 'free', icon_name: 'Globe' },

    // PAID PACK (Premium)
    { key: 'certificate_generation', name: 'Verified Certificates', description: 'Sertifikat resmi blockchain yang dapat divalidasi.', category: 'paid', tier_required: 'bronze', icon_name: 'Award' },
    { key: 'feature_ad_free', name: 'Ad-Free Experience', description: 'Fokus belajar tanpa gangguan iklan atau promosi.', category: 'paid', tier_required: 'bronze', icon_name: 'ShieldCheck' },
    { key: 'feature_offline_vault', name: 'Offline Vault', description: 'Download materi untuk dipelajari tanpa internet.', category: 'paid', tier_required: 'silver', icon_name: 'Download' },
    { key: 'feature_live_qa', name: 'Live Q&A Sessions', description: 'Sesi tanya jawab eksklusif bersama instruktur ahli.', category: 'paid', tier_required: 'silver', icon_name: 'Video' },
    { key: 'feature_mentorship_sessions', name: 'Mentorship Access', description: 'Konsultasi langsung via chat atau video call.', category: 'paid', tier_required: 'gold', icon_name: 'UserPlus' },
    { key: 'feature_detailed_feedback', name: 'Detailed Feedback', description: 'Penjelasan mendalam untuk setiap jawaban kuis.', category: 'paid', tier_required: 'bronze', icon_name: 'HelpCircle' },
    { key: 'feature_premium_resources', name: 'Premium Resource', description: 'Akses ke template, e-book, dan aset eksklusif.', category: 'paid', tier_required: 'silver', icon_name: 'FileText' },
    { key: 'feature_group_masterminds', name: 'Group Masterminds', description: 'Grup belajar privat dengan moderator khusus.', category: 'paid', tier_required: 'gold', icon_name: 'Users2' },
    { key: 'feature_resume_builder_ai', name: 'Resume Builder AI', description: 'Ekspor pencapaian belajar langsung ke CV profesional.', category: 'paid', tier_required: 'silver', icon_name: 'FileUser' },
    { key: 'feature_priority_roadmap', name: 'Priority Roadmap', description: 'Berikan suara untuk menentukan kursus selanjutnya.', category: 'paid', tier_required: 'bronze', icon_name: 'Route' },

    // SPECIAL PACK (Elite AI)
    { key: 'feature_ai_learning_path', name: 'AI Learning Path', description: 'Kurikulum adaptif berdasarkan performa belajar Anda.', category: 'special', tier_required: 'platinum', icon_name: 'Sparkles' },
    { key: 'feature_sandbox_playground', name: 'Live Code Playground', description: 'Editor kode interaktif langsung di dalam browser.', category: 'special', tier_required: 'diamond', icon_name: 'Code2' },
    { key: 'feature_job_matching_ai', name: 'Job Matching AI', description: 'Hubungkan skill Anda langsung dengan rekruter top.', category: 'special', tier_required: 'emerald', icon_name: 'Briefcase' },
    { key: 'feature_project_sandbox', name: 'Project Sandbox', description: 'Lingkungan cloud aman untuk uji coba proyek nyata.', category: 'special', tier_required: 'platinum', icon_name: 'Box' },
    { key: 'feature_ar_visualizer', name: 'Interactive 3D/AR', description: 'Visualisasi konsep sulit dengan model 3D/AR.', category: 'special', tier_required: 'mastermind', icon_name: 'Layers' },
    { key: 'feature_skill_radar', name: 'Skill Fingerprinting', description: 'Analisis radar chart kekuatan skill secara mendalam.', category: 'special', tier_required: 'platinum', icon_name: 'Radar' },
    { key: 'feature_peer_review', name: 'Peer Review Credits', description: 'Dapatkan reward dengan mengulas tugas siswa lain.', category: 'special', tier_required: 'diamond', icon_name: 'RefreshCw' },
    { key: 'feature_dynamic_dark_mode', name: 'Dynamic Dark Mode', description: 'UI yang menyesuaikan kesehatan mata secara otomatis.', category: 'special', tier_required: 'platinum', icon_name: 'Moon' },
    { key: 'feature_global_leaderboard', name: 'Global Leaderboard', description: 'Kompetisi berhadiah fisik setiap bulan untuk top user.', category: 'special', tier_required: 'diamond', icon_name: 'Trophy' },
    { key: 'feature_sentinel_protection', name: 'Sentinel Protection', description: 'Keamanan akun tingkat tinggi dengan MFA hardware.', category: 'special', tier_required: 'platinum', icon_name: 'Lock' }
];

export async function checkFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
    const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role, tier:tiers(slug)")
        .eq("user_id", userId)
        .single();

    if (error || !profile) return false;
    if (profile.role === 'admin' || profile.role === 'instructor') return true;

    const feature = FEATURES_MANIFEST.find(f => f.key === featureKey);
    if (!feature) return false;
    if (feature.category === 'free') return true;

    const userTierSlug = (profile.tier as any)?.slug || 'free';
    const tierOrder = ['free', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald', 'ruby', 'sapphire', 'mastermind', 'legendary'];
    const userTierIndex = tierOrder.indexOf(userTierSlug);
    const requiredTierIndex = tierOrder.indexOf(feature.tier_required || 'free');

    return userTierIndex >= requiredTierIndex;
}
