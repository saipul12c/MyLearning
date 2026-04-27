"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Mail, CheckCircle, Clock, XCircle, Loader2, Search, RefreshCw,
  Filter, Send
} from "lucide-react";
import { isEmailConfigured } from "@/lib/email";

interface EmailLog {
  id: string;
  user_id: string;
  event_id: string;
  email_type: string;
  email_address: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  event_title?: string;
  user_name?: string;
}

const EMAIL_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  registration: { label: "Registrasi", color: "text-purple-400 bg-purple-500/10" },
  payment_approved: { label: "Pembayaran", color: "text-emerald-400 bg-emerald-500/10" },
  reminder: { label: "Reminder", color: "text-amber-400 bg-amber-500/10" },
  recording_available: { label: "Rekaman", color: "text-cyan-400 bg-cyan-500/10" },
};

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  pending: { icon: Clock, label: "Pending", color: "text-amber-400" },
  sent: { icon: CheckCircle, label: "Terkirim", color: "text-emerald-400" },
  failed: { icon: XCircle, label: "Gagal", color: "text-red-400" },
};

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const emailConfigured = isEmailConfigured();

  useEffect(() => {
    fetchLogs();
  }, [filterType, filterStatus, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("event_email_logs")
        .select(`
          id, user_id, event_id, email_type, email_address, status,
          error_message, sent_at, created_at
        `)
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filterType !== "all") {
        query = query.eq("email_type", filterType);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching email logs:", error);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(log =>
    !searchQuery || log.email_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sentCount = logs.filter(l => l.status === "sent").length;
  const failedCount = logs.filter(l => l.status === "failed").length;
  const pendingCount = logs.filter(l => l.status === "pending").length;

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Mail size={20} className="text-white" />
          </div>
          Email <span className="gradient-text">Logs</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Monitoring semua email yang dikirim oleh sistem</p>
      </div>

      {/* EmailJS Status Banner */}
      {!emailConfigured && (
        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
          <Clock size={20} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-400">EmailJS Belum Dikonfigurasi</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Email saat ini hanya dicatat di database. Konfigurasi <code className="text-amber-300">.env</code> dengan Service ID dan Public Key EmailJS untuk mulai mengirim email.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: logs.length, icon: Mail, color: "text-white", bg: "bg-white/5" },
          { label: "Terkirim", value: sentCount, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Gagal", value: failedCount, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((stat, i) => (
          <div key={i} className={`card p-4 flex items-center gap-3 border-white/5 ${stat.bg}`}>
            <stat.icon size={20} className={stat.color} />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Cari email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full !pl-10 text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="input !w-auto text-sm"
        >
          <option value="all">Semua Tipe</option>
          <option value="registration">Registrasi</option>
          <option value="payment_approved">Pembayaran</option>
          <option value="reminder">Reminder</option>
          <option value="recording_available">Rekaman</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input !w-auto text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Terkirim</option>
          <option value="failed">Gagal</option>
        </select>
        <button
          onClick={() => fetchLogs()}
          className="btn-secondary !p-2.5"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-white/10">
          <Mail size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-white font-bold">Belum Ada Log</p>
          <p className="text-slate-500 text-sm">Email log akan muncul ketika sistem mengirim email.</p>
        </div>
      ) : (
        <div className="card overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipe</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Waktu</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const typeInfo = EMAIL_TYPE_LABELS[log.email_type] || { label: log.email_type, color: "text-slate-400 bg-white/5" };
                  const statusInfo = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{log.email_address}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${statusInfo.color}`}>
                          <StatusIcon size={14} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString("id-ID")
                          : new Date(log.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate">
                        {log.error_message || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-slate-500">{filtered.length} log ditampilkan</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-xs text-slate-400 flex items-center px-2">Hal {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={logs.length < pageSize}
                className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
