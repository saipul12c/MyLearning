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
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

export default function SecurityReleasePage() {
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

      {/* Navigation Bar (Ghost Style) */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center group-hover:border-indigo-400/50 transition-all">
            <ShieldCheck className="text-indigo-400 w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Sentinel <span className="text-indigo-400">Gatekeeper</span></span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            System Status: Active
          </div>
          
          {user ? (
            <Link 
              href={user.role === 'admin' ? "/dashboard/admin/sentinel" : "/dashboard"} 
              className="flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors group"
            >
              <LayoutDashboard size={16} className="group-hover:rotate-12 transition-transform" />
              <span>{user.role === 'admin' ? "Admin Console" : "Dashboard"}</span>
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap size={12} className="animate-pulse" />
            V1.3.0 SECURITY UPGRADE
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Perlindungan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">Tanpa Henti</span><br />
            Untuk Pengalaman Belajar Anda.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Sentinel Gatekeeper adalah sistem keamanan berlapis yang dirancang untuk menjaga integritas platform dan privasi data Anda dari segala ancaman siber.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Link href="/register" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
              Mulai Belajar Sekarang
            </Link>
            <button className="px-10 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-2xl transition-all">
              Pelajari Protokol Kami
            </button>
          </div>
        </div>

        {/* Floating Security Badge */}
        <div className="mt-24 max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-2xl">
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
          </div>
        </div>
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
              <span className="text-indigo-400 font-mono text-sm tracking-tighter uppercase font-bold">Protocol v1.3 - Secure Connection</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
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
                title: "Resilient Infrastructure",
                desc: "Arsitektur Edge Computing kami memastikan website tetap ringan dan responsif meskipun sedang dalam pemeliharaan.",
                icon: RefreshCcw,
                color: "from-purple-500/20 to-purple-600/5"
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 transition-all duration-500">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="text-indigo-400 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {feature.desc}
                </p>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest cursor-pointer group-hover:gap-4 transition-all">
                  Pelajari Lebih Lanjut <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          <div>© 2026 MyLearning. All rights reserved.</div>
          <div className="flex gap-8">
            <Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
            <Link href="/privasi" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-500/50" />
            SECURED BY SENTINEL CORE
          </div>
        </div>
      </footer>
    </div>
  );
}
