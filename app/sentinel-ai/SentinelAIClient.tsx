"use client";

import { 
  Sparkles, 
  MessageSquare, 
  Brain, 
  Zap, 
  ShieldCheck, 
  Search, 
  Clock, 
  Globe, 
  ChevronRight,
  Play,
  CheckCircle,
  Lightbulb,
  Lock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useAuth } from "../components/AuthContext";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function SentinelAIClient() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 selection:bg-purple-500/30 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Main Content */}

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.25em] mb-8 shadow-xl shadow-purple-500/5">
            <Zap size={12} className="animate-pulse" />
            Future of Personalized Learning
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
            Belajar <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">Lebih Cerdas</span>,<br />
            Bukan Lebih Keras.
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            Temui asisten belajar AI pribadi Anda. Dirancang untuk memahami kebutuhan unik Anda, Sentinel AI membantu Anda menembus batas belajar dengan dukungan instan dan cerdas.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/courses" className="w-full sm:w-auto px-10 py-4.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.3)] transition-all hover:scale-105 active:scale-95 text-center">
              Mulai Petualangan Belajar
            </Link>
            <button className="w-full sm:w-auto px-10 py-4.5 bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold rounded-2xl transition-all hover:bg-white/[0.07]">
              Lihat Demo Fitur
            </button>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-16 flex items-center justify-center gap-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
             <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Powered by</span>
             <div className="flex items-center gap-2">
                <Brain className="text-blue-400 w-5 h-5" />
                <span className="font-bold text-white text-lg tracking-tight">Gemini <span className="text-blue-400">1.5 Pro</span></span>
             </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="relative z-10 py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Kemampuan Tanpa Batas</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Sentinel AI Assistant bukan sekadar bot chat biasa. Ini adalah ekosistem kecerdasan yang terintegrasi penuh.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "24/7 Tutor Personal",
                desc: "Bingung dengan materi kursus? Tanya kapan saja. Sentinel AI akan menjelaskan konsep sulit dengan bahasa yang mudah dipahami.",
                icon: MessageSquare,
                color: "from-purple-500/20 to-purple-600/5",
                iconColor: "text-purple-400"
              },
              {
                title: "Otomasi Kuis Pintar",
                desc: "Ingin menguji pemahaman? Sentinel dapat membuatkan kuis latihan instan berdasarkan materi yang baru saja Anda pelajari.",
                icon: Brain,
                color: "from-indigo-500/20 to-indigo-600/5",
                iconColor: "text-indigo-400"
              },
              {
                title: "Navigasi Cerdas",
                desc: "Bantu temukan kursus, materi, atau pengaturan akun hanya dengan perintah teks sederhana. Navigasi jadi lebih cepat.",
                icon: Search,
                color: "from-cyan-500/20 to-cyan-600/5",
                iconColor: "text-cyan-400"
              },
              {
                title: "Analisis Progres",
                desc: "Dapatkan wawasan tentang area mana yang perlu Anda tingkatkan dan saran materi selanjutnya untuk mempercepat karir.",
                icon: Zap,
                color: "from-amber-500/20 to-amber-600/5",
                iconColor: "text-amber-400"
              },
              {
                title: "Keamanan Sentinel",
                desc: "Setiap interaksi dipantau oleh protokol Gatekeeper untuk memastikan data Anda tetap privat dan aman dari ancaman.",
                icon: ShieldCheck,
                color: "from-emerald-500/20 to-emerald-600/5",
                iconColor: "text-emerald-400"
              },
              {
                title: "Dukungan Multi-Bahasa",
                desc: "Belajar dalam bahasa pilihan Anda. Sentinel AI mahir dalam berbagai bahasa untuk pengalaman inklusif.",
                icon: Globe,
                color: "from-rose-500/20 to-rose-600/5",
                iconColor: "text-rose-400"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-purple-500/30 transition-all duration-500 flex flex-col h-full"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                   <feature.icon className={`${feature.iconColor} w-8 h-8`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">{feature.desc}</p>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest cursor-pointer group-hover:gap-4 transition-all">
                  Pelajari Teknologi <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Interaction Preview */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <div className="order-2 md:order-1">
                <div className="relative group">
                   <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity" />
                   <div className="relative bg-slate-900/80 border border-white/10 rounded-[3rem] p-4 md:p-8 backdrop-blur-3xl overflow-hidden shadow-2xl">
                      {/* Chat UI Mockup */}
                      <div className="space-y-6">
                         <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                               <Sparkles className="text-white w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white uppercase tracking-tighter">Sentinel AI Assistant</p>
                               <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[10px] text-slate-500 uppercase font-black">Active & Secure</span>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="flex justify-start">
                               <div className="bg-white/5 rounded-2xl rounded-bl-none p-4 max-w-[85%]">
                                  <p className="text-xs text-slate-300">Halo! Saya Sentinel AI Assistant. Ada materi yang kurang jelas dari Kursus UI/UX ini?</p>
                               </div>
                            </div>
                            <div className="flex justify-end">
                               <div className="bg-purple-600 rounded-2xl rounded-br-none p-4 max-w-[85%] shadow-lg shadow-purple-600/20">
                                  <p className="text-xs text-white font-medium">Bisa tolong jelaskan tentang konsep "F-Pattern" dalam tata letak desain?</p>
                               </div>
                            </div>
                            <div className="flex justify-start">
                               <div className="bg-white/5 rounded-2xl rounded-bl-none p-4 max-w-[90%] border border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                     <Lightbulb size={14} className="text-amber-400" />
                                     <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">AI Explanation</span>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed italic">
                                     "Tentu! F-Pattern menggambarkan bagaimana mata pengguna cenderung memindai halaman web secara visual. Biasanya dimulai dari bagian atas secara horizontal, lalu sedikit ke bawah dan memindai secara horizontal lagi..."
                                  </p>
                                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                                     <button className="text-[9px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">Buat Kuis Singkat</button>
                                     <button className="text-[9px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">Simpan Catatan</button>
                                  </div>
                               </div>
                            </div>
                         </div>
                         
                         <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
                            <div className="flex-1 bg-white/5 rounded-xl h-10 px-4 flex items-center text-slate-600 text-[10px]">Tulis pertanyaan Anda di sini...</div>
                            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white"><Play size={16} fill="currentColor" /></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="order-1 md:order-2 space-y-8">
                <div className="inline-flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-[0.3em]">
                   <Play size={12} fill="currentColor" /> Live Interaction
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
                  Interaksi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Manusiawi</span>,<br />
                  Kecepatan Mesin.
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Kami menggabungkan model bahasa paling mutakhir dengan data kurikulum MyLearning yang terkurasi. Hasilnya? Jawaban yang sangat relevan, akurat, dan dipersonalisasi untuk kursus yang sedang Anda ambil.
                </p>
                <div className="space-y-4">
                   {[
                      "Konteks sadar (Mengetahui kursus yang Anda pelajari)",
                      "Kemampuan meringkas modul panjang menjadi poin-poin",
                      "Dapat membantu dalam debugging kode pemrograman",
                      "Terintegrasi langsung dengan Live CS Support"
                   ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                         <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <CheckCircle size={14} className="text-emerald-500 group-hover:text-white" />
                         </div>
                         <span className="text-slate-300 font-medium text-sm">{item}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section className="relative z-10 py-24 px-6">
         <div className="max-w-4xl mx-auto">
            <div className="card p-10 md:p-16 text-center bg-gradient-to-br from-slate-900/80 to-transparent border border-white/5 relative overflow-hidden">
               <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
               <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8">
                     <Lock size={32} className="text-indigo-400" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Privasi adalah Prioritas.</h2>
                  <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    Setiap percakapan dengan Sentinel AI Assistant dienksripsi dan tidak akan pernah digunakan untuk melatih model publik. Data Anda, progres Anda, dan privasi Anda tetap aman di bawah protokol **Sentinel Gatekeeper**.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-6">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <ShieldCheck size={16} className="text-emerald-500" /> AES-256 Encryption
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <ShieldCheck size={16} className="text-emerald-500" /> Zero Data Leaks
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <ShieldCheck size={16} className="text-emerald-500" /> SSL Secured
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-7xl font-black text-white mb-10 tracking-tight leading-none">
            Siap Belajar di<br />
            <span className="gradient-text uppercase italic">Era Masa Depan?</span>
          </h2>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
            Gabung bersama ribuan siswa lainnya yang telah bertransformasi dengan bantuan Sentinel AI Assistant.
          </p>
          <div className="flex justify-center">
             <Link href="/register" className="px-16 py-6 bg-white text-black font-black text-lg rounded-[2rem] hover:bg-purple-500 hover:text-white transition-all shadow-2xl shadow-white/5 active:scale-95">
                DAFTAR SEKARANG — GRATIS
             </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer Minor */}
      <footer className="relative z-10 py-12 border-t border-white/5 px-8 flex flex-col md:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
         <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-widest uppercase">
            <Sparkles size={14} className="text-purple-500" /> MyLearning Sentinel Ecosystem
         </div>
         <div className="flex gap-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
            <Link href="/terms" className="hover:text-white transition-colors">Ketentuan</Link>
            <Link href="/privasi" className="hover:text-white transition-colors">Privasi</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
         </div>
      </footer>
    </div>
  );
}
