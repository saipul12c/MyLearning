"use client";

import { AlertOctagon, RefreshCcw, Globe, Shield } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
      
      <div className="max-w-2xl w-full relative z-10">
        <div className="glass-strong rounded-[3rem] p-12 md:p-16 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] text-center">
          <div className="relative inline-block mb-10">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 relative z-10">
              <AlertOctagon size={48} />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Maintenance</span>
          </h1>
          
          <p className="text-slate-400 text-lg mb-12 leading-relaxed max-w-md mx-auto">
            Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman belajar yang lebih aman dan stabil. Kami akan segera kembali online.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Shield, label: "Keamanan", desc: "Verifikasi Data" },
              { icon: RefreshCcw, label: "Sistem", desc: "Update Engine" },
              { icon: Globe, label: "Jaringan", desc: "Optimasi Rute" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <item.icon size={20} className="text-slate-500 mx-auto mb-2" />
                <div className="text-white text-sm font-bold">{item.label}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-6 mt-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              Sentinel Protocol: ACTIVE_MAINTENANCE
            </div>

            <a 
              href="/security-check" 
              className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em] hover:text-blue-500/50 transition-colors"
            >
              Admin Entry
            </a>
          </div>
        </div>

        <p className="text-center mt-10 text-slate-600 text-sm font-medium">
          &copy; {new Date().getFullYear()} MyLearning. All rights reserved.
        </p>

      </div>
    </div>
  );
}
