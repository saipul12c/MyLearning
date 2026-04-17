"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { getImpressionLogs, getSuspiciousAdActivity } from "@/lib/promotions";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Eye,
  Loader2,
  Globe,
  User,
  Clock,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";

export default function AdLogsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"logs" | "fraud">("fraud");
  const [threshold, setThreshold] = useState(50);
  const [searchIp, setSearchIp] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [logsData, suspData] = await Promise.all([
      getImpressionLogs(undefined, 200),
      getSuspiciousAdActivity(threshold),
    ]);
    setLogs(logsData);
    setSuspicious(suspData);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Memuat log impresi...
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const filteredLogs = searchIp
    ? logs.filter((l: any) => l.ip_address?.includes(searchIp) || l.promo_title?.toLowerCase().includes(searchIp.toLowerCase()))
    : logs;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-300">Fraud Detection</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <Shield size={20} className="text-red-400" />
            </div>
            Fraud <span className="gradient-text">Detection</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Monitor impression logs dan deteksi aktivitas mencurigakan pada iklan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="btn-secondary !py-2.5 px-4 text-xs font-bold flex items-center gap-2 group"
          >
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
          <Link
            href="/dashboard"
            className="group text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <Filter size={14} className="text-slate-500" />
        <button
          onClick={() => setTab("fraud")}
          className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${
            tab === "fraud"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          🚨 Aktivitas Mencurigakan
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${
            tab === "logs"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          📋 Semua Log
        </button>
      </div>

      {tab === "fraud" && (
        <div className="space-y-6">
          {/* Threshold Control */}
          <div className="flex items-center gap-4 card p-4 bg-red-500/5 border-red-500/10">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-300 font-medium">
                Menampilkan IP dengan lebih dari <strong className="text-white">{threshold}</strong> impressions
                dalam 7 hari terakhir.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-black text-slate-500 uppercase">Threshold:</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
                className="input-field !py-1.5 !px-3 !w-20 text-xs text-center"
                min={5}
              />
              <button
                onClick={fetchData}
                className="btn-primary !py-1.5 !px-3 text-[10px] font-bold"
              >
                Cari
              </button>
            </div>
          </div>

          {suspicious.length === 0 ? (
            <div className="card py-20 text-center border-dashed border-white/5">
              <Shield size={48} className="text-emerald-800 mx-auto mb-4" />
              <h3 className="text-emerald-400 font-bold text-lg">Aman! ✅</h3>
              <p className="text-slate-500 text-sm mt-2">
                Tidak ada aktivitas mencurigakan terdeteksi dengan threshold {threshold}.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {suspicious.map((item: any, i: number) => (
                <div
                  key={i}
                  className="card p-5 bg-red-500/[0.03] border-red-500/10 hover:border-red-500/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <Globe size={18} className="text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold font-mono text-sm">
                          {item.ip_address || "Unknown IP"}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye size={10} />
                            {(item.impression_count || 0).toLocaleString()} impresi
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {item.unique_promos || 0} iklan berbeda
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400">
                      <div className="text-center">
                        <div className="text-red-400 font-black text-lg">
                          {(item.impression_count || 0).toLocaleString()}
                        </div>
                        <div className="text-[8px] uppercase font-bold tracking-widest">Total Impresi</div>
                      </div>
                      <div className="text-center pl-4 border-l border-white/5">
                        <div className="text-white text-[10px] font-medium">
                          {item.first_seen ? new Date(item.first_seen).toLocaleString("id-ID") : "-"}
                        </div>
                        <div className="text-[8px] uppercase font-bold tracking-widest">Pertama</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white text-[10px] font-medium">
                          {item.last_seen ? new Date(item.last_seen).toLocaleString("id-ID") : "-"}
                        </div>
                        <div className="text-[8px] uppercase font-bold tracking-widest">Terakhir</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Cari IP atau judul iklan..."
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              className="input-field !pl-12 !py-3"
            />
          </div>

          {filteredLogs.length === 0 ? (
            <div className="card py-20 text-center border-dashed border-white/5">
              <Eye size={48} className="text-slate-800 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg">Tidak Ada Log</h3>
              <p className="text-slate-500 text-sm mt-2">
                Belum ada log impresi iklan tercatat.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden bg-white/[0.01] border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                        Waktu
                      </th>
                      <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                        Iklan
                      </th>
                      <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                        IP Address
                      </th>
                      <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                        User ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.slice(0, 100).map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock size={10} className="text-slate-600" />
                            {log.created_at
                              ? new Date(log.created_at).toLocaleString("id-ID")
                              : "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white text-xs font-bold truncate max-w-[200px] block">
                            {log.promo_title || log.promo_id?.substring(0, 8) || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-300 text-xs font-mono">
                            {log.ip_address || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-500 text-[10px] font-mono">
                            {log.user_id ? log.user_id.substring(0, 12) + "..." : "Guest"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLogs.length > 100 && (
                <div className="p-4 text-center border-t border-white/5">
                  <p className="text-slate-500 text-xs">
                    Menampilkan 100 dari {filteredLogs.length} log terbaru.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
