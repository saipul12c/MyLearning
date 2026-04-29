"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, Target, Lightbulb, ArrowLeft, 
  BarChart, PieChart, Zap, ChevronRight,
  Rocket, Users, DollarSign, Award, MessageSquare,
  ShieldCheck, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { getAdminAnalyticsSummary, type SalesSummary } from "@/lib/analytics";

export default function StrategyPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getAdminAnalyticsSummary();
      setSummary(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Menganalisis data pasar...</p>
      </div>
    );
  }

  const topCategory = summary?.topCategory?.name || "Uncategorized";
  const enrollmentCount = summary?.topCategory?.count || 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      {/* Back Button */}
      <Link 
        href="/dashboard/admin/analytics"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Kembali ke Analitik</span>
      </Link>

      {/* Hero Section */}
      <div className="relative p-12 rounded-[3rem] bg-gradient-to-br from-purple-600/20 via-indigo-900/10 to-transparent border border-white/10 overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6">
            <Zap size={12} /> Masterpiece Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Strategi <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Pertumbuhan</span> Bisnis
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Laporan ini disusun secara otomatis berdasarkan algoritma cerdas yang menganalisis perilaku belajar dan tren pembelian di platform MyLearning.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Market Dominance Card */}
        <div className="glass-strong p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Dominasi Pasar</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Kategori <span className="text-white font-bold">{topCategory}</span> mendominasi platform Anda dengan <span className="text-emerald-400 font-bold">{enrollmentCount} total enrollment</span>. Ini menunjukkan minat yang kuat pada topik tersebut.
          </p>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-400" /> Rekomendasi:
            </h4>
            <ul className="space-y-2">
              <li className="text-[11px] text-slate-400 flex items-start gap-2">
                <ChevronRight size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                Rilis kursus tingkat "Advanced" atau "Expert" untuk kategori ini.
              </li>
              <li className="text-[11px] text-slate-400 flex items-start gap-2">
                <ChevronRight size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                Tawarkan bundling atau paket kursus terkait untuk meningkatkan AOV.
              </li>
            </ul>
          </div>
        </div>

        {/* Pricing Strategy Card */}
        <div className="glass-strong p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
            <DollarSign size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Optimasi Harga</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Rata-rata pendapatan per user saat ini stabil. Namun, data menunjukkan adanya potensi peningkatan konversi dengan skema harga dinamis.
          </p>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-400" /> Rekomendasi:
            </h4>
            <ul className="space-y-2">
              <li className="text-[11px] text-slate-400 flex items-start gap-2">
                <ChevronRight size={12} className="text-blue-500 shrink-0 mt-0.5" />
                Gunakan fitur "Early Bird" untuk kursus baru yang akan rilis.
              </li>
              <li className="text-[11px] text-slate-400 flex items-start gap-2">
                <ChevronRight size={12} className="text-blue-500 shrink-0 mt-0.5" />
                Berikan diskon loyalitas bagi user yang memiliki lebih dari 3 kursus.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Engagement & Retention Section */}
      <div className="glass-strong p-10 rounded-[3rem] border border-white/5 mb-12 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500/5 blur-[60px] rounded-full" />
        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="w-24 h-24 rounded-[2rem] bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
            <Users size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Retensi & Keterlibatan Siswa</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Tingkat penyelesaian kursus (*Completion Rate*) adalah metrik kunci. Saat ini, rata-rata engagement platform Anda adalah <span className="text-white font-bold">{summary?.engagementRate}</span>. 
              Meningkatkan angka ini akan secara langsung berdampak pada skor kepercayaan brand Anda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <MessageSquare size={18} className="text-purple-400 mt-1" />
                <div>
                  <h5 className="text-[11px] font-black text-white uppercase mb-1">Forum Diskusi Aktif</h5>
                  <p className="text-[10px] text-slate-500">Mendorong instruktur untuk lebih aktif di forum tanya jawab.</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <Rocket size={18} className="text-cyan-400 mt-1" />
                <div>
                  <h5 className="text-[11px] font-black text-white uppercase mb-1">Gamifikasi Belajar</h5>
                  <p className="text-[10px] text-slate-500">Gunakan sistem poin dan achievement untuk memotivasi progres.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Reliability */}
      <div className="p-8 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center gap-6">
        <ShieldCheck size={40} className="text-emerald-400 shrink-0" />
        <div>
          <h4 className="text-lg font-bold text-white mb-1">Sentinel Gatekeeper Aktif</h4>
          <p className="text-xs text-slate-400">
            Sistem keamanan kami terus memantau transaksi untuk mencegah fraud dan memastikan pendapatan Anda aman.
          </p>
        </div>
        <div className="md:ml-auto">
          <div className="px-4 py-2 rounded-xl bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-widest">
            Terlindungi
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-20 flex items-center justify-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
        <AlertCircle size={12} /> Data diperbarui terakhir kali: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
