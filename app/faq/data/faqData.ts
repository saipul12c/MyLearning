export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  name: string;
  icon: string;
  items: FAQItem[];
}

export const faqData: FAQCategory[] = [
  {
    name: "Umum",
    icon: "📌",
    items: [
      {
        question: "Apa itu MyLearning?",
        answer:
          "MyLearning adalah platform edutech premium yang menyediakan kursus berkualitas tinggi dengan kurikulum berbasis industri. Kami mengintegrasikan teknologi AI dan sistem manajemen belajar modern untuk memastikan pengalaman belajar yang adaptif dan terstruktur.",
      },
      {
        question: "Bagaimana cara memulai belajar?",
        answer:
          "Cukup buat akun, pilih kursus yang sesuai dengan level Anda (Starter, Accelerator, atau Mastery), dan lakukan aktivasi. Setelah pembayaran diverifikasi, materi akan langsung terbuka di dashboard Anda.",
      },
      {
        question: "Apakah saya bisa mengambil banyak kursus sekaligus?",
        answer:
          "Untuk memastikan fokus dan efektivitas belajar, MyLearning menerapkan kebijakan satu pendaftaran aktif (paid) dalam satu waktu. Anda dapat mendaftar kursus baru setelah menyelesaikan kursus sebelumnya atau masa aksesnya berakhir.",
      },
      {
        question: "Apakah ada kursus gratis?",
        answer:
          "Ya, kami menyediakan kursus gratis serta modul preview pada kursus berbayar agar Anda dapat mencoba kualitas materi kami sebelum berkomitmen lebih jauh.",
      },
      {
        question: "Bagaimana jika saya lupa password?",
        answer:
          "Anda dapat menggunakan fitur 'Lupa Password' di halaman login. Tautan pengaturan ulang kata sandi akan dikirimkan ke email terdaftar Anda secara instan.",
      }
    ],
  },
  {
    name: "Akses & Pembelajaran",
    icon: "⚙️",
    items: [
      {
        question: "Berapa lama masa akses kursus saya?",
        answer:
          "Durasi akses bergantung pada level kursus: Starter (30 hari), Accelerator (45 hari), dan Mastery (60 hari). Sistem ini dirancang untuk mendorong kedisiplinan dan memastikan Anda menguasai materi dalam rentang waktu yang optimal.",
      },
      {
        question: "Apakah materi bisa diakses selamanya?",
        answer:
          "Masa akses terbatas sesuai paket level yang dipilih. Namun, sertifikat yang Anda peroleh akan tetap valid dan dapat diverifikasi selamanya di database kami.",
      },
      {
        question: "Bisakah belajar di HP atau Tablet?",
        answer:
          "Tentu. MyLearning menggunakan teknologi PWA (Progressive Web App) yang responsif. Anda juga dapat menginstalnya sebagai aplikasi desktop atau mobile melalui browser (Add to Home Screen) untuk akses lebih cepat.",
      },
      {
        question: "Bagaimana jika progres belajar saya tidak tersimpan?",
        answer:
          "Pastikan koneksi internet stabil saat menyelesaikan materi. Progres disinkronkan secara real-time ke server kami. Jika terjadi kendala, coba segarkan halaman atau hubungi Live CS kami.",
      },
      {
        question: "Apakah ada fitur Dark Mode?",
        answer:
          "Ya, Anda dapat mengubah tema melalui menu profil di pojok kanan atas untuk kenyamanan belajar di kondisi cahaya rendah.",
      }
    ],
  },
  {
    name: "Pembayaran & Voucher",
    icon: "💳",
    items: [
      {
        question: "Metode pembayaran apa saja yang tersedia?",
        answer:
          "Kami mendukung pembayaran otomatis melalui Virtual Account (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, DANA, ShopeePay), serta transfer manual dengan verifikasi bukti bayar.",
      },
      {
        question: "Berapa lama proses verifikasi pembayaran?",
        answer:
          "Pembayaran melalui Virtual Account dan E-Wallet diverifikasi secara instan (real-time). Untuk transfer manual, tim kami akan melakukan verifikasi dalam waktu 1-3 jam pada jam operasional (08.00 - 22.00 WIB).",
      },
      {
        question: "Bagaimana cara menggunakan voucher diskon?",
        answer:
          "Anda dapat melihat voucher yang tersedia di menu 'Dompet Voucher' pada dashboard. Masukkan kode voucher di halaman checkout untuk memotong total harga pembelian.",
      },
      {
        question: "Mengapa voucher saya tidak bisa digunakan?",
        answer:
          "Voucher memiliki syarat penggunaan tertentu seperti minimal transaksi, batas waktu, atau hanya berlaku untuk kategori/instruktur tertentu. Pastikan voucher Anda masih berlaku dan memenuhi kriteria.",
      },
      {
        question: "Apakah ada garansi uang kembali?",
        answer:
          "Kami menyediakan garansi uang kembali dalam 30 hari jika Anda belum mengakses lebih dari 20% materi kursus dan menemukan kendala teknis yang tidak dapat kami selesaikan.",
      }
    ],
  },
  {
    name: "Sertifikat & Karir",
    icon: "🏆",
    items: [
      {
        question: "Kapan saya mendapatkan sertifikat?",
        answer:
          "Sertifikat akan diterbitkan secara otomatis setelah Anda menyelesaikan 100% materi, lulus semua kuis, dan menyelesaikan Proyek Akhir (jika ada).",
      },
      {
        question: "Bagaimana cara memverifikasi keaslian sertifikat?",
        answer:
          "Setiap sertifikat dilengkapi dengan ID unik dan QR Code. Pihak ketiga atau perusahaan dapat memverifikasinya melalui halaman /verify. Sertifikat kami juga dilengkapi tanda tangan digital terverifikasi dari Instruktur dan Direktur MyLearning.",
      },
      {
        question: "Apakah sertifikat bisa dibagikan ke LinkedIn?",
        answer:
          "Ya, terdapat fitur 'Add to LinkedIn' di halaman detail sertifikat yang akan mengisi detail kredensial Anda secara otomatis ke profil profesional Anda.",
      },
      {
        question: "Berapa lama masa berlaku sertifikat?",
        answer:
          "Sertifikat MyLearning memiliki masa validitas profesional selama 2-5 tahun tergantung jenis keahliannya, untuk memastikan kompetensi Anda tetap relevan dengan perkembangan industri.",
      },
      {
        question: "Apakah MyLearning membantu penyaluran kerja?",
        answer:
          "Melalui Career Hub, kami menghubungkan lulusan terbaik dengan jaringan perusahaan mitra kami. Pastikan profil dan portofolio Anda selalu diperbarui.",
      }
    ],
  },
  {
    name: "Event & Komunitas",
    icon: "🤝",
    items: [
      {
        question: "Apa itu Platform Event MyLearning?",
        answer:
          "Fitur ini memungkinkan Anda mengikuti webinar, workshop, dan talkshow eksklusif. Anda akan mendapatkan e-ticket dengan QR Code unik setelah mendaftar.",
      },
      {
        question: "Bagaimana jika kuota event sudah penuh?",
        answer:
          "Anda akan dimasukkan ke dalam sistem 'Waiting List'. Jika ada peserta yang membatalkan atau kuota ditambah, Anda akan diprioritaskan dan mendapatkan notifikasi otomatis.",
      },
      {
        question: "Apakah ada sertifikat untuk peserta event?",
        answer:
          "Sebagian besar event kami menyediakan e-sertifikat kehadiran yang akan dikirimkan otomatis ke dashboard atau email Anda setelah acara selesai.",
      },
      {
        question: "Bagaimana cara berinteraksi dengan instruktur?",
        answer:
          "Anda dapat menggunakan fitur Q&A pada setiap materi kursus atau berdiskusi langsung saat sesi live event berlangsung.",
      }
    ],
  },
  {
    name: "Dukungan & Keamanan",
    icon: "🛡️",
    items: [
      {
        question: "Bagaimana cara menghubungi Customer Service?",
        answer:
          "Gunakan fitur Live CS di pojok kanan bawah. Anda akan dibantu oleh Asisten AI kami secara instan, atau dapat terhubung langsung dengan Agen Live jika memerlukan bantuan lebih lanjut.",
      },
      {
        question: "Apakah data pribadi saya aman?",
        answer:
          "Sangat aman. Kami menggunakan enkripsi AES-256 dan mematuhi sepenuhnya UU PDP No. 27 Tahun 2022. Data Anda tidak akan pernah dibagikan kepada pihak ketiga tanpa izin.",
      },
      {
        question: "Apa yang harus saya lakukan jika akun terindikasi diretas?",
        answer:
          "Segera lakukan reset password dan hubungi tim keamanan kami melalui Live CS atau email support@mylearning.com untuk pembekuan akun sementara.",
      },
      {
        question: "Bagaimana kebijakan penggunaan akun?",
        answer:
          "Satu akun bersifat personal dan hanya dapat login di maksimal 3 perangkat, namun hanya diperbolehkan melakukan streaming di 1 perangkat secara bersamaan untuk menjaga hak cipta konten.",
      }
    ],
  },
  {
    name: "Penilaian & Proyek Akhir",
    icon: "📝",
    items: [
      {
        question: "Apa saja jenis penilaian dalam kursus MyLearning?",
        answer:
          "Setiap kursus memiliki tiga lapisan penilaian: Tugas Praktik (per-materi), Kuis (per-bab), dan Proyek Akhir. Setiap lapisan harus diselesaikan secara berurutan sebelum Anda dapat melanjutkan ke materi berikutnya.",
      },
      {
        question: "Apakah saya harus menyelesaikan tugas sebelum lanjut ke materi berikutnya?",
        answer:
          "Ya, jika sebuah materi memiliki Tugas Praktik yang bersifat wajib, Anda harus menyelesaikannya terlebih dahulu. Tombol navigasi ke materi berikutnya akan terkunci hingga tugas tersebut dinyatakan selesai.",
      },
      {
        question: "Berapa kali saya bisa mengulang kuis?",
        answer:
          "Anda dapat mengulang kuis sebanyak yang diperlukan hingga mencapai skor kelulusan minimal. Skor terbaru Anda akan dicatat sebagai nilai final.",
      },
      {
        question: "Bagaimana cara mengirim Proyek Akhir?",
        answer:
          "Di halaman 'Kursus Saya', buka tab 'Proyek Akhir'. Anda dapat mengunggah file, mencantumkan link GitHub/URL hasil kerja Anda, serta menambahkan catatan untuk instruktur sebelum mengirimkan.",
      },
      {
        question: "Apakah nilai kuis dicantumkan dalam sertifikat?",
        answer:
          "Nilai numerik tidak ditampilkan di sertifikat. Namun, Anda wajib lulus semua kuis dan tugas untuk memenuhi syarat penerbitan sertifikat.",
      },
      {
        question: "Apa yang terjadi jika masa akses habis sebelum saya selesai?",
        answer:
          "Akses ke materi akan ditutup dan status enrollment menjadi 'Kadaluarsa'. Sertifikat tidak akan diterbitkan. Anda dapat memulai kursus dari awal dengan mendaftar ulang.",
      },
      {
        question: "Bisakah saya mereset kursus yang sertifikatnya sudah kadaluarsa?",
        answer:
          "Ya. Pada kursus yang telah selesai namun sertifikatnya sudah kadaluarsa, tersedia tombol 'Ulang Kursus (dari 0%)' di dashboard 'Kursus Saya'. Progres lama akan dihapus dan Anda bisa mendapatkan sertifikat baru yang valid.",
      }
    ],
  },
  {
    name: "Instruktur & Sistem Iklan",
    icon: "📢",
    items: [
      {
        question: "Bagaimana instruktur bisa membuat dan mempromosikan kursus?",
        answer:
          "Setelah terdaftar sebagai instruktur, Anda dapat membuat kursus baru melalui menu 'Dashboard Admin'. Setelah kursus dipublikasikan, Anda dapat mempromosikannya melalui menu 'Pusat Promosi' di dashboard.",
      },
      {
        question: "Apa itu fitur 'Pusat Promosi' untuk instruktur?",
        answer:
          "Pusat Promosi adalah sistem iklan native terintegrasi yang memungkinkan instruktur atau mitra mengajukan kampanye iklan. Tersedia dua mode: 'Iklan Kustom' (konten bebas) dan 'Promosi Kursus' (mempromosikan kursus spesifik milik Anda).",
      },
      {
        question: "Di mana iklan yang saya buat akan ditampilkan?",
        answer:
          "Iklan dapat tampil di berbagai lokasi strategis di platform, seperti halaman daftar kursus, detail event, sidebar materi, halaman verifikasi sertifikat, atau sebagai banner announcement global—tergantung paket yang dipilih.",
      },
      {
        question: "Bagaimana cara melacak performa iklan saya?",
        answer:
          "Dashboard 'Pusat Promosi' menampilkan metrik real-time berupa jumlah Views (tayangan), Klik, Click-Through Rate (CTR), total anggaran yang terpakai, dan persentase pencapaian target tayangan.",
      },
      {
        question: "Apakah instruktur hanya bisa membuat voucher untuk kursus miliknya sendiri?",
        answer:
          "Ya. Sistem membatasi instruktur untuk hanya membuat voucher yang ditargetkan ke kursus aktif milik mereka sendiri, demi menjaga keamanan dan integritas promosi.",
      },
      {
        question: "Berapa bagi hasil pendapatan untuk instruktur?",
        answer:
          "Skema bagi hasil bervariasi dan kompetitif, bergantung pada asal trafik pembelian (organik platform vs. referral luar). Rincian lengkap tersedia di halaman 'Menjadi Instruktur'.",
      }
    ],
  },
  {
    name: "Dashboard & Notifikasi",
    icon: "🔔",
    items: [
      {
        question: "Apa saja yang bisa dipantau dari dashboard utama?",
        answer:
          "Dashboard MyLearning menampilkan kursus aktif beserta progres belajar, tiket event yang dimiliki, riwayat notifikasi, dompet voucher, dan riwayat transaksi—semua dalam satu tempat yang terintegrasi.",
      },
      {
        question: "Bagaimana cara mengakses tiket event yang sudah saya daftar?",
        answer:
          "Buka menu 'Event Saya' di dashboard. Setiap tiket ditampilkan beserta detail event, status kehadiran, dan QR Code unik yang berfungsi sebagai bukti registrasi resmi Anda.",
      },
      {
        question: "Jenis notifikasi apa saja yang akan saya terima?",
        answer:
          "Notifikasi dikelompokkan menjadi tiga kategori: Transaksi (status pembayaran, voucher), Akademik (update progres, sertifikat, tugas), dan Sistem (keamanan akun, pengumuman platform). Semua tersedia di menu 'Pusat Notifikasi'.",
      },
      {
        question: "Apakah notifikasi ditampilkan secara real-time?",
        answer:
          "Ya. Ikon lonceng di navbar akan memperbarui badge notifikasi secara real-time. Anda dapat mengkliknya untuk melihat ringkasan notifikasi terbaru, atau membuka halaman 'Pusat Notifikasi' untuk manajemen lengkap.",
      },
      {
        question: "Bisakah saya meminta perbaikan nama di sertifikat setelah diterbitkan?",
        answer:
          "Ya, tersedia fitur 'Ajukan Perbaikan Nama' pada sertifikat yang baru diterbitkan (dalam 30 hari). Permohonan revisi hanya bisa diajukan maksimal 1 kali per sertifikat dan akan diproses oleh admin.",
      },
      {
        question: "Bagaimana jika pembayaran saya ditolak berkali-kali?",
        answer:
          "Sistem memberikan maksimal 3 kesempatan pengiriman bukti pembayaran. Jika ketiga percobaan ditolak, status enrollment akan menjadi 'Gagal Verifikasi'. Anda dapat menghapus enrollment tersebut dan mendaftar ulang kursus yang sama.",
      }
    ],
  },
  {
    name: "Diskusi & Ulasan",
    icon: "💬",
    items: [
      {
        question: "Bagaimana fitur diskusi antar siswa bekerja?",
        answer:
          "Setiap materi (lesson) memiliki Seksi Diskusi yang muncul di bagian bawah Lesson Player. Anda dapat mengajukan pertanyaan, membalas komentar siswa lain, dan berdiskusi langsung terkait topik materi tersebut.",
      },
      {
        question: "Apakah instruktur aktif menjawab di forum diskusi?",
        answer:
          "Ya. Instruktur dapat memantau dan merespons diskusi per-materi. Komentar instruktur ditandai dengan badge khusus agar mudah dikenali di antara diskusi siswa.",
      },
      {
        question: "Kapan saya bisa memberikan ulasan untuk kursus?",
        answer:
          "Fitur 'Beri Ulasan' tersedia setelah kursus berstatus 'Selesai'. Formulir ulasan berisi rating bintang (1-5) dan kolom komentar terbuka yang muncul langsung di kartu kursus pada halaman 'Kursus Saya'.",
      },
      {
        question: "Apakah ulasan saya bisa diedit setelah dikirim?",
        answer:
          "Saat ini ulasan bersifat final setelah dikirimkan dan tidak dapat diedit ulang. Pastikan Anda mengisi ulasan dengan baik dan jujur sesuai pengalaman belajar Anda.",
      },
      {
        question: "Bagaimana cara melaporkan komentar yang tidak pantas di forum?",
        answer:
          "Gunakan opsi 'Laporkan' yang tersedia pada setiap komentar. Tim moderasi kami akan meninjau laporan dan mengambil tindakan sesuai Kebijakan Komunitas MyLearning.",
      }
    ],
  }
];
