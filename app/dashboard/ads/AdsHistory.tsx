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
  Plus
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function AdsHistory() {
  const { user } = useAuth();
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
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-pulse"></div>
          <Loader2 className="animate-spin text-purple-500 relative z-10" size={32} />
        </div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Memuat histori iklan...</p>
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(124,58,237,0.1)]">
             <Megaphone className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-white font-black text-xl tracking-tight">Iklan & Spotlight</h2>
            <p className="text-slate-400 text-xs font-medium">Monitor performa dan status kampanye promosi Anda.</p>
          </div>
        </div>
        <div className="flex gap-2">
            <Link href="/dashboard/courses" className="btn-primary text-xs !py-2.5 px-5 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
                <Plus size={14} /> Buat Iklan Baru
            </Link>
        </div>
      </div>

      {/* Summary Stats Container */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="card p-4 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <TrendingUp size={14} />
               </div>
               <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Iklan Aktif</span>
            </div>
            <div className="text-2xl font-black text-white">{activeCount}</div>
         </div>
         <div className="card p-4 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Eye size={14} />
               </div>
               <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Total Views</span>
            </div>
            <div className="text-2xl font-black text-white">{totalImpressions.toLocaleString()}</div>
         </div>
         <div className="card p-4 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <BarChart3 size={14} />
               </div>
               <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Avg CTR</span>
            </div>
            <div className="text-2xl font-black text-purple-300">{avgCtr}%</div>
         </div>
         <div className="card p-4 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <AlertCircle size={14} />
               </div>
               <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Total Spend</span>
            </div>
            <div className="text-xl font-black text-white">{formatPrice(totalSpend)}</div>
         </div>
      </div>

      <div className="flex items-center gap-3 border-b border-white/5 pb-4 overflow-x-auto">
         <Filter size={14} className="text-slate-500 flex-shrink-0" />
         {['all', 'active', 'waiting_verification', 'completed', 'rejected'].map(status => (
            <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  statusFilter === status ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'
               }`}
            >
               {status === 'all' ? 'Semua' : status === 'waiting_verification' ? 'Pending' : status}
            </button>
         ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="card py-16 text-center border-dashed border-white/5 bg-white/[0.01]">
            <Megaphone size={40} className="text-slate-800 mx-auto mb-4" />
            <h3 className="text-slate-400 font-bold">Belum Ada Iklan</h3>
            <p className="text-slate-600 text-xs mt-1">Status ini kosong, coba filter yang lain atau buat iklan baru.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => {
            const progress = req.targetImpressions > 0 ? Math.min(100, ((req.currentImpressions || 0) / req.targetImpressions) * 100) : 0;
            return (
              <div key={req.id} className="card p-6 group hover:border-purple-500/30 transition-all block">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest border border-white/10">
                         {req.location.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 border ${
                        req.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        req.status === 'waiting_verification' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        req.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                         {req.status === 'waiting_verification' ? <Clock size={10} /> : req.status === 'rejected' ? <XCircle size={10} /> : <CheckCircle size={10} />}
                         {req.status === 'waiting_verification' ? 'Pending' : req.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-white font-bold tracking-tight text-lg group-hover:text-purple-300 transition-colors">{req.title}</h4>
                      <Link href={`/courses/${req.courseId}`} className="text-purple-400 text-[10px] font-bold uppercase tracking-widest hover:text-purple-300 transition-colors flex items-center gap-1 mt-2 w-fit">
                         Detail Kursus <ChevronRight size={12} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                       <div className="space-y-1">
                          <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Target Views</div>
                          <div className="text-white font-bold text-sm tracking-tighter">{req.targetImpressions.toLocaleString()}</div>
                       </div>
                       <div className="space-y-1">
                          <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Biaya</div>
                          <div className="text-emerald-400 font-bold text-sm tracking-tighter">{formatPrice(req.totalPrice)}</div>
                       </div>
                       <div className="space-y-1">
                          <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Durasi</div>
                          <div className="text-white font-bold text-sm tracking-tighter">{req.durationDays} Hari</div>
                       </div>
                       <div className="space-y-1">
                          <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Dibuat Pada</div>
                          <div className="text-white font-bold text-sm tracking-tighter">{new Date(req.createdAt).toLocaleDateString('id-ID')}</div>
                       </div>
                    </div>
                  </div>

                  {/* Analytics Snapshot - Only show for Active/Completed */}
                  {(req.status === 'active' || req.status === 'completed') && (
                    <div className="flex flex-col justify-center gap-3 md:pl-6 md:border-l border-white/5 min-w-[200px] shrink-0">
                       <div className="flex items-center w-full mb-2">
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress</div>
                          <div className={`ml-auto text-[10px] font-black ${progress >= 100 ? 'text-emerald-400' : 'text-purple-400'}`}>{progress.toFixed(0)}%</div>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                          <div 
                             className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`}
                             style={{ width: `${progress}%` }}
                          />
                       </div>
                       
                       <div className="flex items-center justify-between text-[10px] font-bold p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-slate-400 flex items-center gap-1.5"><Eye size={12} className="text-cyan-400" /> Views</span>
                          <span className="text-white">{(req.currentImpressions || 0).toLocaleString()}</span>
                       </div>
                       <div className="flex items-center justify-between text-[10px] font-bold p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-slate-400 flex items-center gap-1.5"><MousePointer2 size={12} className="text-emerald-400" /> Clicks</span>
                          <span className="text-white">{(req.currentClicks || 0).toLocaleString()}</span>
                       </div>
                       <div className="flex items-center justify-between text-[10px] font-bold p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-slate-400 flex items-center gap-1.5"><BarChart3 size={12} className="text-purple-400" /> CTR</span>
                          <span className="text-purple-300">
                            {req.currentImpressions && req.currentImpressions > 0 
                              ? ((req.currentClicks || 0) / req.currentImpressions * 100).toFixed(2) 
                              : "0.00"}%
                          </span>
                       </div>
                    </div>
                  )}
                  
                  {req.status === 'rejected' && req.adminNotes && (
                    <div className="md:w-64 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed flex flex-col justify-center">
                       <div className="flex items-center gap-1.5 font-black uppercase tracking-wider mb-2 text-[10px]"><AlertCircle size={12} /> Catatan Admin</div>
                       "{req.adminNotes}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
