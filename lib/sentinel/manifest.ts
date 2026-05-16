/**
 * Sentinel System Manifest
 * 
 * DEVELOPERS: Update this file whenever you add new features, 
 * change database schemas, or deploy major updates.
 * Sentinel will automatically detect these changes and prompt the Admin.
 */

export interface FeatureManifest {
  key: string;
  category: 'system' | 'security' | 'feature' | 'general';
  description: string;
  proposedValue: any;
  isPublic: boolean;
  impact: 'low' | 'medium' | 'high' | 'critical';
  devNotes?: string;
  dependencies?: string[];
  errorThreshold?: number;
  allowedCountries?: string[];
  rateLimitOverrides?: Record<string, number>;
  expireAt?: string;
  broadcastOnDisable?: boolean;
  broadcastMessage?: string;
}

export const SYSTEM_MANIFEST = {
  version: "1.1.0", // Added 30 User Features Universe
  lastUpdated: "2026-05-13",

  // Define all features that SHOULD exist in the system
  features: [
    {
      key: 'maintenance_mode',
      category: 'system',
      description: 'Aktifkan mode pemeliharaan untuk seluruh platform.',
      proposedValue: false,
      isPublic: true,
      impact: 'high',
      devNotes: 'Sudah diintegrasikan dengan SentinelGuard di RootLayout.'
    },
    {
      key: 'module_auth_enabled',
      category: 'security',
      description: 'Kontrol akses login dan registrasi.',
      proposedValue: true,
      isPublic: true,
      impact: 'critical',
      devNotes: 'Mempengaruhi seluruh alur autentikasi.'
    },
    {
      key: 'module_payment_enabled',
      category: 'security',
      description: 'Kontrol sistem transaksi dan pembayaran.',
      proposedValue: true,
      isPublic: true,
      impact: 'high',
      devNotes: 'Digunakan untuk maintenance gateway pembayaran.'
    },
    {
      key: 'module_upload_enabled',
      category: 'security',
      description: 'Kontrol fitur upload file ke storage.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium',
      devNotes: 'Mencegah upload file saat storage penuh atau serangan.'
    },
    {
      key: 'module_tiers_enabled',
      category: 'feature',
      description: 'Aktifkan sistem Tier dan pendaftaran berbayar bertingkat.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium',
      devNotes: 'Mempengaruhi halaman /pricing dan alur pendaftaran.'
    },
    {
      key: 'module_achievements_enabled',
      category: 'feature',
      description: 'Aktifkan sistem pencapaian dan reward otomatis.',
      proposedValue: true,
      isPublic: true,
      impact: 'low',
      devNotes: 'Terhubung dengan trigger di database.'
    },
    // --- 30 USER FEATURES UNIVERSE ---
    {
      key: 'feature_free_pack_enabled',
      category: 'feature',
      description: 'Master switch untuk 10 fitur gratis (Starter pack).',
      proposedValue: true,
      isPublic: true,
      impact: 'medium'
    },
    {
      key: 'feature_learning_streaks',
      category: 'feature',
      description: 'Sistem konsistensi harian (streaks) untuk pengguna.',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'feature_flashcards',
      category: 'feature',
      description: 'Alat bantu hafal interaktif (Flashcards).',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'feature_daily_quests',
      category: 'feature',
      description: 'Tantangan mikro harian dengan hadiah XP.',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'feature_paid_pack_enabled',
      category: 'feature',
      description: 'Master switch untuk 10 fitur premium (Paid pack).',
      proposedValue: true,
      isPublic: true,
      impact: 'high'
    },
    {
      key: 'feature_mentorship_sessions',
      category: 'feature',
      description: 'Sistem penjadwalan konsultasi instruktur.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium',
      dependencies: ['module_payment_enabled']
    },
    {
      key: 'feature_resume_builder_ai',
      category: 'feature',
      description: 'Ekspor pencapaian ke CV berbasis AI.',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'feature_offline_vault',
      category: 'feature',
      description: 'Akses materi secara offline untuk member premium.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium'
    },
    {
      key: 'feature_special_pack_enabled',
      category: 'feature',
      description: 'Master switch untuk 10 fitur elite (Special pack).',
      proposedValue: false,
      isPublic: true,
      impact: 'high'
    },
    {
      key: 'feature_ai_learning_path',
      category: 'feature',
      description: 'Kurikulum adaptif bertenaga AI (Gemini).',
      proposedValue: false,
      isPublic: true,
      impact: 'medium',
      errorThreshold: 5
    },
    {
      key: 'feature_job_matching_ai',
      category: 'feature',
      description: 'Sistem perjodohan karir otomatis.',
      proposedValue: false,
      isPublic: true,
      impact: 'medium'
    },
    {
      key: 'feature_sandbox_playground',
      category: 'feature',
      description: 'Environment coding/sandbox di browser.',
      proposedValue: false,
      isPublic: true,
      impact: 'high',
      errorThreshold: 10
    },
    {
      key: 'feature_skill_radar',
      category: 'feature',
      description: 'Visualisasi radar chart untuk analisis skill.',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'feature_ar_visualizer',
      category: 'feature',
      description: 'Visualisasi materi berbasis Augmented Reality.',
      proposedValue: false,
      isPublic: true,
      impact: 'medium'
    },
    // --- END 30 USER FEATURES ---
    {
      key: 'allow_new_enrollments',
      category: 'feature',
      description: 'Kontrol pendaftaran kursus baru.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium'
    },
    {
      key: 'live_chat_enabled',
      category: 'feature',
      description: 'Aktifkan fitur bantuan chat langsung dengan CS.',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'certificate_generation',
      category: 'feature',
      description: 'Izinkan sistem membuat sertifikat kursus otomatis.',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'gamification_system',
      category: 'feature',
      description: 'Aktifkan sistem poin, badges, dan leaderboard.',
      proposedValue: true,
      isPublic: true,
      impact: 'low'
    },
    {
      key: 'discussions_enabled',
      category: 'feature',
      description: 'Aktifkan forum diskusi di setiap materi kursus.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium'
    },
    {
      key: 'voucher_system_enabled',
      category: 'feature',
      description: 'Aktifkan penggunaan kode promo dan voucher.',
      proposedValue: true,
      isPublic: true,
      impact: 'high'
    },
    {
      key: 'security_lockdown',
      category: 'security',
      description: 'Kunci akses tulis untuk semua pengguna non-admin.',
      proposedValue: false,
      isPublic: false,
      impact: 'critical'
    },
    {
      key: 'ai_tutor_beta',
      category: 'feature',
      description: 'Aktifkan fitur Sentinel AI Assistant.',
      proposedValue: false,
      isPublic: true,
      impact: 'medium',
      dependencies: ['module_auth_enabled']
    },
    {
      key: 'ddos_protection_enabled',
      category: 'security',
      description: 'Aktifkan sistem filtrasi trafik otomatis.',
      proposedValue: false,
      isPublic: true,
      impact: 'high'
    },
    {
      key: 'ddos_protection_level',
      category: 'security',
      description: 'Level proteksi: low (soft), medium (rate-limit), high (challenge).',
      proposedValue: 'low',
      isPublic: true,
      impact: 'high'
    },
    {
      key: 'ddos_rate_limit',
      category: 'security',
      description: 'Maksimal request per menit per IP.',
      proposedValue: 100,
      isPublic: true,
      impact: 'medium'
    }
  ] as FeatureManifest[]
};
