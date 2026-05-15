"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Activity } from "lucide-react";
import { getSignedSentinelToken } from "@/app/actions/sentinel";

export default function SecurityCheckPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Menganalisis trafik browser...");

  const [accessKey, setAccessKey] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsDone(true);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    const stages = [
      { p: 20, s: "Memverifikasi identitas browser..." },
      { p: 50, s: "Mengecek integritas koneksi..." },
      { p: 80, s: "Menyiapkan sesi aman..." },
      { p: 100, s: "Analisis Selesai. Masukkan Kunci Akses." },
    ];

    const statusTimer = setInterval(() => {
      const currentStage = stages.find(s => progress <= s.p);
      if (currentStage) setStatus(currentStage.s);
    }, 80);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [progress]);

  const handleEntry = async () => {
    if (!accessKey) return;
    setStatus("Memvalidasi kunci...");
    setError(null);
    
    try {
      const token = await getSignedSentinelToken(accessKey);
      document.cookie = "sentinel_verified=" + token + "; path=/; max-age=1800; SameSite=Strict; Secure";
      setStatus("Akses diberikan! Mengalihkan...");
      
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get('from') || '/';
      
      setTimeout(() => {
        router.refresh();
        router.push(from);
      }, 800);
    } catch (err: any) {
      console.error("Failed to get security token", err);
      setError("Kunci Sentinel Salah atau Tidak Valid.");
      setStatus("Validasi Gagal.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="max-w-md w-full space-y-8 text-center relative">
        {/* Background Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-700" />

        {/* Icon Header */}
        <div className="relative inline-block group">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
            <ShieldCheck className="w-16 h-16 text-indigo-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-800 p-2 rounded-xl shadow-lg">
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Sentinel <span className="text-indigo-400">Gatekeeper</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            Sistem kami mendeteksi aktivitas trafik yang tidak biasa. Mohon selesaikan verifikasi kunci untuk melanjutkan.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-6 pt-4">
          {!isDone ? (
            <div className="w-full bg-slate-900/50 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-300 ease-out relative shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-4">
              <div className="relative group">
                <input 
                  type="password"
                  placeholder="Masukkan Kunci Sentinel..."
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEntry()}
                  className={`w-full bg-slate-900 border ${error ? 'border-red-500/50' : 'border-slate-800'} focus:border-indigo-500 rounded-2xl px-6 py-4 text-white outline-none transition-all text-center tracking-[0.3em] font-mono`}
                />
                {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-2">{error}</p>}
              </div>
              <button 
                onClick={handleEntry}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all"
              >
                Verifikasi & Masuk
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-widest">
            <Activity className="w-3 h-3 animate-bounce" />
            <span>{status}</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-12 flex flex-col items-center gap-4">
          <div className="h-px w-12 bg-slate-800" />
          <p className="text-[10px] text-slate-600 font-mono tracking-tighter">
            DDoS PROTECTION BY SENTINEL v1.1.0
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
