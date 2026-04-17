import type { Metadata } from "next";
import Link from "next/link";
import { 
  Shield, Lock, Eye, Share2, Cookie, UserCheck, 
  Database, Smartphone, RefreshCw, MessageCircle, 
  Link2, Baby, History, Scale, ShieldCheck, 
  ArrowRight, Info, AlertCircle, TrendingUp 
} from "lucide-react";
import NativeAdCard from "@/app/components/NativeAdCard";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | MyLearning",
  description: "Kebijakan privasi resmi platform MyLearning Indonesia. Pelajari bagaimana kami melindungi data pribadi Anda.",
};

const sections = [
  { id: "informasi", title: "Informasi yang dikumpulkan", icon: Database, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "penggunaan", title: "Cara Menggunakan Data", icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "pembagian", title: "Pembagian Informasi", icon: Share2, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { id: "keamanan", title: "Protokol Keamanan", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "cookie", title: "Cookie & Tracking", icon: Cookie, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { id: "hak", title: "Hak Privasi Anda", icon: UserCheck, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "penyimpanan", title: "Retensi Data", icon: Smartphone, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "hukum", title: "Kepatuhan UU PDP", icon: Scale, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { id: "kontak", title: "Hubungi Legal", icon: MessageCircle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08080c]">
      {/* Hero Section */}
      <section className="hero-bg grid-pattern py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in-up shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <ShieldCheck size={14} className="animate-pulse" />
            Standard Keamanan Global ISO/IEC 27001
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black mb-8 leading-tight tracking-tight animate-fade-in-up delay-100">
            Komitmen <br />
            <span className="gradient-text">Privasi Digital</span>
          </h1>
          
          <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Kami percaya bahwa privasi adalah hak asasi manusia. Di <span className="text-white font-bold">MyLearning</span>, kami merancang sistem kami dengan mengutamakan perlindungan data Anda di setiap baris kode.
          </p>
          
          <div className="mt-12 flex flex-wrap justify-center gap-4 animate-fade-in-up delay-300">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-slate-400">
              <History size={14} className="text-purple-400" /> Versi 2.4 (Aktif)
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-slate-400">
              <RefreshCw size={14} className="text-cyan-400 animate-spin-slow" /> Terakhir Update: 16 April 2026
            </div>
          </div>
        </div>
      </section>

      {/* Quick Summary Dashboard */}
      <section className="py-12 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-8 bg-[#0c0c14]/80 backdrop-blur-2xl border-purple-500/20 shadow-2xl skew-y-0 group hover:-translate-y-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
              <h3 className="text-white font-bold text-lg mb-3">Keamanan Multi-Lapis</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Enkripsi AES-256 untuk penyimpanan data dan TLS 1.3 untuk setiap transmisi data di platform kami.</p>
            </div>
            
            <div className="card p-8 bg-[#0c0c14]/80 backdrop-blur-2xl border-emerald-500/20 shadow-2xl group hover:-translate-y-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-white font-bold text-lg mb-3">Kepatuhan UU PDP</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Sistem kami sepenuhnya selaras dengan Undang-Undang Perlindungan Data Pribadi No. 27 Tahun 2022.</p>
            </div>
            
            <div className="card p-8 bg-[#0c0c14]/80 backdrop-blur-2xl border-cyan-500/20 shadow-2xl group hover:-translate-y-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
                <UserCheck size={24} />
              </div>
              <h3 className="text-white font-bold text-lg mb-3">Kontrol Penuh User</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Anda memiliki hak mutlak untuk menghapus, mengunduh, atau memperbarui data Anda kapan saja tanpa hambatan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4 lg:sticky lg:top-28 h-fit hidden lg:block">
              <div className="card p-2 border-white/5 bg-[#0c0c14]/50 backdrop-blur-md overflow-hidden">
                <div className="p-4 border-b border-white/5 mb-2">
                  <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                    <Info size={14} className="text-purple-400" />
                    Indeks Kebijakan
                  </h3>
                </div>
                <nav className="p-2 space-y-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <section.icon size={16} className={`group-hover:${section.color} transition-colors opacity-50 group-hover:opacity-100`} />
                        {section.title}
                      </div>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-purple-400" />
                    </a>
                  ))}
                </nav>
              </div>

              {/* Legal Tip Card */}
              <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-purple-600/20 to-cyan-500/10 border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <Scale size={80} />
                 </div>
                 <h4 className="text-white font-bold mb-2">Butuh Bantuan Hukum?</h4>
                 <p className="text-slate-400 text-xs leading-relaxed mb-4">Tim legal kami siap menjawab pertanyaan teknis terkait data Anda dalam 24 jam kerja.</p>
                 <Link href="/contact" className="text-cyan-400 text-xs font-black uppercase tracking-widest hover:text-white flex items-center gap-2">
                    Hubungi Legal <ArrowRight size={14} />
                 </Link>
              </div>

              {/* Sidebar Ad Placement */}
              <div className="mt-8">
                <NativeAdCard location="privacy_sidebar" variant="compact" />
              </div>
            </aside>

            {/* Content Area */}
            <article className="lg:col-span-8">
              <div className="space-y-24">
                
                {/* 1. Informasi */}
                <div id="informasi" className="scroll-mt-28">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                      <Database size={28} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">Data yang Dikumpulkan</h2>
                      <p className="text-purple-400/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Kategori: Pengumpulan Data</p>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { title: "Identitas Personal", desc: "Email, Nama Lengkap, Foto Profil & Kontak.", icon: UserCheck, color: "text-blue-400" },
                      { title: "Metrik Belajar", desc: "Progress Kelas, Nilai Kuis & Aktivitas Kursus.", icon: TrendingUp, color: "text-emerald-400" },
                      { title: "Metadata Teknis", desc: "Alamat IP, Device ID, & Fingerprint Browser.", icon: Smartphone, color: "text-orange-400" },
                      { title: "Data Finansial", desc: "Riwayat Transaksi (Nomor kartu disamarkan).", icon: Lock, color: "text-pink-400" }
                    ].map((item, i) => (
                      <div key={i} className="card p-6 bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors">
                        <item.icon size={20} className={`${item.color} mb-4`} />
                        <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Penggunaan & Pembagian */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div id="penggunaan" className="scroll-mt-28">
                    <div className="flex items-center gap-3 mb-6">
                      <RefreshCw size={20} className="text-blue-400" />
                      <h3 className="text-xl font-bold text-white">Penggunaan Data</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-500">
                       <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 text-blue-500" /> Pengiriman sertifikat digital resmi.</li>
                       <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 text-blue-500" /> Rekomendasi kursus personal via AI.</li>
                       <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 text-blue-500" /> Verifikasi identitas untuk ujian online.</li>
                    </ul>
                  </div>
                  <div id="pembagian" className="scroll-mt-28">
                    <div className="flex items-center gap-3 mb-6">
                      <Share2 size={20} className="text-indigo-400" />
                      <h3 className="text-xl font-bold text-white">Pembagian Data</h3>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Data hanya dibagikan ke penyedia pembayaran (Payment Gateway) dan instruktur resmi untuk keperluan verifikasi belajar. Kami <span className="text-red-400 font-bold">TIDAK PERNAH</span> menjual data Anda ke pihak iklan luar.
                    </p>
                  </div>
                </div>

                {/* 3. Keamanan Highlight */}
                <div id="keamanan" className="scroll-mt-28">
                  <div className="card p-10 bg-gradient-to-br from-emerald-500/10 via-[#0c0c14] to-transparent border-emerald-500/20 overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-emerald-400" size={32} />
                        <h2 className="text-3xl font-black text-white tracking-tight">Protokol Keamanan Data</h2>
                      </div>
                      
                      <div className="space-y-6 text-slate-400">
                        <p className="text-lg leading-relaxed">
                          Keamanan bukanlah fitur, melainkan pondasi. Kami mengadopsi standar <span className="text-white font-bold italic">Military Grade Encryption</span> untuk memastikan data Anda tidak pernah jatuh ke tangan yang salah.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Enkripsi Statis</div>
                             <p className="text-xs">Semua data database dienkripsi menggunakan AES-256 yang mustahil ditembus brute-force.</p>
                           </div>
                           <div className="space-y-2">
                             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Enkripsi Transit</div>
                             <p className="text-xs">Setiap interaksi antara browser Anda dan server kami dilindungi oleh sertifikat SSL EV modern.</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Cookie & Penyimpanan */}
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div id="cookie" className="scroll-mt-28 card p-6 border-pink-500/10 bg-pink-500/[0.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <Cookie size={24} className="text-pink-400" />
                      <h3 className="text-lg font-bold text-white">Cookie & Tracking</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Kami menggunakan HTTP-Only cookie untuk mengamankan sesi login Anda. Pelacakan hanya dilakukan secara anonim untuk statistik performa website.
                    </p>
                    <div className="p-3 rounded-lg bg-pink-500/5 text-[10px] text-pink-300 font-bold border border-pink-500/10">
                      INFO: Anda dapat mematikan tracking via pengaturan browser.
                    </div>
                  </div>
                  <div id="penyimpanan" className="scroll-mt-28 card p-6 border-cyan-500/10 bg-cyan-500/[0.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <Smartphone size={24} className="text-cyan-400" />
                      <h3 className="text-lg font-bold text-white">Retensi Data</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Akun yang tidak aktif selama 5 tahun akan diarsip dan dihapus secara permanen. Anda dapat meminta penghapusan akun instan melalui hub bantuan.
                    </p>
                  </div>
                </div>

                {/* 5. Hak Pengguna - Grid Icons */}
                <div id="hak" className="scroll-mt-28">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <UserCheck size={28} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">Hak Privasi & Kontrol Anda</h2>
                      <p className="text-orange-400/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Advokasi Pengguna</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                     {[
                       { title: "Hak Akses & Portabilitas", desc: "Anda berhak meminta salinan data pribadi Anda dalam format digital yang terstruktur (JSON/CSV)." },
                       { title: "Hak Koreksi & Pembaruan", desc: "Dapat mengubah informasi profil kapan pun melalui dashboard pengaturan tanpa persetujuan admin." },
                       { title: "Hak Penghapusan (Right to be Forgotten)", desc: "Anda memiliki hak untuk meminta penghapusan permanen akun dan seluruh data terkait dari server kami." },
                       { title: "Hak Pembatasan Pemrosesan", desc: "Memilih untuk tidak menerima email pemasaran atau pelacakan analitik opsional." }
                     ].map((item, i) => (
                       <div key={i} className="flex items-start gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                         <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-110 transition-transform">
                            {i + 1}
                         </div>
                         <div>
                            <h4 className="text-white font-bold mb-1">{item.title}</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                         </div>
                       </div>
                     ))}
                  </div>
                </div>

                {/* 6. UU PDP Section */}
                <div id="hukum" className="scroll-mt-28">
                  <div className="card p-8 border-yellow-500/30 bg-[#0c1214] relative overflow-hidden group">
                     <div className="absolute top-0 bottom-0 left-0 w-2 bg-yellow-500/50" />
                     <div className="flex items-start gap-6">
                        <AlertCircle className="text-yellow-500 shrink-0 mt-1" size={32} />
                        <div>
                           <h3 className="text-xl font-bold text-white mb-3">Pernyataan Kepatuhan UU PDP No. 27/2022</h3>
                           <p className="text-slate-400 text-sm leading-relaxed mb-4">
                              Sebagai platform yang beroperasi secara resmi di wilayah Republik Indonesia, MyLearning menjamin bahwa seluruh aktivitas pengelolaan Data Pribadi dilakukan dengan dasar hukum yang sah, transparan, dan akuntabel sesuai dengan <span className="text-yellow-400 font-bold italic underline decoration-yellow-500/30">UU Perlindungan Data Pribadi</span>.
                           </p>
                           <div className="flex gap-4">
                              <span className="text-[9px] font-black px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 uppercase tracking-widest border border-yellow-500/20">Transparansi</span>
                              <span className="text-[9px] font-black px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 uppercase tracking-widest border border-yellow-500/20">Akuntabilitas</span>
                              <span className="text-[9px] font-black px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 uppercase tracking-widest border border-yellow-500/20">Integritas</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Interstitial Inline Ad */}
                <div className="py-2">
                   <NativeAdCard location="privacy_policy_inline" variant="inline" />
                </div>

                {/* 7. Kontak Detailed */}
                <div id="kontak" className="scroll-mt-28">
                  <div className="flex flex-col md:flex-row gap-8">
                     <div className="flex-1">
                        <h2 className="text-3xl font-black text-white mb-4">Butuh Penjelasan Lebih Lanjut?</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Kami memiliki Data Protection Officer (DPO) khusus yang bertugas memastikan privasi Anda terlindungi. Jangan ragu untuk berdiskusi dengan kami.</p>
                        <div className="flex flex-col gap-3">
                           <div className="flex items-center gap-3 text-slate-300">
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                 <MessageCircle size={14} />
                              </div>
                              <span className="text-xs font-bold">Email: legal@mylearning.id</span>
                           </div>
                           <div className="flex items-center gap-3 text-slate-300">
                              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                                 <Smartphone size={14} />
                              </div>
                              <span className="text-xs font-bold">Respon Cepat: (021) 500-12345</span>
                           </div>
                        </div>
                     </div>
                     <div className="w-full md:w-72">
                        <div className="card p-6 bg-white/[0.02] border-white/10 text-center flex flex-col items-center">
                           <Lock className="text-purple-500 mb-4" size={40} />
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">MyLearning Safe Badge</p>
                           <span className="text-white font-bold text-sm italic">"Keamanan data Anda adalah reputasi kami."</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Closing with Banner */}
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-purple-900/40 via-[#0c0c14] to-cyan-900/30 border border-white/5 text-center">
                   <p className="text-slate-400 text-sm italic">
                      Dengan terus menggunakan platform MyLearning, Anda secara sadar memahami dan menyetujui seluruh protokol privasi yang kami terapkan demi kenyamanan dan keamanan ekosistem belajar bersama.
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
