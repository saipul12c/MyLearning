"use client";

import { useState, useEffect } from "react";
import {
  getPromotionsAdminPaginated,
  getAdRevenueSummary,
  upsertPromotion,
  deletePromotion,
  togglePromotionActive,
  runAdMaintenance,
  Promotion
} from "@/lib/promotions";
import { uploadPromotionImage, uploadPromotionVideo } from "@/lib/storage";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Tag,
  Layout,
  Link as LinkIcon,
  Loader2,
  X,
  AlertCircle,
  Camera,
  ChevronDown,
  Check,
  Play,
  Pause,
  Wrench,
  ArrowLeft
} from "lucide-react";

const PROMO_LOCATIONS = [
  { value: "all", label: "✨ SELURUH PENJURU (Global)", multiplier: "MAX" },
  { value: "global_announcement", label: "Global Top Bar", multiplier: "1.6x" },
  { value: "homepage_banner", label: "Homepage Banner", multiplier: "1.3x" },
  { value: "homepage_inline", label: "Homepage Inline", multiplier: "1.0x" },
  { value: "dashboard_card", label: "Dashboard Card", multiplier: "1.1x" },
  { value: "course_sidebar", label: "Course Sidebar Spotlight", multiplier: "1.0x" },
  { value: "course_listing", label: "Course Listing Standard", multiplier: "1.2x" },
  { value: "course_listing_spotlight", label: "Course Listing Spotlight", multiplier: "1.4x" },
  { value: "lesson_sidebar", label: "Lesson Sidebar", multiplier: "0.9x" },
  { value: "quiz_success", label: "Quiz Success Notification", multiplier: "1.5x" },
  { value: "verify_page", label: "Certificate Verify Page", multiplier: "0.9x" },
  { value: "search_recovery", label: "Empty Search Recovery", multiplier: "0.8x" },
  { value: "footer_native", label: "Footer Native Ad", multiplier: "0.8x" },
  { value: "sticky_bottom", label: "Sticky Bottom Ad", multiplier: "1.5x" },
  { value: "interstitial", label: "Full Screen Interstitial", multiplier: "2.0x" },
  { value: "video_card", label: "Autoplay Video Card", multiplier: "1.5x" },
  { value: "privacy_sidebar", label: "Privacy Sidebar", multiplier: "1.0x" },
  { value: "privacy_policy_inline", label: "Privacy Policy Inline", multiplier: "1.1x" },
  { value: "event_listing", label: "Event Gallery Listing", multiplier: "1.2x" },
  { value: "event_sidebar", label: "Event Detail Sidebar", multiplier: "1.1x" },
  { value: "event_detail_inline", label: "Event Detail Inline", multiplier: "1.2x" },
];

