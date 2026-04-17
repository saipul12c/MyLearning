"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { getArchivedPromotions } from "@/lib/promotions";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  Eye,
  MousePointer2,
  Loader2,
  Target,
  Calendar,
  MapPin,
  TrendingUp,
} from "lucide-react";

export default function AdArchivesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      setLoading(true);
      const data = await getArchivedPromotions(100);
      setArchives(data);
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Memuat arsip iklan...
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-300">Arsip Iklan</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <Archive size={20} className="text-indigo-400" />
            </div>
            Arsip <span className="gradient-text">Iklan Lama</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Riwayat iklan yang telah selesai atau dinonaktifkan lebih dari 3 bulan.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="group text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-white/[0.02] border-white/5">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Diarsipkan</div>
          <div className="text-2xl font-black text-white">{archives.length}</div>
        </div>
        <div className="card p-4 bg-white/[0.02] border-white/5">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Pendapatan</div>
          <div className="text-xl font-black text-emerald-400">
            {formatPrice(archives.reduce((sum: number, a: any) => sum + (a.total_price || 0), 0))}
          </div>
        </div>
        <div className="card p-4 bg-white/[0.02] border-white/5">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Tayangan</div>
          <div className="text-xl font-black text-cyan-400">
            {archives.reduce((sum: number, a: any) => sum + (a.current_impressions || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="card p-4 bg-white/[0.02] border-white/5">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Klik</div>
          <div className="text-xl font-black text-purple-400">
            {archives.reduce((sum: number, a: any) => sum + (a.current_clicks || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Archive List */}
      {archives.length === 0 ? (
        <div className="card py-20 text-center border-dashed border-white/5">
          <Archive size={48} className="text-slate-800 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg">Tidak Ada Arsip</h3>
          <p className="text-slate-500 text-sm mt-2">
            Iklan yang telah nonaktif lebih dari 3 bulan akan otomatis masuk ke arsip.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {archives.map((archive: any) => {
            const ctr = archive.current_impressions > 0
              ? ((archive.current_clicks / archive.current_impressions) * 100).toFixed(2)
              : "0.00";
            return (
              <div
                key={archive.id}
                className="card p-5 bg-white/[0.02] border-white/5 hover:border-indigo-500/20 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/20">
                        Diarsipkan
                      </span>
                      <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                        <MapPin size={8} /> {(archive.location || "").replace(/_/g, " ")}
                      </span>
                    </div>
                    <h4 className="text-white font-bold truncate">{archive.title || "Iklan Tanpa Judul"}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      {archive.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(archive.start_date).toLocaleDateString("id-ID")} - {archive.end_date ? new Date(archive.end_date).toLocaleDateString("id-ID") : "∞"}
                        </span>
                      )}
                      {archive.archived_at && (
                        <span className="flex items-center gap-1 text-indigo-400/60">
                          <Archive size={10} />
                          Diarsipkan: {new Date(archive.archived_at).toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 md:pl-6">
                    <div className="text-center">
                      <div className="text-white font-black text-sm flex items-center gap-1">
                        <Eye size={12} className="text-cyan-400" />
                        {(archive.current_impressions || 0).toLocaleString()}
                      </div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-black text-sm flex items-center gap-1">
                        <MousePointer2 size={12} className="text-emerald-400" />
                        {(archive.current_clicks || 0).toLocaleString()}
                      </div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-black text-sm flex items-center gap-1">
                        <TrendingUp size={12} />
                        {ctr}%
                      </div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold">CTR</div>
                    </div>
                    {archive.total_price > 0 && (
                      <div className="text-center">
                        <div className="text-emerald-400 font-black text-sm">{formatPrice(archive.total_price)}</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold">Revenue</div>
                      </div>
                    )}
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
