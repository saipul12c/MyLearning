"use client";

import { useState } from "react";
import { 
  Megaphone, Send, Loader2, Users, AlertCircle, CheckCircle2, 
  Info, Shield, Sparkles, LayoutDashboard, ArrowLeft, Trash2, Search
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { NotificationType } from "@/lib/notifications";

export default function AdminAnnouncementsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!title || !message) {
      setError("Judul dan pesan wajib diisi.");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Get all user IDs
      const { data: users, error: fetchError } = await supabase
        .from("user_profiles")
        .select("user_id");

      if (fetchError) throw fetchError;
      if (!users || users.length === 0) throw new Error("Tidak ada user ditemukan.");

      // 2. Prepare payloads
      const payloads = users.map(u => ({
        user_id: u.user_id,
        title,
        message,
        type,
        is_read: false
      }));

      // 3. Batch insert (Supabase supports up to 1000 at a time comfortably, but let's do chunks if needed)
      // For simplicity, we assume < 1000 users for now as a start.
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(payloads);

      if (insertError) throw insertError;

      setSuccess(true);
      setTitle("");
      setMessage("");
    } catch (err: any) {
      console.error("Broadcast error:", err);
      setError(err.message || "Gagal mengirim pengumuman.");
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div>;
  if (!isAdmin) return <div className="p-20 text-center text-red-500 font-bold">Akses Ditolak. Khusus Admin.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-300">Siaran Pengumuman</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Megaphone className="text-white" size={24} />
            </div>
            Broadcast <span className="gradient-text">Pengumuman</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 font-medium">Kirim notifikasi instan ke seluruh pengguna MyLearning sekaligus.</p>
        </div>
        
        <Link href="/dashboard" className="group text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
           <form onSubmit={handleBroadcast} className="card p-8 bg-[#0c0c14] border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                 <Send size={150} className="text-purple-500 rotate-12" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <Shield size={12} className="text-purple-500" /> Tipe Pengumuman
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'info', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                    { id: 'success', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                    { id: 'warning', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    { id: 'error', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as NotificationType)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all ${
                        type === t.id ? `${t.bg} ${t.border} ${t.color} scale-105 shadow-xl` : 'bg-white/2 border-white/5 text-slate-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                      }`}
                    >
                      <t.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                   <Sparkles size={12} className="text-purple-500" /> Konten Pengumuman
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Subjek Pengumuman (Contoh: Update Sistem)"
                  className="input !h-14 !text-lg !font-bold !bg-white/2 !rounded-2xl"
                  required
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail pesan pengumuman..."
                  className="input min-h-[150px] !py-5 !bg-white/2 !rounded-3xl !text-slate-300 resize-none"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-shake">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm animate-bounce-in">
                  <CheckCircle2 size={18} /> Pengumuman berhasil dikirim ke seluruh pengguna!
                </div>
              )}

              <button
                type="submit"
                disabled={isSending || !title || !message}
                className="w-full btn-primary !h-16 !text-lg !font-black !uppercase !tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/30 group"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                    Kirim Sekarang
                  </>
                )}
              </button>
           </form>
        </div>

        {/* Info / Preview Section */}
        <div className="space-y-6">
           <div className="card p-6 bg-purple-500/10 border-purple-500/20 space-y-4">
             <div className="flex items-center gap-3 text-purple-400 mb-2">
                <Users size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Informasi Target</h3>
             </div>
             <p className="text-slate-400 text-xs leading-relaxed">
               Pesan ini akan dikirimkan ke **seluruh pengguna aktif** yang terdaftar di database MyLearning.
             </p>
             <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                   <span>Target</span>
                   <span className="text-white">Semua User</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase transition-all">
                   <span>Metode</span>
                   <span className="text-cyan-400">Push In-App</span>
                </div>
             </div>
           </div>

           <div className="p-6 border border-dashed border-white/10 rounded-[2.5rem] space-y-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Preview di Gadget Siswa</h4>
              <div className="w-full aspect-[9/16] bg-[#0c0c14] border border-white/10 rounded-2xl p-4 overflow-hidden relative">
                 <div className="h-1 w-10 bg-white/10 mx-auto rounded-full mb-4" />
                 <div className={`p-3 rounded-xl border mb-3 ${
                    type === 'info' ? 'bg-blue-500/10 border-blue-500/20' :
                    type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-red-500/10 border-red-500/20'
                 }`}>
                    <div className="text-[8px] font-bold text-white mb-1">{title || "Judul Notifikasi"}</div>
                    <div className="text-[7px] text-slate-400 line-clamp-2">{message || "Isi pesan akan tampil di sini..."}</div>
                 </div>
                 <div className="absolute inset-x-4 bottom-4 h-10 bg-white/5 rounded-xl border border-white/5" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
