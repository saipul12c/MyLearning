"use client";

import { useState, useEffect } from "react";
import { getMyPromotionRequests, PromotionRequest, trackClick } from "@/lib/promotions";
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
  AlertCircle
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function AdsHistory() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Memuat histori iklan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
             <Megaphone size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Iklan & Spotlight Saya</h2>
            <p className="text-slate-500 text-xs">Monitor performa dan status kampanye promosi Anda.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white/2 border border-white/5 rounded-2xl px-4 py-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-white font-bold text-xs">{requests.filter(r => r.status === 'active').length} Aktif</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card py-16 text-center border-dashed border-white/5 bg-white/[0.01]">
            <Megaphone size={40} className="text-slate-800 mx-auto mb-4" />
            <h3 className="text-slate-400 font-bold">Belum Ada Iklan</h3>
            <p className="text-slate-600 text-xs mt-1">Gunakan tombol 'Promosi' pada daftar kursus Anda untuk memulai.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="card p-6 group hover:border-purple-500/30 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">
                       {req.location.replace("_", " ")}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 ${
                      req.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      req.status === 'waiting_verification' ? 'bg-amber-500/10 text-amber-500' :
                      req.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                       {req.status === 'waiting_verification' ? <Clock size={10} /> : <CheckCircle size={10} />}
                       {req.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-white font-bold tracking-tight">{req.title}</h4>
                    <Link href={`/courses/${req.courseId}`} className="text-purple-400 text-xs hover:text-purple-300 transition-colors inline-flex items-center gap-1 mt-1">
                       Detail Kursus <ExternalLink size={10} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="space-y-1">
                        <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Target Views</div>
                        <div className="text-white font-bold text-sm tracking-tighter">{req.targetImpressions.toLocaleString()}</div>
                     </div>
                     <div className="space-y-1">
                        <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Biaya</div>
                        <div className="text-emerald-500 font-bold text-sm tracking-tighter">{formatPrice(req.totalPrice)}</div>
                     </div>
                     <div className="space-y-1">
                        <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Durasi</div>
                        <div className="text-white font-bold text-sm tracking-tighter">{req.durationDays} Hari</div>
                     </div>
                     <div className="space-y-1">
                        <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Dibuat Pada</div>
                        <div className="text-white font-bold text-sm tracking-tighter">{new Date(req.createdAt).toLocaleDateString()}</div>
                     </div>
                  </div>
                </div>

                {/* Analytics Snapshot - Only show for Active/Completed */}
                {(req.status === 'active' || req.status === 'completed') && (
                  <div className="flex flex-col justify-center gap-3 md:pl-6 md:border-l border-white/5 min-w-[180px]">
                     <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500 flex items-center gap-1"><Eye size={12} /> Views</span>
                        <span className="text-white">{(req.currentImpressions || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500 flex items-center gap-1"><MousePointer2 size={12} /> Clicks</span>
                        <span className="text-white">{(req.currentClicks || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500 flex items-center gap-1"><BarChart3 size={12} /> CTR</span>
                        <span className="text-purple-400">
                          {req.currentImpressions && req.currentImpressions > 0 
                            ? ((req.currentClicks || 0) / req.currentImpressions * 100).toFixed(2) 
                            : "0.00"}%
                        </span>
                     </div>
                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                        <div 
                           className="h-full bg-purple-500 transition-all duration-1000"
                           style={{ width: `${Math.min(100, ((req.currentImpressions || 0) / req.targetImpressions) * 100)}%` }}
                        />
                     </div>
                  </div>
                )}
                
                {req.status === 'rejected' && req.adminNotes && (
                  <div className="md:w-64 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] leading-relaxed italic">
                     <div className="flex items-center gap-1 font-black uppercase tracking-wider mb-1"><AlertCircle size={10} /> Catatan Admin:</div>
                     "{req.adminNotes}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
