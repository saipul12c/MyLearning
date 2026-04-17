"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import {
  getAdRevenueSummary,
  getMonthlyAdRevenue,
  getTopPerformingAds,
  getAdRevenueByLocation,
} from "@/lib/promotions";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Megaphone,
  DollarSign,
  Eye,
  MousePointer2,
  TrendingUp,
  BarChart3,
  Target,
  Clock,
  Loader2,
  ChevronRight,
  MapPin,
  Activity,
  Zap,
} from "lucide-react";

export default function AdAnalyticsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topAds, setTopAds] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      setLoading(true);
      const [sum, monthly, top, byLoc] = await Promise.all([
        getAdRevenueSummary(),
        getMonthlyAdRevenue(),
        getTopPerformingAds(8),
        getAdRevenueByLocation(),
      ]);
      setSummary(sum);
      setMonthlyData(monthly);
      setTopAds(top);
      setLocationData(byLoc);
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Memuat analitik iklan...
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const maxRevenue = Math.max(...monthlyData.map((d: any) => d.revenue || 0), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-300">Analitik Iklan</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <BarChart3 size={20} className="text-emerald-400" />
            </div>
            Analitik <span className="gradient-text">Pendapatan Iklan</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Monitor performa dan revenue dari seluruh kampanye iklan platform.
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Pendapatan Iklan",
            value: formatPrice(summary?.total_revenue || 0),
            icon: DollarSign,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Kampanye Aktif",
            value: summary?.total_active_campaigns || 0,
            icon: Zap,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "Total Tayangan",
            value: (summary?.total_impressions || 0).toLocaleString(),
            icon: Eye,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
          },
          {
            label: "Rata-rata CTR",
            value: `${(summary?.average_ctr || 0).toFixed(2)}%`,
            icon: TrendingUp,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="card p-5 bg-white/[0.02] border-white/5 group hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={16} />
              </div>
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 bg-white/[0.02] border-white/5">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">
            Total Klik
          </div>
          <div className="text-xl font-black text-white">
            {(summary?.total_clicks || 0).toLocaleString()}
          </div>
        </div>
        <div className="card p-4 bg-white/[0.02] border-white/5">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">
            Selesai
          </div>
          <div className="text-xl font-black text-indigo-400">
            {summary?.total_completed_campaigns || 0}
          </div>
        </div>
        <div className="card p-4 bg-white/[0.02] border-white/5">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">
            Antrian Verifikasi
          </div>
          <div className="text-xl font-black text-amber-400">
            {summary?.total_pending_requests || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 card p-8 bg-white/[0.02] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-purple-400" />
                Pendapatan Iklan Bulanan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tren pendapatan dari kampanye iklan tahun ini
              </p>
            </div>
          </div>

          {monthlyData.length > 0 ? (
            <div className="h-56 flex items-end justify-between gap-2 px-2">
              {monthlyData.map((d: any, i: number) => {
                const height = ((d.revenue || 0) / maxRevenue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-[40px] bg-gradient-to-t from-emerald-600 to-cyan-400 rounded-lg rounded-b-none transition-all duration-700 hover:brightness-125"
                        style={{ height: `${Math.max(4, height)}%` }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                          {formatPrice(d.revenue || 0)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-400">
                      {d.month_name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center">
              <p className="text-slate-600 text-sm italic">Belum ada data pendapatan iklan.</p>
            </div>
          )}
        </div>

        {/* Revenue by Location */}
        <div className="card p-8 bg-white/[0.02] border-white/5">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MapPin size={18} className="text-cyan-400" />
            Revenue per Lokasi
          </h3>
          <div className="space-y-4">
            {locationData.length > 0 ? (
              locationData.slice(0, 8).map((loc: any, i: number) => {
                const maxLocRevenue = Math.max(...locationData.map((l: any) => l.revenue || 0), 1);
                const pct = ((loc.revenue || 0) / maxLocRevenue) * 100;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-300 truncate">
                        {(loc.location || "").replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-black text-emerald-400 ml-2 shrink-0">
                        {formatPrice(loc.revenue || 0)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-slate-600">
                        {loc.campaign_count} kampanye
                      </span>
                      <span className="text-[9px] text-slate-600">
                        {(loc.total_impressions || 0).toLocaleString()} views
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-600 text-center py-10 italic text-sm">
                Belum ada data lokasi.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Ads */}
      <div className="card p-8 bg-white/[0.02] border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-purple-400" />
            Iklan Performa Terbaik
          </h3>
          <Link
            href="/dashboard/admin/promotions"
            className="text-xs text-purple-400 font-bold hover:text-purple-300 uppercase tracking-widest flex items-center gap-1"
          >
            Kelola <ChevronRight size={12} />
          </Link>
        </div>

        {topAds.length > 0 ? (
          <div className="grid gap-3">
            {topAds.map((ad: any, i: number) => (
              <div
                key={ad.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-slate-500 group-hover:text-white transition-colors shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        ad.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {ad.is_active ? "Active" : "Done"}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                      {(ad.location || "").replace(/_/g, " ")}
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-sm truncate group-hover:text-purple-300 transition-colors">
                    {ad.title}
                  </h4>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <div className="text-white font-black text-sm">
                      {(ad.current_impressions || 0).toLocaleString()}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-black text-sm">
                      {(ad.current_clicks || 0).toLocaleString()}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-black text-sm">{ad.ctr || 0}%</div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">CTR</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Target size={40} className="text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Belum ada data performa iklan.</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/admin/ad-requests"
          className="card p-6 group hover:border-purple-500/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock size={20} className="text-amber-400" />
          </div>
          <div>
            <h4 className="text-white font-bold group-hover:text-amber-300 transition-colors">
              Antrian Verifikasi
            </h4>
            <p className="text-slate-500 text-xs">
              {summary?.total_pending_requests || 0} menunggu
            </p>
          </div>
        </Link>
        <Link
          href="/dashboard/admin/ad-archives"
          className="card p-6 group hover:border-purple-500/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Megaphone size={20} className="text-indigo-400" />
          </div>
          <div>
            <h4 className="text-white font-bold group-hover:text-indigo-300 transition-colors">
              Arsip Iklan
            </h4>
            <p className="text-slate-500 text-xs">Lihat riwayat iklan lama</p>
          </div>
        </Link>
        <Link
          href="/dashboard/admin/ad-logs"
          className="card p-6 group hover:border-purple-500/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MousePointer2 size={20} className="text-red-400" />
          </div>
          <div>
            <h4 className="text-white font-bold group-hover:text-red-300 transition-colors">
              Fraud Detection
            </h4>
            <p className="text-slate-500 text-xs">Monitor aktivitas mencurigakan</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
