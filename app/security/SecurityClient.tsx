"use client";

import {
  ShieldCheck,
  Lock,
  Zap,
  Eye,
  ShieldAlert,
  ChevronRight,
  Activity,
  Server,
  Globe,
  RefreshCcw,
  LayoutDashboard,
  MapPin,
  Clock,
  Megaphone,
  HeartPulse,
  GitMerge,
  Power,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useAuth } from "../components/AuthContext";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 15 }
  }
};

export default function SecurityClient() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Main Content */}

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 overflow-hidden">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
            <Zap size={12} className="animate-pulse" />
            V1.1.0 SENTINEL ADVANCEMENTS
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight leading-[1.1]">
            Perlindungan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">Tanpa Henti</span><br />
            Untuk Pengalaman Belajar Anda.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            Sentinel Gatekeeper adalah sistem keamanan berlapis yang dirancang untuk menjaga integritas platform dan privasi data Anda dari segala ancaman siber.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
              Mulai Belajar Sekarang
            </Link>
            <button className="px-10 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-2xl transition-all">
              Pelajari Protokol Kami
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Security Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-24 max-w-4xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <motion.div 
            whileHover={{ y: -5 }}
            className="relative bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-2xl"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: ShieldCheck, label: "Verifikasi Berlapis", value: "Aktiv" },
                { icon: Lock, label: "Data Enkripsi", value: "AES-256" },
                { icon: Activity, label: "Trafik Monitor", value: "Real-time" },
                { icon: Server, label: "Cloud Core", value: "Edge" }
              ].map((stat, i) => (
                <div key={i} className="text-center md:text-left">
                  <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <stat.icon className="text-indigo-400 w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-white font-black text-xl">{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>
      
      {/* AI Assistant Section */}
      <section className="relative z-10 py-12 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/10 rounded-[3rem] p-8 md:p-16 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
               <Sparkles size={120} className="text-indigo-400" />
            </div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-6">
                   <Sparkles size={12} />
                   AI-Powered Intelligence
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                  Sentinel <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">AI Assistant</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8 text-left">
                  Kecerdasan buatan canggih yang dirancang khusus untuk mendampingi perjalanan belajar Anda. Tidak hanya memberikan jawaban instan, tetapi juga memastikan setiap interaksi Anda aman, privat, dan sesuai dengan protokol keamanan kami.
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    "Dukungan Teknis 24/7",
                    "Pencarian Materi Pintar",
                    "Privasi Data Terjamin",
                    "Enkripsi Interaksi"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <ShieldCheck size={14} className="text-indigo-400" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative hidden md:flex justify-center">
                <div className="aspect-square w-64 h-64 rounded-full bg-indigo-500/5 border border-white/5 flex items-center justify-center p-8 animate-pulse">
                  <div className="w-full h-full rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                     <div className="relative">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Sparkles className="w-24 h-24 text-indigo-400" />
                        </motion.div>
                        <div className="absolute inset-0 blur-2xl bg-indigo-500/30 -z-10" />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Detail */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Bagaimana Sentinel Menjaga Anda?</h2>
              <p className="text-slate-400 leading-relaxed">
                Teknologi yang tidak terlihat adalah perlindungan terbaik. Sentinel bekerja di balik layar untuk memastikan Anda dapat fokus belajar tanpa distraksi.
              </p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-8 hidden md:block"></div>
            <div className="text-right">
              <span className="text-indigo-400 font-mono text-sm tracking-tighter uppercase font-bold">Protocol v1.1.0 - Secure Connection</span>
            </div>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Geo-Fencing Architecture",
                desc: "Membatasi akses platform berdasarkan wilayah geografis untuk memitigasi serangan regional dan mematuhi regulasi lokal secara dinamis.",
                icon: MapPin,
                color: "from-emerald-500/20 to-emerald-600/5"
              },
              {
                title: "Adaptive Traffic Filtering",
                desc: "Sistem kami secara cerdas membedakan antara aktivitas belajar yang normal dan percobaan akses yang mencurigakan.",
                icon: ShieldAlert,
                color: "from-blue-500/20 to-blue-600/5"
              },
              {
                title: "Intelligent Verification",
                desc: "Jika sistem mendeteksi anomali, Sentinel akan meminta verifikasi cepat untuk memastikan identitas Anda tetap aman.",
                icon: Eye,
                color: "from-indigo-500/20 to-indigo-600/5"
              },
              {
                title: "Adaptive QoS Engine",
                desc: "Alokasi bandwidth dan rate limiting cerdas berdasarkan Tier pengguna, memastikan performa maksimal bagi member prioritas.",
                icon: Activity,
                color: "from-blue-500/20 to-blue-600/5"
              },
              {
                title: "Real-time Broadcaster",
                desc: "Sistem pengumuman instan yang terintegrasi langsung dengan kill-switch modul, memberikan transparansi status layanan tanpa reload.",
                icon: Megaphone,
                color: "from-indigo-500/20 to-indigo-600/5"
              },
              {
                title: "Ephemeral Features",
                desc: "Fitur yang dapat dijadwalkan untuk aktif dan mati secara otomatis (Auto-expiry), ideal untuk event terbatas dan beta testing.",
                icon: Clock,
                color: "from-purple-500/20 to-purple-600/5"
              },
              {
                title: "Resilient Infrastructure",
                desc: "Arsitektur Edge Computing kami memastikan website tetap ringan dan responsif meskipun sedang dalam pemeliharaan.",
                icon: RefreshCcw,
                color: "from-slate-500/20 to-slate-600/5"
              },
              {
                title: "Threat Intelligence",
                desc: "Sistem Auto-Lockdown yang secara otomatis memblokir IP mencurigakan setelah 5 percobaan akses ilegal untuk mencegah Brute Force.",
                icon: ShieldCheck,
                color: "from-red-500/20 to-red-600/5"
              },
              {
                title: "Sentinel Challenge",
                desc: "Lapisan verifikasi manual menggunakan Access Key rahasia untuk memastikan hanya personel terverifikasi yang bisa menembus proteksi DDoS.",
                icon: Lock,
                color: "from-amber-500/20 to-amber-600/5"
              },
              {
                title: "Autonomous Self-Healing",
                desc: "Sentinel memantau kesehatan modul secara mandiri. Jika terdeteksi anomali berulang (error threshold), sistem akan menonaktifkan fitur tersebut secara otomatis.",
                icon: HeartPulse,
                color: "from-pink-500/20 to-pink-600/5"
              },
              {
                title: "Intelligent Governance",
                desc: "Mengelola ketergantungan antar fitur secara cerdas. Memastikan seluruh ekosistem platform berjalan harmonis dengan validasi integritas dependensi otomatis.",
                icon: GitMerge,
                color: "from-cyan-500/20 to-cyan-600/5"
              },
              {
                title: "Sentinel AI Assistant",
                desc: "Asisten cerdas terintegrasi yang siap membantu navigasi, menjawab pertanyaan materi, dan memberikan dukungan teknis instan secara aman dan privat.",
                icon: Sparkles,
                color: "from-purple-500/20 to-purple-600/5"
              },
              {
                title: "Granular Kill-Switches",
                desc: "Kontrol mutlak atas modul kritis seperti Pembayaran, Autentikasi, dan Upload. Admin dapat mengunci fungsi spesifik secara instan tanpa mengganggu modul lainnya.",
                icon: Power,
                color: "from-orange-500/20 to-orange-600/5"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 transition-colors duration-500 flex flex-col h-full"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="text-indigo-400 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
                  {feature.desc}
                </p>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest cursor-pointer group-hover:gap-4 transition-all mt-auto">
                  Pelajari Lebih Lanjut <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="relative z-10 py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="relative inline-block">
            <div className="absolute -top-12 -left-12 text-indigo-500/10 text-9xl font-serif">“</div>
            <h3 className="text-2xl md:text-4xl font-medium text-slate-300 leading-relaxed italic relative z-10">
              "Privasi bukan sebuah pilihan, melainkan sebuah hak fundamental. Dengan Sentinel Gatekeeper, kami memastikan hak tersebut tetap terjaga di setiap klik yang Anda lakukan."
            </h3>
            <div className="absolute -bottom-16 -right-12 text-indigo-500/10 text-9xl font-serif">”</div>
          </div>
          <div className="mt-12 flex flex-col items-center">
            <div className="w-12 h-px bg-indigo-500/30 mb-6" />
            <div className="text-white font-bold tracking-widest uppercase text-xs">Tim Keamanan Platform</div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
