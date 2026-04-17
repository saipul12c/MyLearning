"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Trash2, CheckCircle2, AlertCircle, Info, ExternalLink,
  ChevronLeft, Trash, CheckSquare, RefreshCw, Loader2, Sparkles,
  Inbox, Filter, Inbox as InboxIcon, Settings as SettingsIcon,
  ShoppingBag, GraduationCap, ShieldAlert, Zap
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import { 
  getUserNotifications, markAsRead, markAllAsRead, 
  deleteNotification, deleteAllNotifications, type Notification 
} from "@/lib/notifications";

export default function NotificationsPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    if (!authLoading && isLoggedIn && user) {
      fetchNotifications();
    }
  }, [authLoading, isLoggedIn, user]);

  const fetchNotifications = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    const data = await getUserNotifications(user.id);
    setNotifications(data);
    setLoading(false);
    setIsRefreshing(false);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(true);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    if (!confirm("Apakah Anda yakin ingin menghapus SEMUA notifikasi? Tindakan ini tidak dapat dibatalkan.")) return;
    
    setIsDeletingAll(true);
    const res = await deleteAllNotifications(user.id);
    if (res.success) {
      setNotifications([]);
    }
    setIsDeletingAll(false);
  };

  // Logic to categorize notifications on the fly
  const categorize = (n: Notification) => {
    const text = (n.title + n.message).toLowerCase();
    if (text.includes("pembayaran") || text.includes("voucher") || text.includes("berlangganan") || text.includes("terdaftar")) return "Transaksi";
    if (text.includes("kursus") || text.includes("materi") || text.includes("tugas") || text.includes("sertifikat") || text.includes("belajar")) return "Akademik";
    if (text.includes("akun") || text.includes("keamanan") || text.includes("suspended") || text.includes("ban") || text.includes("sistem")) return "Sistem";
    return "Umum";
  };

  const categories = ["Semua", "Transaksi", "Akademik", "Sistem", "Umum"];

  const filteredNotifications = notifications
    .filter(n => filter === "all" || !n.isRead)
    .filter(n => activeCategory === "Semua" || categorize(n) === activeCategory);

  if (authLoading || (loading && !isRefreshing)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/5 animate-pulse rounded-lg" />
            <div className="h-4 w-32 bg-white/5 animate-pulse rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-white/5 animate-pulse rounded-full" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-white/5 border border-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 translate-y-1">
              <Zap className="text-white" size={24} />
            </div>
            <div className="ml-1">
               <h1 className="text-4xl font-black text-white tracking-tight">Pusat <span className="gradient-text">Notifikasi</span></h1>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time Information Hub</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleManualRefresh}
            className={`p-3 rounded-2xl border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh"
            disabled={isRefreshing}
          >
            <RefreshCw size={20} />
          </button>
          
          <button 
            onClick={handleDeleteAll}
            disabled={notifications.length === 0 || isDeletingAll}
            className="p-3 rounded-2xl border border-red-500/10 bg-red-500/5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30"
            title="Hapus Semua"
          >
            {isDeletingAll ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
          </button>

          <div className="h-10 w-px bg-white/5 mx-1 hidden sm:block" />

          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="px-6 py-3 rounded-2xl bg-cyan-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              Baca Semua
            </button>
          )}
        </div>
      </div>

      {/* Navigation and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-3 rounded-[2rem] backdrop-blur-sm">
        <div className="flex items-center p-1 bg-black/20 rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto">
          {categories.map(cat => (
            <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeCategory === cat ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'
               }`}
            >
               {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center p-1 bg-black/20 rounded-xl">
           <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
              filter === "all" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              filter === "unread" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Belum Dibaca
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem] py-32 text-center group">
            <div className="w-24 h-24 rounded-full bg-white/2 flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500">
              <Inbox className="text-slate-800" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-500 mb-2">Tidak Ada Notifikasi</h3>
            <p className="text-slate-600 text-sm max-w-sm mx-auto font-medium">
              Kriteria filter Anda tidak menemukan hasil. Coba ganti kategori atau tandai semua sebagai dibaca.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const category = categorize(n);
            return (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className={`group relative overflow-hidden transition-all duration-500 border rounded-[2.5rem] p-7 hover:border-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/5 ${
                !n.isRead 
                  ? "bg-gradient-to-br from-purple-500/[0.04] to-cyan-500/[0.04] border-purple-500/10 shadow-xl" 
                  : "bg-white/[0.01] border-white/5"
              }`}
            >
              <div className="flex gap-8">
                {/* Icon Column */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-transform group-hover:scale-110 duration-700 shadow-lg ${
                  n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  n.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  n.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {category === 'Transaksi' ? <ShoppingBag size={28} /> :
                   category === 'Akademik' ? <GraduationCap size={28} /> :
                   category === 'Sistem' ? <ShieldAlert size={28} /> :
                   <Info size={28} />}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                          category === 'Transaksi' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' :
                          category === 'Akademik' ? 'bg-cyan-500/5 text-cyan-500 border-cyan-500/10' :
                          category === 'Sistem' ? 'bg-red-500/5 text-red-500 border-red-500/10' :
                          'bg-slate-500/5 text-slate-500 border-slate-500/10'
                        }`}>
                          {category}
                        </span>
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
                      </div>
                      <h4 className={`text-xl font-black tracking-tight transition-colors ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                        {n.title}
                      </h4>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      className="p-3 sm:opacity-0 group-hover:opacity-100 transition-all text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-2xl"
                      title="Hapus"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <p className={`text-sm leading-relaxed mb-6 max-w-2xl font-medium ${!n.isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
                       <RefreshCw size={10} />
                       {new Date(n.createdAt).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric'
                        })} • {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {n.linkUrl && (
                      <Link 
                        href={n.linkUrl}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 hover:scale-105 transition-all group/btn shadow-xl hover:shadow-white/5"
                      >
                        Lihat <span className="hidden sm:inline">Detail</span> 
                        <ExternalLink size={14} className="text-slate-500 group-hover/btn:text-white transition-colors" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Decorative side accent */}
              {!n.isRead && (
                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-cyan-500" />
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
