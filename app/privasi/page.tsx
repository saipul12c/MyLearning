import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Share2, Cookie, UserCheck, Database, Smartphone, RefreshCw, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi resmi platform MyLearning Indonesia.",
};

const sections = [
  { id: "informasi", title: "Informasi yang Kami Kumpulkan", icon: Database },
  { id: "penggunaan", title: "Cara Kami Menggunakan Informasi", icon: RefreshCw },
  { id: "pembagian", title: "Pembagian Informasi", icon: Share2 },
  { id: "keamanan", title: "Keamanan Data", icon: Shield },
  { id: "cookie", title: "Cookie dan Teknologi Pelacakan", icon: Cookie },
  { id: "hak", title: "Hak Pengguna", icon: UserCheck },
  { id: "penyimpanan", title: "Penyimpanan Data", icon: Smartphone },
  { id: "kontak", title: "Hubungi Kami", icon: MessageCircle },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-bg grid-pattern py-20 relative overflow-hidden">
        {/* Floating Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-sm font-medium mb-6 animate-fade-in-up">
            <Lock size={14} />
            Privasi Anda Prioritas Kami
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight animate-fade-in-up delay-100">
            Kebijakan <span className="gradient-text">Privasi</span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto animate-fade-in-up delay-200">
            Sangat penting bagi kami untuk menjaga kepercayaan Anda dengan melindungi data pribadi Anda melalui standar keamanan tertinggi.
          </p>
          <div className="mt-8 text-slate-500 text-sm animate-fade-in-up delay-300">
            Terakhir diperbarui: 13 April 2026
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit hidden lg:block">
              <div className="card p-6 border-white/5 bg-white/[0.02]">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Eye size={18} className="text-purple-400" />
                  Navigasi Cepat
                </h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                    >
                      <section.icon size={16} className="group-hover:text-purple-400 transition-colors" />
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content Area */}
            <article className="lg:col-span-8">
              <div className="space-y-16">
                
                {/* Intro */}
                <div className="prose prose-invert prose-slate max-w-none">
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Selamat datang di MyLearning. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindunginya sesuai dengan hukum perlindungan data yang berlaku di Indonesia. Kebijakan ini merinci bagaimana kami menangani informasi Anda saat Anda menggunakan platform pendidikan kami.
                  </p>
                </div>

                {/* Section 1: Informasi */}
                <div id="informasi" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <Database size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">1. Informasi yang Kami Kumpulkan</h2>
                  </div>
                  <div className="space-y-4 text-slate-400 text-base leading-relaxed">
                    <p>Kami mengumpulkan informasi yang Anda berikan langsung kepada kami, serta informasi yang kami peroleh secara otomatis saat Anda menggunakan layanan:</p>
                    <ul className="space-y-3">
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2.5 flex-shrink-0" />
                        <div><strong className="text-slate-200">Data Identitas:</strong> Nama lengkap, alamat email, nomor telepon, dan foto profil.</div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2.5 flex-shrink-0" />
                        <div><strong className="text-slate-200">Data Transaksi:</strong> Informasi tentang kursus yang Anda beli dan metode pembayaran (kami menggunakan payment gateway resmi bersertifikat).</div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2.5 flex-shrink-0" />
                        <div><strong className="text-slate-200">Data Pembelajaran:</strong> Progress belajar, kuis yang diselesaikan, tugas yang dikirim, dan sertifikat yang diperoleh.</div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2.5 flex-shrink-0" />
                        <div><strong className="text-slate-200">Data Teknis:</strong> Alamat IP, jenis perangkat, sistem operasi, dan aktivitas log browser.</div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 2: Penggunaan */}
                <div id="penggunaan" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <RefreshCw size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">2. Cara Kami Menggunakan Informasi</h2>
                  </div>
                  <div className="space-y-4 text-slate-400 text-base leading-relaxed">
                    <p>Informasi Anda digunakan untuk tujuan-tujuan berikut:</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Personalisasi pengalaman belajar",
                        "Memproses pesanan dan akses kursus",
                        "Memberikan dukungan teknis",
                        "Update konten dan notifikasi penting",
                        "Analisis performa platform",
                        "Keamanan dan verifikasi"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                          <UserCheck size={14} className="text-cyan-400" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Pembagian */}
                <div id="pembagian" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Share2 size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">3. Pembagian Informasi</h2>
                  </div>
                  <div className="space-y-4 text-slate-400 text-base leading-relaxed">
                    <p>Kami tidak menjual informasi pribadi Anda kepada pihak ketiga. Kami hanya membagikan informasi dalam situasi terbatas berikut:</p>
                    <ul className="space-y-3">
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 flex-shrink-0" />
                        <div>Penyedia layanan instruktur untuk membantu manajemen kursus.</div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 flex-shrink-0" />
                        <div>Penyedia gerbang pembayaran (Payment Gateway) untuk transaksi aman.</div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 4: Keamanan */}
                <div id="keamanan" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Shield size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">4. Keamanan Data</h2>
                  </div>
                  <div className="card p-6 bg-emerald-500/5 border-emerald-500/10">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Kami menerapkan enkripsi end-to-end (SSL/TLS) untuk semua transmisi data sensitif. Data Anda disimpan di pusat data yang memenuhi standar keamanan industri tertinggi. Kami juga melakukan audit keamanan rutin untuk mencegah akses yang tidak sah, kebocoran, atau manipulasi data.
                    </p>
                  </div>
                </div>

                {/* Section 5: Cookie */}
                <div id="cookie" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                      <Cookie size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">5. Cookie dan Teknologi Pelacakan</h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Kami menggunakan cookie untuk meningkatkan pengalaman navigasi Anda, mengingat preferensi login, dan menganalisis lalu lintas situs. Anda dapat mengatur browser Anda untuk menolak cookie, namun beberapa bagian dari platform mungkin tidak berfungsi dengan baik.
                  </p>
                </div>

                {/* Section 6: Hak Pengguna */}
                <div id="hak" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                      <UserCheck size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">6. Hak Pengguna</h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Anda memiliki hak untuk mengakses, memperbarui, atau menghapus data pribadi Anda yang kami simpan. Anda juga berhak untuk menarik persetujuan penggunaan data kapan saja melalui pengaturan profil atau menghubungi tim dukungan kami.
                  </p>
                </div>

                {/* Section 7: Penyimpanan */}
                <div id="penyimpanan" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Smartphone size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">7. Penyimpanan Data</h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Kami menyimpan informasi Anda selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan kepada Anda. Jika Anda menutup akun, kami akan menghapus data Anda kecuali yang diperlukan untuk memenuhi kewajiban hukum atau penyelesaian sengketa.
                  </p>
                </div>

                {/* Section 8: Kontak */}
                <div id="kontak" className="scroll-mt-24 group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <MessageCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">8. Hubungi Kami</h2>
                  </div>
                  <p className="text-slate-400 mb-6">Jika Anda memiliki pertanyaan tentang kebijakan privasi ini atau ingin mengajukan hak Anda, silakan hubungi tim legal kami:</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="card p-6 flex flex-col items-center text-center">
                      <div className="text-sm text-slate-500 mb-1 font-bold uppercase tracking-widest">Email Legal</div>
                      <div className="text-white font-bold underline decoration-purple-500/50">legal@mylearning.id</div>
                    </div>
                    <div className="card p-6 flex flex-col items-center text-center">
                      <div className="text-sm text-slate-500 mb-1 font-bold uppercase tracking-widest">Pusat Bantuan</div>
                      <Link href="/contact" className="text-purple-400 font-bold hover:underline">Halaman Kontak</Link>
                    </div>
                  </div>
                </div>

                {/* Closing Tag */}
                <div className="pt-10 border-t border-white/5 text-center">
                  <p className="text-slate-500 text-sm italic">
                    Dengan menggunakan platform MyLearning, Anda dianggap telah menyetujui seluruh ketentuan dalam Kebijakan Privasi ini.
                  </p>
                </div>

              </div>
            </article>

          </div>
        </div>
      </section>
    </div>
  );
}
