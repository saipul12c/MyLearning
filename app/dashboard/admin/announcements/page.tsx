"use client";

import { useState, useEffect } from "react";
import { 
  Megaphone, Send, Loader2, Users, AlertCircle, CheckCircle2, 
  Info, Shield, Sparkles, ArrowLeft, Link as LinkIcon, 
  UserCircle, GraduationCap, Briefcase, Eye, Calendar, Image as ImageIcon,
  History, BarChart3, Clock, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { NotificationType } from "@/lib/notifications";
import { format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type TargetRole = 'all' | 'user' | 'instructor' | 'admin';
type TargetSegment = 'all' | 'inactive_7d' | 'new_users_30d';
type AnnouncementCategory = 'none' | 'update' | 'urgent' | 'promo' | 'event' | 'maintenance' | 'repair';

const ANNOUNCEMENT_TEMPLATES = [
  {
    id: 'maint',
    label: 'Pemeliharaan',
    title: 'Pemeliharaan Sistem Rutin',
    message: 'Kami akan melakukan pemeliharaan sistem rutin pada pukul 00:00 WIB untuk meningkatkan performa platform. Beberapa fitur mungkin tidak dapat diakses sementara.',
    type: 'warning' as NotificationType,
    category: 'maintenance' as AnnouncementCategory
  },
  {
    id: 'fixed',
    label: 'Perbaikan Selesai',
    title: 'Sistem Kembali Normal',
    message: 'Kabar gembira! Masalah teknis yang terjadi sebelumnya telah berhasil kami perbaiki. Anda sekarang dapat kembali menikmati seluruh fitur MyLearning.',
    type: 'success' as NotificationType,
    category: 'repair' as AnnouncementCategory
  },
  {
    id: 'new_course',
    label: 'Promo Kursus',
    title: 'Kuasai Skill Baru Hari Ini!',
    message: 'Ada materi baru yang menarik telah rilis! Jangan lewatkan kesempatan untuk meningkatkan karir Anda dengan materi terbaru dari instruktur profesional.',
    type: 'info' as NotificationType,
    category: 'promo' as AnnouncementCategory
  },
  {
    id: 'urgent',
    label: 'Penting',
    title: 'Pemberitahuan Sangat Penting',
    message: 'Mohon perhatian segera pada pengumuman ini terkait dengan keamanan akun dan kebijakan platform terbaru. Silakan baca detail selengkapnya.',
    type: 'error' as NotificationType,
    category: 'urgent' as AnnouncementCategory
  }
];

interface BroadcastLog {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  target_role: string;
  total_targets: number;
  sent_at: string;
  link_url?: string;
  image_url?: string;
}

export default function AdminAnnouncementsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [targetRole, setTargetRole] = useState<TargetRole>("all");
  const [targetSegment, setTargetSegment] = useState<TargetSegment>("all");
  const [category, setCategory] = useState<AnnouncementCategory>("none");
  
  // Status State
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [history, setHistory] = useState<BroadcastLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load data
  useEffect(() => {
    fetchTargetCount();
    fetchHistory();
  }, [targetRole, targetSegment]);

  async function fetchTargetCount() {
    let query = supabase.from("user_profiles").select("user_id", { count: 'exact', head: true });
    
    if (targetRole !== 'all') {
      query = query.eq("role", targetRole);
    }

    if (targetSegment === 'inactive_7d') {
      query = query.lt("updated_at", subDays(new Date(), 7).toISOString());
    } else if (targetSegment === 'new_users_30d') {
      query = query.gt("created_at", subDays(new Date(), 30).toISOString());
    }

    const { count } = await query;
    setTargetCount(count);
  }

  async function fetchHistory() {
    setIsLoadingHistory(true);
    const { data, error } = await supabase
      .from("broadcast_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setHistory(data);
    }
    setIsLoadingHistory(false);
  }

  const applyTemplate = (tpl: typeof ANNOUNCEMENT_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setType(tpl.type);
    setCategory(tpl.category);
  };

  const getFullTitle = () => {
    if (category === 'none') return title;
    const prefix = category.toUpperCase();
    return `[${prefix}] ${title}`;
  };

  const handleBroadcast = async () => {
    if (!isAdmin || !user) return;
    
    setIsSending(true);
    setError(null);
    setSuccess(false);
    setShowConfirm(false);

    try {
      // 1. Get user IDs
      let query = supabase.from("user_profiles").select("user_id");
      
      if (targetRole !== 'all') {
        query = query.eq("role", targetRole);
      }

      if (targetSegment === 'inactive_7d') {
        query = query.lt("updated_at", subDays(new Date(), 7).toISOString());
      } else if (targetSegment === 'new_users_30d') {
        query = query.gt("created_at", subDays(new Date(), 30).toISOString());
      }
      const { data: users, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      if (!users || users.length === 0) throw new Error("Tidak ada user ditemukan.");

      const fullTitle = getFullTitle();
      const CHUNK_SIZE = 200;
      
      // 2. Insert Notifications in chunks
      for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        const chunk = users.slice(i, i + CHUNK_SIZE);
        const payloads = chunk.map(u => ({
          user_id: u.user_id,
          title: fullTitle,
          message,
          type,
          link_url: linkUrl || null,
          image_url: imageUrl || null,
          is_read: false
        }));

        const { error: insertError } = await supabase.from("notifications").insert(payloads);
        if (insertError) throw insertError;
      }

      // 3. Save to History
      await supabase.from("broadcast_logs").insert({
        admin_id: user.id,
        title: fullTitle,
        message,
        type,
        category,
        target_role: `${targetRole}:${targetSegment}`,
        link_url: linkUrl || null,
        image_url: imageUrl || null,
        total_targets: users.length,
        scheduled_for: scheduledFor || null,
        sent_at: new Date().toISOString()
      });

      setSuccess(true);
      setTitle("");
      setMessage("");
      setLinkUrl("");
      setImageUrl("");
      setScheduledFor("");
      setCategory("none");
      fetchHistory(); // Refresh history
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
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20 p-6">
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
            Broadcast <span className="gradient-text">Master</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 font-medium">Kirim pengumuman instan, terjadwal, dan multimedia ke seluruh platform.</p>
        </div>
        
        <Link href="/dashboard" className="group text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-8">
           <div className="card p-8 bg-[#0c0c14] border-white/5 shadow-2xl space-y-8 relative overflow-hidden group">
              {/* Type & Role Selection */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <Shield size={12} className="text-purple-500" /> Tipe & Warna
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'info', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                      { id: 'success', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                      { id: 'warning', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                      { id: 'error', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                    ].map((t) => (
                      <button
                        key={t.id} type="button" onClick={() => setType(t.id as NotificationType)}
                        className={`p-3 rounded-2xl border flex items-center justify-center transition-all ${
                          type === t.id ? `${t.bg} ${t.border} ${t.color} scale-110 shadow-lg` : 'bg-white/2 border-white/5 text-slate-600 grayscale opacity-60'
                        }`}
                      >
                        <t.icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <Users size={12} className="text-purple-500" /> Target Audience
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value as TargetRole)}
                      className="input !h-12 !bg-white/2 !rounded-2xl border-white/5 text-[10px] font-black uppercase tracking-widest"
                    >
                      <option value="all">Semua Role</option>
                      <option value="user">Siswa</option>
                      <option value="instructor">Instruktur</option>
                      <option value="admin">Admin</option>
                    </select>

                    <select 
                      value={targetSegment}
                      onChange={(e) => setTargetSegment(e.target.value as TargetSegment)}
                      className="input !h-12 !bg-white/2 !rounded-2xl border-white/5 text-[10px] font-black uppercase tracking-widest"
                    >
                      <option value="all">Semua Aktif</option>
                      <option value="inactive_7d">Inaktif {'>'} 7 Hari</option>
                      <option value="new_users_30d">Baru {'<'} 30 Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category & Scheduling */}
              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-500" /> Kategori
                  </label>
                   <div className="flex flex-wrap gap-2">
                    {['none', 'update', 'urgent', 'maintenance', 'repair', 'promo', 'event'].map((c) => (
                      <button
                        key={c} type="button" onClick={() => setCategory(c as AnnouncementCategory)}
                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase transition-all ${
                          category === c 
                            ? c === 'maintenance' || c === 'repair' ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20' :
                              c === 'urgent' ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' :
                              'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-white/2 border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <Calendar size={12} className="text-purple-500" /> Penjadwalan (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="input !h-12 !bg-white/2 !rounded-2xl border-white/5 text-xs text-slate-400"
                  />
                </div>
              </div>

              {/* Content Inputs */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <History size={12} className="text-purple-500" /> Gunakan Template Cepat
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ANNOUNCEMENT_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-[9px] font-bold text-slate-400 hover:text-white uppercase"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                   <Eye size={12} className="text-purple-500" /> Konten & Media
                </label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Subjek Pengumuman..."
                  className="input !h-14 !text-lg !font-bold !bg-white/2 !rounded-2xl"
                  required
                />
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail pesan pengumuman..."
                  className="input min-h-[100px] !py-4 !bg-white/2 !rounded-3xl !text-slate-300 resize-none"
                  required
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="Link Tujuan..."
                      className="input !h-12 !pl-12 !text-xs !bg-white/2 !rounded-2xl border-white/5"
                    />
                  </div>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="URL Gambar Banner..."
                      className="input !h-12 !pl-12 !text-xs !bg-white/2 !rounded-2xl border-white/5"
                    />
                  </div>
                </div>

                {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <button
                type="button" onClick={() => setShowConfirm(true)}
                disabled={isSending || !title || !message}
                className="w-full btn-primary !h-16 !text-lg !font-black !uppercase !tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/30"
              >
                {isSending ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} /> Kirim Sekarang</>}
              </button>
           </div>

           {/* History Table */}
           <div className="card p-8 bg-[#0c0c14] border-white/5 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="text-purple-500" size={24} />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Riwayat Broadcast</h3>
                </div>
                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase">
                  10 Terakhir
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin inline-block" /></div>
              ) : history.length === 0 ? (
                <div className="py-20 text-center text-slate-600 text-sm font-bold italic">Belum ada riwayat pengiriman.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                        <th className="pb-4">Pengumuman</th>
                        <th className="pb-4">Target</th>
                        <th className="pb-4">Waktu</th>
                        <th className="pb-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((h) => (
                        <tr key={h.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-4">
                            <div className="font-bold text-slate-200 text-sm line-clamp-1">{h.title}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1 uppercase">
                              <span className={`px-1.5 py-0.5 rounded ${
                                h.type === 'info' ? 'bg-blue-500/20 text-blue-400' :
                                h.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                h.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>{h.type}</span>
                              {h.category !== 'none' && <span>• {h.category}</span>}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2 text-slate-300 font-black text-sm">
                              <Users size={14} className="text-purple-500" /> {h.total_targets}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">{h.target_role}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-slate-300 text-xs font-medium">
                              {format(new Date(h.sent_at), 'dd MMM yyyy', { locale: idLocale })}
                            </div>
                            <div className="text-[10px] text-slate-500">{format(new Date(h.sent_at), 'HH:mm')} WIB</div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                               <span className="text-[10px] font-black text-emerald-400 uppercase">Terkirim</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
           </div>
        </div>

        {/* Info / Preview Section */}
        <div className="space-y-6">
           <div className="card p-6 bg-purple-500/10 border-purple-500/20 space-y-6">
             <div className="flex items-center gap-3 text-purple-400">
                <BarChart3 size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Statistik Real-time</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Target</div>
                   <div className="text-2xl font-black text-white">{targetCount ?? '...'}</div>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Metode</div>
                   <div className="text-xs font-black text-cyan-400 uppercase">Push In-App</div>
                </div>
             </div>
             <p className="text-slate-400 text-[10px] leading-relaxed italic">
               * Data target diperbarui secara otomatis berdasarkan role yang Anda pilih.
             </p>
           </div>

           <div className="p-6 border border-dashed border-white/10 rounded-[2.5rem] space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center flex items-center justify-center gap-2">
                <Eye size={12} /> Preview Notifikasi
              </h4>
               <div className="w-full aspect-[9/12] bg-[#0c0c14] border border-white/10 rounded-[3rem] p-5 overflow-hidden relative shadow-2xl flex flex-col justify-end">
                  {/* Mock Device Status Bar */}
                  <div className="absolute top-4 left-0 w-full px-6 flex justify-between items-center opacity-40">
                     <div className="text-[8px] font-bold text-white">09:41</div>
                     <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full border border-white/40" />
                        <div className="w-2 h-2 rounded-full border border-white/40" />
                        <div className="w-4 h-2 rounded-sm bg-white/40" />
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center gap-4 px-4 text-center opacity-20">
                     <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Megaphone size={32} />
                     </div>
                     <div className="space-y-2 w-full">
                        <div className="h-2 bg-white/10 rounded-full w-3/4 mx-auto" />
                        <div className="h-2 bg-white/10 rounded-full w-1/2 mx-auto" />
                     </div>
                  </div>

                  {imageUrl && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-32 bg-white/5 rounded-3xl overflow-hidden shadow-2xl rotate-2">
                       <img src={imageUrl} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                  )}

                  <div className={`p-5 rounded-[2rem] border relative overflow-hidden transition-all duration-500 transform group-hover:-translate-y-2 ${
                     category === 'maintenance' || category === 'repair' ? 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/10 shadow-2xl' :
                     category === 'urgent' || type === 'error' ? 'bg-red-500/20 border-red-500/40 shadow-red-500/10 shadow-2xl' :
                     'bg-purple-500/20 border-purple-500/40 shadow-purple-500/10 shadow-2xl'
                  }`}>
                    {/* Floating Glow */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 blur-2xl rounded-full" />

                    <div className="flex items-center gap-2 mb-2">
                       <div className="px-1.5 py-0.5 rounded-full border border-white/20 text-[6px] font-black text-white uppercase tracking-widest">
                         {category === 'none' ? 'INFO' : category}
                       </div>
                       <div className="text-[7px] text-white/40 font-bold uppercase">Now</div>
                    </div>

                    <div className="text-[11px] font-black text-white mb-1 line-clamp-1 leading-none">{getFullTitle() || "Subjek Pengumuman..."}</div>
                    <div className="text-[9px] text-white/60 line-clamp-3 mb-3 leading-relaxed font-medium">{message || "Detail isi pesan pengumuman Anda akan muncul di sini..."}</div>
                    
                    {linkUrl && (
                      <div className="flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-widest bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/10">
                        <ExternalLink size={8} /> Ambil Tindakan
                      </div>
                    )}
                  </div>
               </div>
           </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0c0c14] border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-8 ring-8 ring-amber-500/5">
              <Clock size={40} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-white text-center mb-3 uppercase tracking-tight">Kirim Sekarang?</h3>
            <p className="text-slate-400 text-center text-sm mb-10 leading-relaxed">
              Anda akan mengirim <span className="text-white font-bold">"{getFullTitle()}"</span> ke 
              <span className="text-purple-400 font-bold"> {targetCount ?? 'seluruh'} {targetRole}</span>. 
              Data akan diarsipkan ke riwayat broadcast.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-[10px] uppercase hover:bg-white/10 transition-all">Batal</button>
              <button onClick={handleBroadcast} className="flex-1 px-6 py-4 rounded-2xl bg-purple-500 text-white font-black text-[10px] uppercase hover:bg-purple-600 transition-all shadow-xl shadow-purple-500/40">Kirim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