const PRIORITY_OPTIONS = [
  { value: 0, label: "Rendah", description: "Tampil terakhir", color: "text-slate-400", bg: "bg-slate-500/10" },
  { value: 10, label: "Normal", description: "Urutan standar", color: "text-blue-400", bg: "bg-blue-500/10" },
  { value: 50, label: "Tinggi", description: "Di atas rata-rata", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { value: 100, label: "Sangat Tinggi", description: "Prioritas utama", color: "text-amber-400", bg: "bg-amber-500/10" },
  { value: 500, label: "Urgent", description: "Hampir paling atas", color: "text-orange-400", bg: "bg-orange-500/10" },
  { value: 999999, label: "Maksimal", description: "Selalu paling atas", color: "text-red-400", bg: "bg-red-500/10" },
];

const IMPRESSION_LIMIT_OPTIONS = [
  { value: 0, label: "♾️ Tanpa Batas", description: "Tayangkan terus" },
  { value: 500, label: "500", description: "Uji coba kecil" },
  { value: 1000, label: "1.000", description: "Kampanye mikro" },
  { value: 5000, label: "5.000", description: "Kampanye kecil" },
  { value: 10000, label: "10.000", description: "Kampanye standar" },
  { value: 25000, label: "25.000", description: "Kampanye menengah" },
  { value: 50000, label: "50.000", description: "Kampanye besar" },
  { value: 100000, label: "100.000", description: "Kampanye masif" },
  { value: 500000, label: "500.000", description: "Mega kampanye" },
  { value: 1000000, label: "1.000.000", description: "Ultra kampanye" },
];

import Image from "next/image";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ active: 0, total: 0, views: 0, ctr: 0 });
  const PAGE_SIZE = 12;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isImpressionDropdownOpen, setIsImpressionDropdownOpen] = useState(false);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);

  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [page, debouncedFilter]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch stats and paginated data in parallel
    const [paginatedRes, summaryData] = await Promise.all([
      getPromotionsAdminPaginated(page, PAGE_SIZE, debouncedFilter),
      getAdRevenueSummary()
    ]);

    setPromotions(paginatedRes.data);
    setTotalCount(paginatedRes.totalCount);

    if (summaryData) {
      setStats({
        active: summaryData.total_active_campaigns || 0,
        total: (summaryData.total_active_campaigns || 0) + (summaryData.total_completed_campaigns || 0),
        views: summaryData.total_impressions || 0,
        ctr: summaryData.average_ctr || 0
      });
    }

    setLoading(false);
  };

  const handleOpenModal = (promo?: Promotion) => {
    setEditingPromo(promo || {
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      location: "homepage_banner",
      badgeText: "PARTNER",
      isActive: true,
      isExternal: true,
      priority: 0,
      targetImpressions: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromo(null);
    setUploading(false);
    setIsLocationDropdownOpen(false);
    setIsPriorityDropdownOpen(false);
    setIsImpressionDropdownOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !editingPromo) return;

    setUploading(true);
    const isVideo = file.type.startsWith('video/');
    const { url, error } = isVideo
      ? await uploadPromotionVideo(file)
      : await uploadPromotionImage(file);

    if (error) {
      alert("Gagal mengunggah file: " + (error.message || error));
    } else if (url) {
      setEditingPromo({ ...editingPromo, imageUrl: url });
    }
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;

    setProcessing(true);
    const res = await upsertPromotion(editingPromo);
    if (res.success) {
      await fetchData();
      handleCloseModal();
    } else {
      alert("Gagal menyimpan: " + res.error);
    }
    setProcessing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus promosi ini?")) return;

    const res = await deletePromotion(id);
    if (res.success) {
      setPromotions(promotions.filter(p => p.id !== id));
    } else {
      alert("Gagal menghapus: " + res.error);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    const newActive = !promo.isActive;
    const res = await togglePromotionActive(promo.id, newActive);
    if (res.success) {
      setPromotions(promotions.map(p => p.id === promo.id ? { ...p, isActive: newActive } : p));
    } else {
      alert("Gagal mengubah status: " + res.error);
    }
  };

  const handleMaintenance = async () => {
    if (!confirm("Jalankan maintenance? Ini akan:\n- Nonaktifkan iklan expired\n- Arsipkan iklan lama (>3 bulan)\n- Tolak draft/pending >7 hari")) return;
    setMaintenanceRunning(true);
    const res = await runAdMaintenance();
    if (res.success) {
      alert("✅ Maintenance selesai! Memuat ulang data...");
      await fetchData();
    } else {
      alert("Gagal: " + res.error);
    }
    setMaintenanceRunning(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (isModalOpen && editingPromo) {
    const ep = editingPromo;
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCloseModal}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-white font-bold text-lg tracking-tight">
                {ep.id ? "Sunting Iklan" : "Buat Iklan Baru"}
              </h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Banner & Spotlight Masterpiece</p>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden border border-white/5 bg-white/[0.02]">
          <form onSubmit={handleSave} className="flex flex-col">
            <div className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 gap-8">
                {/* Title */}
                <div className="space-y-2.5 relative">
                  <div className="flex items-center justify-between ml-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Judul Iklan</label>
                    <span className="text-[10px] text-slate-500 font-bold">{ep.title?.length || 0}/50</span>
                  </div>
                  <input
                    type="text"
                    value={ep.title}
                    onChange={(e) => setEditingPromo({ ...ep, title: e.target.value })}
                    className="input-field !bg-white/5 focus:!bg-white/10 shadow-inner"
                    placeholder="Contoh: Promo Kelas Spesial 50%"
                    maxLength={50}
                    required
                  />
                  <p className="text-[10px] text-slate-500 ml-1 italic max-w-sm">Gunakan judul yang singkat dan memikat (Call-to-Action) untuk menarik minat klik.</p>
                </div>

                {/* Location & Priority Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5 relative">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Lokasi Iklan</label>

                    {/* Custom Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                        className="w-full input-field !py-3 !bg-white/5 focus:!bg-white/10 flex items-center justify-between group"
                      >
                        <span className="text-xs font-bold text-white truncate">
                          {PROMO_LOCATIONS.find(l => l.value === ep.location)?.label || "Pilih Lokasi..."}
                        </span>
                        <ChevronDown size={14} className={`text-slate-500 group-hover:text-purple-400 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isLocationDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl z-[160] overflow-hidden animate-scale-in">
                          <div className="max-h-60 overflow-y-auto custom-scrollbar py-2">
                            {PROMO_LOCATIONS.map((loc) => (
                              <button
                                key={loc.value}
                                type="button"
                                onClick={() => {
                                  setEditingPromo({ ...ep, location: loc.value as any });
                                  setIsLocationDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors group ${ep.location === loc.value ? 'bg-purple-500/10 text-purple-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                  }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold">{loc.label}</span>
                                  <span className="text-[9px] opacity-50 uppercase tracking-widest">Multiplier: {loc.multiplier}</span>
                                </div>
                                {ep.location === loc.value && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2.5 relative">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Prioritas Tampil</label>

                    {/* Custom Priority Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setIsPriorityDropdownOpen(!isPriorityDropdownOpen); setIsImpressionDropdownOpen(false); setIsLocationDropdownOpen(false); }}
                        className="w-full input-field !py-3 !bg-white/5 focus:!bg-white/10 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${(PRIORITY_OPTIONS.find(p => p.value === ep.priority) || PRIORITY_OPTIONS[0]).bg.replace('/10', '/60')
                            }`} />
                          <span className={`text-xs font-bold ${(PRIORITY_OPTIONS.find(p => p.value === ep.priority) || PRIORITY_OPTIONS[0]).color
                            }`}>
                            {PRIORITY_OPTIONS.find(p => p.value === ep.priority)?.label || `Kustom (${ep.priority})`}
                          </span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-500 group-hover:text-purple-400 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isPriorityDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl z-[160] overflow-hidden animate-scale-in">
                          <div className="max-h-60 overflow-y-auto custom-scrollbar py-2">
                            {PRIORITY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setEditingPromo({ ...ep, priority: opt.value });
                                  setIsPriorityDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors group ${ep.priority === opt.value ? 'bg-purple-500/10 text-purple-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-2 h-2 rounded-full ${opt.bg.replace('/10', '/60')}`} />
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-bold ${ep.priority === opt.value ? 'text-purple-400' : opt.color}`}>{opt.label}</span>
                                    <span className="text-[9px] opacity-50 uppercase tracking-widest">{opt.description}</span>
                                  </div>
                                </div>
                                {ep.priority === opt.value && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 ml-1 italic">Makin tinggi prioritas, makin atas diurutkan.</p>
                  </div>
                </div>

                {/* Date & Impressions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Tanggal Mulai</label>
                    <input
                      type="datetime-local"
                      value={ep.startDate?.slice(0, 16) || ''}
                      onChange={(e) => setEditingPromo({ ...ep, startDate: new Date(e.target.value).toISOString() })}
                      className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Berakhir Pada</label>
                    <input
                      type="datetime-local"
                      value={ep.endDate?.slice(0, 16) || ''}
                      onChange={(e) => setEditingPromo({ ...ep, endDate: new Date(e.target.value).toISOString() })}
                      className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                    />
                  </div>
                  <div className="space-y-2.5 relative">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Limit Tayangan</label>

                    {/* Custom Impression Limit Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setIsImpressionDropdownOpen(!isImpressionDropdownOpen); setIsPriorityDropdownOpen(false); setIsLocationDropdownOpen(false); }}
                        className="w-full input-field !py-3 !bg-white/5 focus:!bg-white/10 flex items-center justify-between group"
                      >
                        <span className="text-xs font-bold text-white">
                          {IMPRESSION_LIMIT_OPTIONS.find(o => o.value === (ep.targetImpressions || 0))?.label || `Kustom (${(ep.targetImpressions || 0).toLocaleString('id-ID')})`}
                        </span>
                        <ChevronDown size={14} className={`text-slate-500 group-hover:text-purple-400 transition-transform ${isImpressionDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isImpressionDropdownOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl z-[160] overflow-hidden animate-scale-in">
                          <div className="max-h-60 overflow-y-auto custom-scrollbar py-2">
                            {IMPRESSION_LIMIT_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setEditingPromo({ ...ep, targetImpressions: opt.value });
                                  setIsImpressionDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors group ${(ep.targetImpressions || 0) === opt.value ? 'bg-purple-500/10 text-purple-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                  }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold">{opt.label}</span>
                                  <span className="text-[9px] opacity-50 uppercase tracking-widest">{opt.description}</span>
                                </div>
                                {(ep.targetImpressions || 0) === opt.value && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 ml-1 italic">Pilih jumlah tayangan maksimal iklan ini.</p>
                  </div>
                </div>

                {/* Image Upload/URL */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Gambar Iklan</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input
                        type="url"
                        value={ep.imageUrl}
                        onChange={(e) => setEditingPromo({ ...ep, imageUrl: e.target.value })}
                        className="input-field !pl-12 !bg-white/5 focus:!bg-white/10 text-xs"
                        placeholder="URL Gambar atau Unggah..."
                      />
                    </div>
                    <label className="cursor-pointer group shrink-0">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={uploading}
                      />
                      <div className={`h-full px-4 rounded-xl border border-white/10 flex items-center justify-center transition-all ${uploading ? "opacity-50 cursor-not-allowed bg-white/5" : "bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 text-purple-400"}`}>
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                      </div>
                    </label>
                  </div>
                  {ep.imageUrl && (
                    <div className="relative w-full max-w-lg aspect-video rounded-xl overflow-hidden border border-white/5 mt-4 shadow-2xl bg-black/40">
                      {ep.imageUrl.match(/\.(mp4|webm|ogg)$/i) || ep.imageUrl.includes('videos') ? (
                        <video src={ep.imageUrl} className="w-full h-full object-cover" controls muted />
                      ) : (
                        <Image src={ep.imageUrl} alt="Preview" fill className="object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingPromo({ ...ep, imageUrl: "" })}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors shadow-lg z-10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Deskripsi Konten</label>
                    <span className="text-[10px] text-slate-500 font-bold">{editingPromo.description?.length || 0}/150</span>
                  </div>
                  <textarea
                    value={editingPromo.description}
                    onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })}
                    className="input-field min-h-[90px] resize-none !bg-white/5 focus:!bg-white/10 text-xs leading-relaxed"
                    placeholder="Jelaskan detail keuntungan promo ini..."
                    maxLength={150}
                  />
                  <p className="text-[10px] text-slate-500 ml-1 italic">Tampil pada banner tipe 'card' atau 'spotlight'. Boleh memakai karakter emoji.</p>
                </div>

                {/* Link, Badge & Brand Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Link Tujuan</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                      <input
                        type="text"
                        value={ep.linkUrl}
                        onChange={(e) => setEditingPromo({ ...ep, linkUrl: e.target.value })}
                        className="input-field !pl-10 !bg-white/5 focus:!bg-white/10 text-xs"
                        placeholder="/kursus/..."
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Teks Badge</label>
                    <input
                      type="text"
                      value={ep.badgeText}
                      onChange={(e) => setEditingPromo({ ...ep, badgeText: e.target.value })}
                      className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                      placeholder="PARTNER, PROMO, dll"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Nama Brand</label>
                    <input
                      type="text"
                      value={ep.brandName || ""}
                      onChange={(e) => setEditingPromo({ ...ep, brandName: e.target.value })}
                      className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                      placeholder="Nama Advertiser"
                    />
                  </div>
                </div>

                {/* Switches */}
                <div className="flex items-center gap-8 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={ep.isActive}
                        onChange={(e) => setEditingPromo({ ...ep, isActive: e.target.checked })}
                        className="peer sr-only"
                      />
                      <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-purple-500 transition-all duration-300" />
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-5 shadow-sm" />
                    </div>
                    <span className="text-white text-sm font-bold group-hover:text-purple-400 transition-colors">Iklan Aktif</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={ep.isExternal}
                        onChange={(e) => setEditingPromo({ ...ep, isExternal: e.target.checked })}
                        className="peer sr-only"
                      />
                      <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-cyan-500 transition-all duration-300" />
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-5 shadow-sm" />
                    </div>
                    <span className="text-white text-sm font-bold group-hover:text-cyan-400 transition-colors">Tab Baru</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 py-6 bg-white/[0.03] border-t border-white/5">
              <button
                type="submit"
                disabled={processing || uploading}
                className="w-full btn-primary !py-4 font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 shadow-3xl shadow-purple-500/30 group hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {processing ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <Layout size={20} className="group-hover:scale-110 transition-transform text-white/80" />
                )}
                {ep.id ? "Simpan Perubahan Promosi" : "Terbitkan Iklan Masterpiece"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search promotions..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field !pl-12 !py-3"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMaintenance}
            disabled={maintenanceRunning}
            className="btn-secondary !py-3 px-5 flex items-center gap-2 font-black uppercase tracking-widest text-xs text-amber-400 border-amber-500/20 hover:bg-amber-500/10 disabled:opacity-50"
            title="Jalankan maintenance sistem iklan"
          >
            {maintenanceRunning ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />} Maintenance
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary !py-3 px-6 flex items-center gap-2 font-black uppercase tracking-widest text-xs"
          >
            <Plus size={18} /> Add Promotion
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-purple-500" size={40} />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading promos...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4 border-white/5 bg-white/[0.02]">
              <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Active</div>
              <div className="text-2xl font-black text-white">{stats.active} <span className="text-sm font-bold text-slate-500">/ {stats.total}</span></div>
            </div>
            <div className="card p-4 border-white/5 bg-white/[0.02]">
              <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Views</div>
              <div className="text-2xl font-black text-white">{stats.views.toLocaleString()}</div>
            </div>
            <div className="card p-4 border-white/5 bg-white/[0.02]">
              <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Avg CTR</div>
              <div className="text-2xl font-black text-purple-400">
                {stats.ctr.toFixed(2)}%
              </div>
            </div>
          </div>

          {promotions.length === 0 ? (
            <div className="card py-20 text-center border-dashed border-white/5">
              <ImageIcon size={48} className="text-slate-800 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg">No Promotions Found</h3>
              <p className="text-slate-500 text-sm">Create your first promotion banner or card.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {promotions.map((promo) => (
                <div key={promo.id} className="card p-4 group hover:border-purple-500/30 transition-all">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-full sm:w-32 aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/5">
                      {promo.imageUrl ? (
                        promo.imageUrl.match(/\.(mp4|webm|ogg)$/i) || promo.imageUrl.includes('videos') ? (
                          <video src={promo.imageUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full"><ImageIcon className="text-slate-700" size={24} /></div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${promo.location === 'all'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'bg-purple-500/10 text-purple-400'
                          }`}>
                          {promo.location === 'all' ? '✨ GLOBAL ALL' : promo.location.replace("_", " ")}
                        </span>
                        {promo.isActive ? (
                          <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle size={10} /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                            <XCircle size={10} /> Inactive
                          </span>
                        )}
                      </div>
                      <h4 className="text-white font-bold">{promo.title}</h4>
                      <p className="text-slate-500 text-xs italic line-clamp-1">{promo.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(promo)}
                        className={`p-3 rounded-xl transition-all ${promo.isActive ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-400'}`}
                        title={promo.isActive ? "Pause Iklan" : "Resume Iklan"}
                      >
                        {promo.isActive ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(promo)}
                        className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 border-t border-white/5 pt-6">
              <p className="text-slate-500 text-xs font-medium">
                Showing <span className="text-white font-bold">{((page - 1) * PAGE_SIZE) + 1}</span> to <span className="text-white font-bold">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="text-white font-bold">{totalCount}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-slate-500 text-xs font-bold px-4">
                  Page <span className="text-white">{page}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}