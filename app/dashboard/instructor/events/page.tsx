"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  Users, MapPin, ExternalLink, CheckCircle, XCircle, Loader2,
  Clock, DollarSign, LayoutGrid, List as ListIcon, ChevronRight, Eye
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { instructorGetEvents, createEvent, updateEvent, getEventRegistrants, PlatformEvent, deleteEvent, generateSlug } from "@/lib/events";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import Link from "next/link";

export default function InstructorEventsPage() {
  const { isInstructor, loading: authLoading, user } = useAuth();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlatformEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
    thumbnailUrl: "",
    category: "Webinar",
    level: "Starter",
    maxSlots: 100,
    tags: [] as string[],
  });

  useEffect(() => {
    if (isInstructor && user) {
      fetchEvents();
    }
  }, [isInstructor, user]);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const data = await instructorGetEvents(user.id);
    setEvents(data);
    setLoading(false);
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
        thumbnailUrl: event.thumbnailUrl || "",
        category: event.category || "Webinar",
        level: event.level || "Starter",
        maxSlots: event.maxSlots || 100,
        tags: event.tags || [],
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
        thumbnailUrl: "",
        category: "Webinar",
        level: "Starter",
        maxSlots: 100,
        tags: [],
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
      fetchEvents();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus event.");
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Memuat data event...</p>
      </div>
    );
  }

  if (!isInstructor) {
    return (
      <div className="p-12 text-center card bg-red-500/5 border-red-500/10">
        <XCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-slate-400">Hanya instuktur yang memiliki akses pengelola event mandiri.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <span>Instructor</span>
            <span>/</span>
            <span className="text-slate-300">Kelola Event</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Calendar className="text-white" size={24} />
            </div>
            Kelola <span className="gradient-text">Event</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 font-medium">Buat Kelas Live, Webinar, atau Sesi Mentoring Anda sendiri.</p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary !h-14 !px-8 flex items-center gap-2 group shadow-xl shadow-purple-500/20"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold uppercase tracking-widest text-xs">Tambah Event Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Event", value: events.length, icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Aktif/Published", value: events.filter(e => e.isPublished).length, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Draft", value: events.filter(e => !e.isPublished).length, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Total Pendaftar", value: events.reduce((acc, curr) => acc + (curr.registrationCount || 0), 0), icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
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
                      <span className="text-xs font-bold text-white">{event.registrationCount || 0} Orang</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link 
                        href={`/dashboard/instructor/events/${event.id}`}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-emerald-500/20 transition-all"
                        title="Lihat Peserta"
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
                    Belum ada event yang Anda buat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0c14] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{editingEvent ? 'Edit' : 'Tambah'} <span className="gradient-text">Event</span></h2>
                <p className="text-sm text-slate-500 mt-1">Lengkapi informasi acara Anda.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form id="event-form" onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Deskripsi Lengkap (Markdown/Text)</label>
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
                </div>

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
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Harga Event (Rp)</label>
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
                          placeholder="Zoom / Jakarta"
                          className="input !bg-white/5 !border-white/10"
                        />
                      </div>
                   </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Link Meeting (Cth: Zoom)</label>
                    <input 
                      type="url" 
                      value={formData.registrationLink}
                      onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                      placeholder="https://zoom.us/..."
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Thumbnail URL</label>
                    <input 
                      type="text" 
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      placeholder="URL gambar banner acara"
                      className="input !bg-white/5 !border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="w-5 h-5 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Publish ke Publik</span>
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
        message="Yakin menghapus event ini? Semua data pendaftar terkait juga akan ikut dihapus permanen."
        confirmLabel="Hapus Sekarang"
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </div>
  );
}
