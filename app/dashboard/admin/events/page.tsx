"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  Users, MapPin, ExternalLink, CheckCircle, XCircle, Loader2,
  Clock, DollarSign, LayoutGrid, List as ListIcon, ChevronRight, Eye, ArrowLeft, ArrowRight
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { adminGetEvents, createEvent, updateEvent, deformatEvent, deleteEvent, PlatformEvent, generateSlug } from "@/lib/events";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import Link from "next/link";

export default function AdminEventsPage() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlatformEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    eventDate: "",
    eventEndDate: "",
    registrationDeadline: "",
    location: "Online",
    registrationLink: "",
    price: 0,
    isPublished: false,
    isFeatured: false,
    thumbnailUrl: "",
    bannerUrl: "",
    recordingUrl: "",
    themeColor: "#7c3aed", // Default purple
    category: "Webinar",
    level: "Starter",
    maxSlots: 100,
    tags: [] as string[],
    speakerInfo: [] as any[],
  });

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin, currentPage, searchQuery]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result = await adminGetEvents({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
      });
      setEvents(result.data);
      setTotalEvents(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event?: PlatformEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        slug: event.slug,
        shortDescription: event.shortDescription || "",
        description: event.description || "",
        eventDate: format(new Date(event.eventDate), "yyyy-MM-dd'T'HH:mm"),
        eventEndDate: event.eventEndDate ? format(new Date(event.eventEndDate), "yyyy-MM-dd'T'HH:mm") : "",
        registrationDeadline: event.registrationDeadline ? format(new Date(event.registrationDeadline), "yyyy-MM-dd'T'HH:mm") : "",
        location: event.location || "Online",
        registrationLink: event.registrationLink || "",
        price: event.price || 0,
        isPublished: event.isPublished,
        isFeatured: event.isFeatured,
        thumbnailUrl: event.thumbnailUrl || "",
        bannerUrl: event.bannerUrl || "",
        recordingUrl: event.recordingUrl || "",
        themeColor: event.themeColor || "#7c3aed",
        category: event.category || "Webinar",
        level: event.level || "Starter",
        maxSlots: event.maxSlots || 100,
        tags: event.tags || [],
        speakerInfo: event.speakerInfo || [],
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: "",
        slug: "",
        shortDescription: "",
        description: "",
        eventDate: "",
        eventEndDate: "",
        registrationDeadline: "",
        location: "Online",
        registrationLink: "",
        price: 0,
        isPublished: false,
        isFeatured: false,
        thumbnailUrl: "",
        bannerUrl: "",
        recordingUrl: "",
        themeColor: "#7c3aed",
        category: "Webinar",
        level: "Starter",
        maxSlots: 100,
        tags: [],
        speakerInfo: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
      } else {
        await createEvent({ ...formData, createdBy: user.id });
      }
      setIsModalOpen(false);
      setCurrentPage(1); // Reset to first page after creating new event
      fetchEvents();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Terjadi kesalahan saat menyimpan event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setShowDeleteConfirm(null);
      setCurrentPage(1); // Reset to first page after delete
      fetchEvents();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus event.");
    }
  };

  const filteredEvents = events; // Already filtered by server via search parameter

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Memuat data event...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-12 text-center card bg-red-500/5 border-red-500/10">
        <XCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-slate-400">Hanya administrator yang dapat mengelola event platform.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-300">Manajemen Event</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Calendar className="text-white" size={24} />
            </div>
            Kelola <span className="gradient-text">Event</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 font-medium">Buat dan kelola acara platform, webinar, serta pelatihan eksklusif.</p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary !h-14 !px-8 flex items-center gap-2 group shadow-xl shadow-purple-500/20"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold uppercase tracking-widest text-xs">Tambah Event Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { label: "Total Event", value: totalEvents, icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Total Pendaftar", value: events.reduce((acc, curr) => acc + (curr.registrationCount || 0), 0), icon: Users, color: "text-purple-400", bg: "bg-purple-400/10", note: "(halaman ini)" },
        ].map((stat, i) => (
          <div key={i} className="card p-6 border-white/5 bg-[#0c0c14] hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Cari berdasarkan judul atau slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input !pl-12 !h-14 !bg-[#0c0c14] !border-white/5 focus:!border-purple-500/50"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="card border-white/5 bg-[#0c0c14] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-16">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Informasi Event</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Jadwal & Lokasi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pendaftar</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-6 text-center">
                    {event.isPublished ? (
                      <div className="inline-flex p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform" title="Published">
                        <CheckCircle size={16} />
                      </div>
                    ) : (
                      <div className="inline-flex p-1.5 rounded-full bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform" title="Draft">
                        <Clock size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      {event.thumbnailUrl ? (
                         <img src={event.thumbnailUrl} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-800" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-600">
                          <Calendar size={20} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white group-hover:text-purple-400 transition-colors">{event.title}</p>
                          {event.isFeatured && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-500/10 text-amber-500 uppercase tracking-widest">Featured</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">/{event.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                        <Clock size={12} className="text-purple-400" />
                        {format(new Date(event.eventDate), "d MMMM yyyy, HH:mm", { locale: id })}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <MapPin size={12} />
                        {event.location}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-[#0c0c14] flex items-center justify-center text-[8px] text-slate-500">
                            {i}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-white">{event.registrationCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link 
                        href={`/events/${event.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-cyan-500/20 transition-all"
                        title="Preview Publik"
                      >
                        <Eye size={16} />
                      </Link>
                       <Link 
                        href={`/dashboard/admin/events/${event.id}`}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-emerald-500/20 transition-all"
                        title="Kelola & Verifikasi"
                      >
                        <Users size={16} />
                      </Link>
                       <button 
                        onClick={() => handleOpenModal(event)}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-purple-500/20 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(event.id)}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                    <Calendar className="mx-auto mb-4 opacity-20" size={48} />
                    Tidak ada event ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalEvents > 0 && (
        <div className="card border-white/5 bg-[#0c0c14] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-sm text-slate-400 font-medium">
            Menampilkan <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span>-<span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, totalEvents)}</span> dari <span className="text-white font-bold">{totalEvents}</span> event
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Sebelumnya"
            >
              <ArrowLeft size={16} />
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.ceil(totalEvents / itemsPerPage) }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                    pageNum === currentPage 
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasMore}
              className="p-3 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Selanjutnya"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0c14] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{editingEvent ? 'Edit' : 'Tambah'} <span className="gradient-text">Event</span></h2>
                <p className="text-sm text-slate-500 mt-1">Lengkapi informasi detail acara di bawah ini.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="mb-8 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.themeColor }} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pratinjau Warna Tema</span>
                </div>
                <input 
                  type="color" 
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  className="w-12 h-8 rounded bg-transparent border-none cursor-pointer"
                />
              </div>

              <form id="event-form" onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                {/* Information Column */}
                <div className="space-y-6">
                  {/* ... (existing fields) ... */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Judul Event</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData({ ...formData, title, slug: editingEvent ? formData.slug : generateSlug(title) });
                      }}
                      placeholder="Contoh: Webinar Next.js 14"
                      className="input !bg-white/5 !border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Slug URL</label>
                    <input 
                      type="text" 
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="webinar-nextjs-14"
                      className="input !bg-white/5 !border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ringkasan Singkat</label>
                    <input 
                      type="text" 
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="Membahas fitur terbaru Next.js..."
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Deskripsi Lengkap</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Jelaskan detail agenda, pembicara, dan manfaat event..."
                      className="input min-h-[150px] !py-4 !bg-white/5 !border-white/10 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tags (pisahkan dengan koma)</label>
                    <input 
                      type="text" 
                      value={(formData.tags || []).join(', ')}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      placeholder="nextjs, supabase, webinar"
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>

                  {/* Speaker Management Section */}
                  <div className="p-6 rounded-[2.5rem] bg-white/2 border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Manajemen Pembicara</h4>
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, speakerInfo: [...formData.speakerInfo, { name: "", role: "", bio: "", avatarUrl: "" }] })}
                        className="p-2 rounded-lg bg-white/5 text-purple-400 hover:bg-purple-500/10 transition-all border border-white/10"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.speakerInfo.map((speaker, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 relative group">
                          <button 
                            type="button"
                            onClick={() => {
                              const newList = [...formData.speakerInfo];
                              newList.splice(idx, 1);
                              setFormData({ ...formData, speakerInfo: newList });
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="Nama Pembicara" 
                              value={speaker.name}
                              onChange={(e) => {
                                const newList = [...formData.speakerInfo];
                                newList[idx].name = e.target.value;
                                setFormData({ ...formData, speakerInfo: newList });
                              }}
                              className="input !py-2 !text-xs !bg-white/5"
                            />
                            <input 
                              type="text" 
                              placeholder="Role / Jabatan" 
                              value={speaker.role}
                              onChange={(e) => {
                                const newList = [...formData.speakerInfo];
                                newList[idx].role = e.target.value;
                                setFormData({ ...formData, speakerInfo: newList });
                              }}
                              className="input !py-2 !text-xs !bg-white/5"
                            />
                          </div>
                          <input 
                            type="text" 
                            placeholder="URL Foto Avatar" 
                            value={speaker.avatarUrl}
                            onChange={(e) => {
                              const newList = [...formData.speakerInfo];
                              newList[idx].avatarUrl = e.target.value;
                              setFormData({ ...formData, speakerInfo: newList });
                            }}
                            className="input !py-2 !text-xs !bg-white/5"
                          />
                        </div>
                      ))}
                      {formData.speakerInfo.length === 0 && (
                        <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest py-4">Belum ada pembicara ditambahkan.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings Column */}
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Waktu Mulai</label>
                        <input 
                          type="datetime-local" 
                          value={formData.eventDate}
                          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                          className="input !bg-white/5 !border-white/10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Waktu Selesai</label>
                        <input 
                          type="datetime-local" 
                          value={formData.eventEndDate}
                          onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                          className="input !bg-white/5 !border-white/10"
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Deadline Pendaftaran (Opsional)</label>
                     <input 
                       type="datetime-local" 
                       value={formData.registrationDeadline}
                       onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                       className="input !bg-white/5 !border-white/10"
                     />
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kategori</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="input !bg-white/5 !border-white/10"
                        >
                          <option value="Webinar">Webinar</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Competition">Competition</option>
                          <option value="Talkshow">Talkshow</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Level</label>
                        <select 
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                          className="input !bg-white/5 !border-white/10"
                        >
                          <option value="Starter">Starter</option>
                          <option value="Accelerator">Accelerator</option>
                          <option value="Mastery">Mastery</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kuota</label>
                        <input 
                          type="number" 
                          value={formData.maxSlots}
                          onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) || 100 })}
                          className="input !bg-white/5 !border-white/10"
                          min={1}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Harga (Rp)</label>
                        <input 
                          type="number" 
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                          className="input !bg-white/5 !border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Lokasi</label>
                        <input 
                          type="text" 
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Zoom / Jakarta / Youtube Live"
                          className="input !bg-white/5 !border-white/10"
                        />
                      </div>
                   </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Link Pendaftaran / Meeting (Opsional)</label>
                    <input 
                      type="url" 
                      value={formData.registrationLink}
                      onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                      placeholder="https://zoom.us/..."
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Thumbnail URL (Grid Card)</label>
                    <input 
                      type="text" 
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      placeholder="URL gambar banner acara"
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Banner URL (Hero Detail Page)</label>
                    <input 
                      type="text" 
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      placeholder="URL gambar hero besar"
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Link Rekaman (Setelah Selesai)</label>
                    <input 
                      type="text" 
                      value={formData.recordingUrl}
                      onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                      placeholder="Link YouTube/GDrive Rekaman"
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="w-5 h-5 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Publish</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-5 h-5 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Featured</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-end gap-4">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary !bg-transparent hover:!bg-white/5"
              >
                Batal
              </button>
              <button 
                form="event-form"
                type="submit"
                disabled={isSubmitting}
                className="btn-primary !px-12 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingEvent ? 'Simpan Perubahan' : 'Buat Event')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal 
        isOpen={!!showDeleteConfirm}
        title="Hapus Event"
        message="Duh, yakin maug hapus event ini? Semua data pendaftaran terkait juga bakal kehapus lho."
        confirmLabel="Ya, Hapus Saja"
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </div>
  );
}
