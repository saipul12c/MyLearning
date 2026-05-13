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
}

export const SYSTEM_MANIFEST = {
  version: "1.5.0", // Added Tiers & Achievements
  lastUpdated: "2026-04-29",
  
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
      devNotes: 'Mempengaruhi halaman /pring dan alur pendaftaran.'
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
    {
      key: 'allow_new_enrollments',
      category: 'feature',
      description: 'Kontrol pendaftaran kursus baru.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium',
      devNotes: 'Sudah diintegrasikan dengan lib/enrollment.ts'
    },
    {
      key: 'live_chat_enabled',
      category: 'feature',
      description: 'Aktifkan fitur bantuan chat langsung dengan CS.',
      proposedValue: true,
      isPublic: true,
      impact: 'low',
      devNotes: 'Terhubung ke sistem WebSocket/Socket.io'
    },
    {
      key: 'certificate_generation',
      category: 'feature',
      description: 'Izinkan sistem membuat sertifikat kursus otomatis.',
      proposedValue: true,
      isPublic: true,
      impact: 'low',
      devNotes: 'Mempengaruhi beban CPU saat rendering PDF.'
    },
    {
      key: 'gamification_system',
      category: 'feature',
      description: 'Aktifkan sistem poin, badges, dan leaderboard.',
      proposedValue: true,
      isPublic: true,
      impact: 'low',
      devNotes: 'Menghitung peringkat pengguna secara real-time.'
    },
    {
      key: 'discussions_enabled',
      category: 'feature',
      description: 'Aktifkan forum diskusi di setiap materi kursus.',
      proposedValue: true,
      isPublic: true,
      impact: 'medium',
      devNotes: 'Berpengaruh pada moderasi konten pengguna.'
    },
    {
      key: 'voucher_system_enabled',
      category: 'feature',
      description: 'Aktifkan penggunaan kode promo dan voucher.',
      proposedValue: true,
      isPublic: true,
      impact: 'high',
      devNotes: 'Penting untuk kampanye pemasaran.'
    },
    {
      key: 'security_lockdown',
      category: 'security',
      description: 'Kunci akses tulis untuk semua pengguna non-admin.',
      proposedValue: false,
      isPublic: false,
      impact: 'critical',
      devNotes: 'Mempengaruhi performa database RLS.'
    },
    {
      key: 'ai_tutor_beta',
      category: 'feature',
      description: 'Aktifkan fitur tutor AI berbasis Gemini 1.5 Pro.',
      proposedValue: false,
      isPublic: true,
      impact: 'medium',
      devNotes: 'Tergantung pada module_auth_enabled.',
      dependencies: ['module_auth_enabled']
    },
    {
      key: 'ddos_protection_enabled',
      category: 'security',
      description: 'Aktifkan sistem filtrasi trafik otomatis.',
      proposedValue: false,
      isPublic: true,
      impact: 'high',
      devNotes: 'Mempengaruhi middleware dan performa response time.'
    },
    {
      key: 'ddos_protection_level',
      category: 'security',
      description: 'Level proteksi: low (soft), medium (rate-limit), high (challenge).',
      proposedValue: 'low',
      isPublic: true,
      impact: 'high',
      devNotes: 'Level high menampilkan halaman verifikasi ke semua visitor.'
    },
    {
      key: 'ddos_rate_limit',
      category: 'security',
      description: 'Maksimal request per menit per IP.',
      proposedValue: 100,
      isPublic: true,
      impact: 'medium',
      devNotes: 'Hanya efektif di level medium/high.'
    }
  ] as FeatureManifest[]
};
