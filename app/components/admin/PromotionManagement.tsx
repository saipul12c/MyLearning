"use client";

import { useState, useEffect } from "react";
import { 
  getAllPromotionsAdmin, 
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
  Wrench
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
];
import Image from "next/image";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    const data = await getAllPromotionsAdmin();
    setPromotions(data);
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
      await fetchPromotions();
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
      await fetchPromotions();
    } else {
      alert("Gagal: " + res.error);
    }
    setMaintenanceRunning(false);
  };

  const filtered = promotions.filter(p => 
    p.title.toLowerCase().includes(filter.toLowerCase()) ||
    p.location.toLowerCase().includes(filter.toLowerCase())
  );

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
                <div className="text-2xl font-black text-white">{promotions.filter(p => p.isActive).length} <span className="text-sm font-bold text-slate-500">/ {promotions.length}</span></div>
             </div>
             <div className="card p-4 border-white/5 bg-white/[0.02]">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Views</div>
                <div className="text-2xl font-black text-white">{promotions.reduce((acc, p) => acc + p.currentImpressions, 0).toLocaleString()}</div>
             </div>
             <div className="card p-4 border-white/5 bg-white/[0.02]">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Avg CTR</div>
                <div className="text-2xl font-black text-purple-400">
                  {promotions.reduce((acc, p) => acc + p.currentImpressions, 0) > 0 
                    ? (promotions.reduce((acc, p) => acc + p.currentClicks, 0) / promotions.reduce((acc, p) => acc + p.currentImpressions, 0) * 100).toFixed(2) 
                    : "0.00"}%
                </div>
             </div>
          </div>
          
          {filtered.length === 0 ? (
            <div className="card py-20 text-center border-dashed border-white/5">
               <ImageIcon size={48} className="text-slate-800 mx-auto mb-4" />
               <h3 className="text-white font-bold text-lg">No Promotions Found</h3>
               <p className="text-slate-500 text-sm">Create your first promotion banner or card.</p>
            </div>
          ) : (
        <div className="grid gap-4">
          {filtered.map((promo) => (
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
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                      promo.location === 'all' 
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
      </>
      )}

      {/* Promotion Modal */}
      {isModalOpen && editingPromo && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in sm:p-6 lg:p-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleCloseModal} />
          
          <div className="relative bg-[#0c0c14] border border-white/10 w-full max-w-xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-3xl flex flex-col scale-in-center">
            <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-white font-bold text-lg tracking-tight">
                    {editingPromo.id ? "Sunting Iklan" : "Buat Iklan Baru"}
                  </h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Banner & Spotlight Masterpiece</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all shadow-inner"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-8 space-y-7 overflow-y-auto custom-scrollbar flex-grow bg-gradient-to-b from-transparent to-purple-500/5">
                <div className="grid grid-cols-1 gap-6">
                  {/* Title */}
                  <div className="space-y-2.5 relative">
                    <div className="flex items-center justify-between ml-1">
                       <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Judul Iklan</label>
                       <span className="text-[10px] text-slate-500 font-bold">{editingPromo.title?.length || 0}/50</span>
                    </div>
                    <input 
                      type="text"
                      value={editingPromo.title}
                      onChange={(e) => setEditingPromo({...editingPromo, title: e.target.value})}
                      className="input-field !bg-white/5 focus:!bg-white/10 shadow-inner"
                      placeholder="Contoh: Promo Kelas Spesial 50%"
                      maxLength={50}
                      required
                    />
                    <p className="text-[10px] text-slate-500 ml-1 italic max-w-sm">Gunakan judul yang singkat dan memikat (Call-to-Action) untuk menarik minat klik.</p>
                  </div>

                   {/* Location & Priority Row */}
                  <div className="grid grid-cols-2 gap-4">
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
                            {PROMO_LOCATIONS.find(l => l.value === editingPromo.location)?.label || "Pilih Lokasi..."}
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
                                    setEditingPromo({...editingPromo, location: loc.value as any});
                                    setIsLocationDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors group ${
                                    editingPromo.location === loc.value ? 'bg-purple-500/10 text-purple-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold">{loc.label}</span>
                                    <span className="text-[9px] opacity-50 uppercase tracking-widest">Multiplier: {loc.multiplier}</span>
                                  </div>
                                  {editingPromo.location === loc.value && <Check size={12} />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Prioritas Tampil</label>
                      <input 
                        type="number"
                        value={editingPromo.priority}
                        onChange={(e) => setEditingPromo({...editingPromo, priority: parseInt(e.target.value) || 0})}
                        className="input-field !bg-white/5 focus:!bg-white/10"
                      />
                      <p className="text-[10px] text-slate-500 ml-1 italic">Makin tinggi prioritas, makin atas diurutkan.</p>
                    </div>
                  </div>

                  {/* Date & Impressions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Tanggal Mulai</label>
                      <input 
                        type="datetime-local"
                        value={editingPromo.startDate?.slice(0, 16) || ''}
                        onChange={(e) => setEditingPromo({...editingPromo, startDate: new Date(e.target.value).toISOString()})}
                        className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Berakhir Pada</label>
                      <input 
                        type="datetime-local"
                        value={editingPromo.endDate?.slice(0, 16) || ''}
                        onChange={(e) => setEditingPromo({...editingPromo, endDate: new Date(e.target.value).toISOString()})}
                        className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Limit Tayangan</label>
                      <input 
                        type="number"
                        value={editingPromo.targetImpressions || 0}
                        onChange={(e) => setEditingPromo({...editingPromo, targetImpressions: parseInt(e.target.value) || 0})}
                        className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                      />
                      <p className="text-[10px] text-slate-500 ml-1 italic">0 = Tanpa batas</p>
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
                           value={editingPromo.imageUrl}
                           onChange={(e) => setEditingPromo({...editingPromo, imageUrl: e.target.value})}
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
                    {editingPromo.imageUrl && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 mt-2 shadow-2xl bg-black/40">
                         {editingPromo.imageUrl.match(/\.(mp4|webm|ogg)$/i) || editingPromo.imageUrl.includes('videos') ? (
                           <video src={editingPromo.imageUrl} className="w-full h-full object-cover" controls muted />
                         ) : (
                           <Image src={editingPromo.imageUrl} alt="Preview" fill className="object-cover" />
                         )}
                         <button 
                           type="button" 
                           onClick={() => setEditingPromo({...editingPromo, imageUrl: ""})}
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
                      onChange={(e) => setEditingPromo({...editingPromo, description: e.target.value})}
                      className="input-field min-h-[90px] resize-none !bg-white/5 focus:!bg-white/10 text-xs leading-relaxed"
                      placeholder="Jelaskan detail keuntungan promo ini..."
                      maxLength={150}
                    />
                    <p className="text-[10px] text-slate-500 ml-1 italic">Tampil pada banner tipe 'card' atau 'spotlight'. Boleh memakai karakter emoji.</p>
                  </div>

                  {/* Link, Badge & Brand Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Link Tujuan</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        <input 
                          type="text"
                          value={editingPromo.linkUrl}
                          onChange={(e) => setEditingPromo({...editingPromo, linkUrl: e.target.value})}
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
                        value={editingPromo.badgeText}
                        onChange={(e) => setEditingPromo({...editingPromo, badgeText: e.target.value})}
                        className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                        placeholder="PARTNER, PROMO, dll"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Nama Brand</label>
                      <input 
                        type="text"
                        value={editingPromo.brandName || ""}
                        onChange={(e) => setEditingPromo({...editingPromo, brandName: e.target.value})}
                        className="input-field !bg-white/5 focus:!bg-white/10 text-xs"
                        placeholder="Nama Advertiser"
                      />
                    </div>
                  </div>

                  {/* Switches */}
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={editingPromo.isActive}
                          onChange={(e) => setEditingPromo({...editingPromo, isActive: e.target.checked})}
                          className="peer sr-only"
                        />
                        <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-purple-500 transition-all duration-300" />
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-5 shadow-sm" />
                      </div>
                      <span className="text-white text-xs font-bold group-hover:text-purple-400 transition-colors">Iklan Aktif</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={editingPromo.isExternal}
                          onChange={(e) => setEditingPromo({...editingPromo, isExternal: e.target.checked})}
                          className="peer sr-only"
                        />
                        <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-cyan-500 transition-all duration-300" />
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-5 shadow-sm" />
                      </div>
                      <span className="text-white text-xs font-bold group-hover:text-cyan-400 transition-colors">Tab Baru</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-8 py-6 bg-white/[0.03] border-t border-white/5 flex-shrink-0">
                <button 
                  type="submit" 
                  disabled={processing || uploading}
                  className="w-full btn-primary !py-4 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 shadow-3xl shadow-purple-500/30 group hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {processing ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <Layout size={18} className="group-hover:scale-110 transition-transform text-white/80" />
                  )}
                  {editingPromo.id ? "PERBARUI PROMOSI" : "BUAT IKLAN MASTERPIECE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
