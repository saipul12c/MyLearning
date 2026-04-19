"use client";

import { useState, useEffect } from "react";
import { getMyPromotionRequests, PromotionRequest } from "@/lib/promotions";
import { useAuth } from "@/app/components/AuthContext";
import { 
  Megaphone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MousePointer2, 
  BarChart3,
  Loader2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Filter,
  Plus,
  CreditCard
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdsHistory() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) fetchMyAds();
  }, [user]);

  const fetchMyAds = async () => {
    setLoading(true);
    const data = await getMyPromotionRequests(user!.id);
    setRequests(data);
    setLoading(false);
  };

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="relative">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-spin"></div>
          <Loader2 className="animate-spin text-purple-500 relative z-10" size={32} />
        </div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Memperbarui Metrik Iklan...</p>
      </div>
    );
  }

  // Summary logic
  const activeCount = requests.filter(r => r.status === 'active').length;
  const totalImpressions = requests.reduce((sum, r) => sum + (r.currentImpressions || 0), 0);
  const totalClicks = requests.reduce((sum, r) => sum + (r.currentClicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const totalSpend = requests.reduce((sum, r) => sum + r.totalPrice, 0);

  const filteredRequests = requests.filter(r => statusFilter === 'all' || r.status === statusFilter);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header & Stats Container */}
      <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-purple-950/20 to-black/40 p-8 md:p-12 mb-6">
        <div className="absolute top-0 right-0 -m-12 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -m-12 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-900/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                 <Megaphone className="text-white drop-shadow-lg" size={30} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">Pusat Promosi</h2>
                <p className="text-slate-400 text-sm font-medium opacity-80">Pantau ROI dan jangkauan audiens Anda secara real-time.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
               <button 
                  onClick={() => router.push('/dashboard/ads/create?mode=custom')}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Plus size={16} /> Iklan Kustom
               </button>
               <button 
                  onClick={() => router.push('/dashboard/ads/create?mode=course')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-900/20 hover:shadow-purple-700/40 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Megaphone size={16} /> Promosi Kursus
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { icon: <TrendingUp size={20} />, label: "Aktif", value: activeCount, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: <Eye size={20} />, label: "Views", value: totalImpressions.toLocaleString(), color: "text-cyan-400", bg: "bg-cyan-500/10" },
              { icon: <MousePointer2 size={20} />, label: "CTR %", value: `${avgCtr}%`, color: "text-purple-400", bg: "bg-purple-500/10" },
              { icon: <AlertCircle size={20} />, label: "Investasi", value: formatPrice(totalSpend), color: "text-amber-400", bg: "bg-amber-500/10" }
            ].map((stat, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-white/[0.02] rounded-[2rem] border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{stat.label}</div>
                    <div className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-4 sm:pb-0 hide-scrollbar">
           {['all', 'active', 'waiting_verification', 'completed', 'rejected'].map(status => (
              <button
                 key={status}
                 onClick={() => setStatusFilter(status)}
                 className={`group relative text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all whitespace-nowrap overflow-hidden ${
                    statusFilter === status 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10'
                 }`}
              >
                 {statusFilter === status && (
                   <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 animate-in fade-in zoom-in-95 duration-300" />
                 )}
                 <span className="relative z-10">{status === 'all' ? 'Semua Status' : status === 'waiting_verification' ? 'Pending' : status}</span>
              </button>
           ))}
        </div>
        
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 rounded-full border border-white/5">
           <Filter size={12} /> Ditemukan {filteredRequests.length} Kampanye
        </div>
      </div>

      {/* Results Grid */}
      {filteredRequests.length === 0 ? (
        <div className="py-24 text-center rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01]">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
               <Megaphone size={40} className="text-slate-700" />
            </div>
            <h3 className="text-white font-black text-xl tracking-tight">Belum Ada Riwayat Iklan</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Mulai promosikan kursus Anda sekarang untuk menjangkau jutaan pelajar aktif di MyLearning.</p>
             <button 
               onClick={() => router.push('/dashboard/ads/create?mode=course')}
               className="mt-8 bg-white text-black px-10 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
               Buat Iklan Pertama
            </button>
        </div>
      ) : (
        <div className="grid gap-6 px-2">
          {filteredRequests.map((req) => {
            const impressions = req.currentImpressions || 0;
            const target = req.targetImpressions || 1000;
            const progress = Math.min(100, (impressions / target) * 100);
            
            return (
              <div key={req.id} className="group relative">
                {/* Glow Effect on Hover */}
                <div className="absolute inset-x-4 -top-4 -bottom-4 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.03] group-hover:bg-white/[0.05] group-hover:border-white/20 transition-all duration-500 p-8 md:p-10">
                  <div className="grid lg:grid-cols-4 gap-12 items-center">
                    
                    {/* Visual & Identity */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                           {req.location.replace(/_/g, " ")}
                        </div>
                        <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border flex items-center gap-2 ${
                          req.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' :
                          req.status === 'waiting_verification' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          req.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'active' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-current'}`} />
                          {req.status === 'waiting_verification' ? 'Proses Verifikasi' : req.status === 'active' ? 'Sedang Tayang' : req.status}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-black text-2xl tracking-tight mb-3 group-hover:text-purple-300 transition-colors duration-500">{req.title}</h4>
                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed opacity-80 mb-4">{req.description}</p>
                        
                        {req.courseId && (
                           <Link href={`/courses/${req.courseId}`} className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors">
                              Lihat Detail Penempatan <ExternalLink size={14} />
                           </Link>
                        )}
                      </div>
                    </div>

                    {/* Stats & Finance */}
                    <div className="lg:col-span-2 grid sm:grid-cols-2 gap-8 items-center md:pl-8 md:border-l border-white/5">
                       <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ROI Pengiklan</span>
                            <span className="text-[10px] font-black text-white px-2 py-0.5 rounded bg-white/5 border border-white/5">METRIK UTAMA</span>
                          </div>
                          
                          <div className="space-y-4">
                             {[
                               { label: "Views", value: impressions.toLocaleString(), target: target.toLocaleString(), icon: <Eye size={12} />, color: "text-cyan-400" },
                               { label: "Klik", value: (req.currentClicks || 0).toLocaleString(), target: "∞", icon: <MousePointer2 size={12} />, color: "text-emerald-400" },
                               { label: "Budget", value: formatPrice(req.totalPrice), target: `${req.durationDays} Hari`, icon: <CreditCard size={12} />, color: "text-amber-400" }
                             ].map((m, i) => (
                               <div key={i} className="flex items-center gap-4 group/stat">
                                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${m.color} transition-all duration-300 group-hover/stat:scale-110`}>
                                     {m.icon}
                                  </div>
                                  <div>
                                     <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 leading-none mb-1">{m.label}</div>
                                     <div className="flex items-baseline gap-2">
                                        <span className={`text-sm font-black text-white tracking-tight`}>{m.value}</span>
                                        <span className="text-[9px] font-bold text-slate-600">/ {m.target}</span>
                                     </div>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-6">
                         <div className="relative aspect-square max-w-[140px] mx-auto hidden sm:block">
                            {/* Radial Progress */}
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                               <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                               <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} strokeLinecap="round" className={`${progress >= 100 ? 'text-emerald-500' : 'text-purple-500'} drop-shadow-[0_0_8px_currentColor] transition-all duration-1000 ease-out`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                               <div className="text-2xl font-black text-white leading-none">{progress.toFixed(0)}%</div>
                               <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Selesai</div>
                            </div>
                         </div>
                         
                         <div className="sm:hidden space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                               <span className="text-slate-500">Pencapaian</span>
                               <span className="text-white">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className={`h-full ${progress >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`} style={{ width: `${progress}%` }} />
                            </div>
                         </div>

                         {req.status === 'rejected' && req.adminNotes && (
                           <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-medium leading-relaxed">
                              <div className="font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 text-xs"><AlertCircle size={14} /> Alasan Penolakan</div>
                              "{req.adminNotes}"
                           </div>
                         )}
                         
                         <Link 
                            href={req.linkUrl} 
                            target="_blank"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                         >
                            Uji Cipta Iklan <ChevronRight size={14} />
                         </Link>
                       </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
