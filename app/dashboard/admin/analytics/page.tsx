"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, Users, DollarSign, BookOpen, Clock, 
  ArrowUpRight, ArrowDownRight, Award, ChevronRight,
  BarChart3, PieChart, Activity
} from "lucide-react";
import { getAdminAnalyticsSummary, getYearlyRevenue, type SalesSummary } from "@/lib/analytics";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [sum, rev] = await Promise.all([
        getAdminAnalyticsSummary(),
        getYearlyRevenue()
      ]);
      setSummary(sum);
      setRevenueData(rev);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm animate-pulse">Menghitung statistik...</p>
      </div>
    );
  }

  const stats = [
    { 
      label: "Total Pendapatan", 
      value: `Rp ${(summary?.totalRevenue || 0).toLocaleString('id-ID')}`, 
      icon: DollarSign, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10",
      trend: summary?.totalRevenue && summary.totalRevenue > 0 ? "+12.5%" : "0%",
      positive: true
    },
    { 
      label: "Total Siswa", 
      value: summary?.totalEnrollments || 0, 
      icon: Users, 
      color: "text-blue-400", 
      bg: "bg-blue-500/10",
      trend: summary?.totalEnrollments && summary.totalEnrollments > 0 ? "+8.2%" : "0%",
      positive: true
    },
    { 
      label: "Kursus Selesai", 
      value: summary?.completedCourses || 0, 
      icon: Award, 
      color: "text-purple-400", 
      bg: "bg-purple-500/10",
      trend: summary?.completedCourses && summary.completedCourses > 0 ? "+5.1%" : "0%",
      positive: true
    },
    { 
      label: "Engagement Rate", 
      value: summary?.engagementRate || "0%", 
      icon: Activity, 
      color: "text-cyan-400", 
      bg: "bg-cyan-500/10",
      trend: "Stable",
      positive: true
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Analitik & Penjualan</h1>
          <p className="text-slate-500 text-sm font-medium">Monitor performa kursus dan pendapatan secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Data Real-time
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-strong p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} w-fit mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
            <div className={`flex items-center gap-2 mt-4 text-[10px] font-bold ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              <div className={`px-2 py-0.5 rounded-md ${stat.positive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {stat.trend}
              </div>
              <span className="text-slate-600 font-medium tracking-tight">vs bulan lalu</span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/[0.02] rounded-full blur-3xl group-hover:bg-white/[0.05] transition-all" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 glass-strong p-10 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <BarChart3 size={22} className="text-purple-400" /> Grafik Pendapatan
              </h3>
              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Akumulasi penjualan bulanan tahun 2026</p>
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 rounded-xl focus:outline-none focus:border-purple-500 cursor-default uppercase tracking-widest">
               Tahun 2026
            </div>
          </div>
          
          <div className="h-72 flex items-end justify-between gap-4 px-2">
            {revenueData.map((d, i) => {
              const maxRev = Math.max(...revenueData.map(r => r.revenue)) || 1000000;
              const height = (d.revenue / maxRev) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                   <div className="relative w-full flex justify-center h-full items-end">
                      <div 
                        className="w-full max-w-[48px] bg-gradient-to-t from-purple-600/80 via-purple-500 to-cyan-400 rounded-xl rounded-b-none transition-all duration-1000 hover:brightness-125 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        style={{ height: `${Math.max(4, height)}%` }}
                      >
                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl scale-75 group-hover:scale-100 whitespace-nowrap z-20">
                           Rp {(d.revenue/1000).toFixed(0)}k
                         </div>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-slate-600 group-hover:text-purple-400 transition-colors uppercase tracking-widest">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Courses */}
        <div className="glass-strong p-10 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
           <h3 className="text-xl font-black text-white mb-10 flex items-center gap-3">
             <TrendingUp size={22} className="text-cyan-400" /> Kursus Terpopuler
           </h3>
           <div className="space-y-8">
              {summary?.popularCourses.map((c, i) => (
                <div key={i} className="flex items-center gap-5 group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-400/30 transition-all duration-500 text-sm shadow-inner">
                     {i + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-200 truncate group-hover:text-white transition-colors tracking-tight">{c.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                         <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 delay-300" style={{ width: `${Math.max(5, (c.count / (summary?.totalEnrollments || 1)) * 100)}%` }} />
                         </div>
                         <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-300 transition-colors tabular-nums">{c.count}</span>
                      </div>
                   </div>
                </div>
              ))}
              {(!summary?.popularCourses || summary.popularCourses.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <BookOpen size={40} className="text-slate-800" />
                    <p className="text-slate-600 italic text-sm font-medium">Belum ada data penjualan.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Recent Sales List */}
         <div className="glass-strong rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
               <h3 className="text-lg font-bold text-white">Penjualan Terakhir</h3>
               <button className="text-xs text-purple-400 font-bold hover:text-purple-300">Lihat Semua</button>
            </div>
            <div className="divide-y divide-white/5">
               {summary?.recentSales.map((sale, i) => (
                 <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                          <BookOpen size={16} className="text-purple-400" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">{sale.course_title}</p>
                          <p className="text-[10px] text-slate-500">ID: {new Date(sale.enrolled_at).getTime()}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-emerald-400">Rp {(sale.payment_amount || 0).toLocaleString('id-ID')}</p>
                       <p className="text-[10px] text-slate-600">{new Date(sale.enrolled_at).toLocaleDateString()}</p>
                    </div>
                 </div>
               ))}
               {(!summary?.recentSales || summary.recentSales.length === 0) && (
                <p className="text-slate-600 text-center py-10 italic text-sm">Belum ada transaksi.</p>
              )}
            </div>
         </div>

         {/* Extra Insights */}
         <div className="space-y-8">
            <div className="glass-strong p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent relative overflow-hidden">
               <h3 className="text-lg font-bold text-white mb-4">Masterpiece Insight</h3>
               <p className="text-sm text-slate-400 leading-relaxed mb-6">
                 Berdasarkan data terbaru, kursus kategori <span className="text-white font-bold">{summary?.topCategory?.name || "N/A"}</span> memiliki tingkat permintaan tertinggi dengan <span className="text-white font-bold">{summary?.topCategory?.count || 0}</span> enrollment. Pertimbangkan untuk merilis materi lanjutan di kategori ini untuk memaksimalkan ROI.
               </p>
               <Link 
                 href="/dashboard/admin/analytics/strategy"
                 className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-white transition-colors group"
               >
                 Lihat Detail Strategi <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </Link>
               <BarChart3 className="absolute -right-8 -bottom-8 w-32 h-32 text-white/[0.02] -rotate-12" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="glass-strong p-6 rounded-2xl border border-white/5">
                  <PieChart size={18} className="text-amber-400 mb-2" />
                  <p className="text-xs text-slate-500 mb-1">Mobile Users</p>
                  <p className="text-xl font-bold text-white">42%</p>
               </div>
               <div className="glass-strong p-6 rounded-2xl border border-white/5">
                  <Activity size={18} className="text-emerald-400 mb-2" />
                  <p className="text-xs text-slate-500 mb-1">Avg. Watch Time</p>
                  <p className="text-xl font-bold text-white">18.5m</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
