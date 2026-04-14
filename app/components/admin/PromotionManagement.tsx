"use client";

import { useState, useEffect } from "react";
import { 
  getAllPromotionsAdmin, 
  upsertPromotion, 
  deletePromotion, 
  Promotion 
} from "@/lib/promotions";
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
  AlertCircle
} from "lucide-react";
import Image from "next/image";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [processing, setProcessing] = useState(false);

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
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromo(null);
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
        
        <button 
          onClick={() => handleOpenModal()} 
          className="btn-primary !py-3 px-6 flex items-center gap-2 font-black uppercase tracking-widest text-xs"
        >
          <Plus size={18} /> Add Promotion
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-purple-500" size={40} />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading promos...</p>
        </div>
      ) : filtered.length === 0 ? (
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
                    <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><ImageIcon className="text-slate-700" size={24} /></div>
                  )}
                </div>
                
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded uppercase tracking-widest">
                      {promo.location.replace("_", " ")}
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

      {/* Promotion Modal */}
      {isModalOpen && editingPromo && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="absolute inset-0" onClick={handleCloseModal} />
          <div className="relative bg-[#0c0c14] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-3xl my-8">
            <form onSubmit={handleSave}>
              <div className="p-8 border-b border-white/5 bg-white/2 flex items-center justify-between">
                <h2 className="text-white font-bold text-xl tracking-tight">
                  {editingPromo.id ? "Edit Promotion" : "Create New Promotion"}
                </h2>
                <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Title</label>
                    <input 
                      type="text"
                      value={editingPromo.title}
                      onChange={(e) => setEditingPromo({...editingPromo, title: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Get 50% Off Everything"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Location</label>
                    <select 
                      value={editingPromo.location}
                      onChange={(e) => setEditingPromo({...editingPromo, location: e.target.value as any})}
                      className="input-field !py-3"
                      required
                    >
                      <option value="homepage_banner">Homepage Banner</option>
                      <option value="dashboard_card">Dashboard Card</option>
                      <option value="course_sidebar">Course Sidebar Spotlight</option>
                      <option value="course_listing">Course Listing Hero</option>
                    </select>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Image URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="url"
                        value={editingPromo.imageUrl}
                        onChange={(e) => setEditingPromo({...editingPromo, imageUrl: e.target.value})}
                        className="input-field !pl-12"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Description</label>
                    <textarea 
                      value={editingPromo.description}
                      onChange={(e) => setEditingPromo({...editingPromo, description: e.target.value})}
                      className="input-field min-h-[100px] resize-none"
                      placeholder="Briefly describe what this promotion is about..."
                    />
                  </div>

                  {/* Link URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Link URL</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text"
                        value={editingPromo.linkUrl}
                        onChange={(e) => setEditingPromo({...editingPromo, linkUrl: e.target.value})}
                        className="input-field !pl-12"
                        placeholder="https://..."
                        required
                      />
                    </div>
                  </div>

                  {/* Badge Text */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Badge Text</label>
                    <input 
                      type="text"
                      value={editingPromo.badgeText}
                      onChange={(e) => setEditingPromo({...editingPromo, badgeText: e.target.value})}
                      className="input-field"
                      placeholder="e.g., PARTNER, PROMO, NEW"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Priority (Higher First)</label>
                    <input 
                      type="number"
                      value={editingPromo.priority}
                      onChange={(e) => setEditingPromo({...editingPromo, priority: parseInt(e.target.value) || 0})}
                      className="input-field"
                    />
                  </div>

                  {/* BG Color */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Custom Background (Hex/Gradient)</label>
                    <input 
                      type="text"
                      value={editingPromo.bgColor}
                      onChange={(e) => setEditingPromo({...editingPromo, bgColor: e.target.value})}
                      className="input-field font-mono"
                      placeholder="e.g., #2d1b4d or linear-gradient(...)"
                    />
                  </div>

                  {/* Switches */}
                  <div className="flex items-center gap-6 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={editingPromo.isActive}
                        onChange={(e) => setEditingPromo({...editingPromo, isActive: e.target.checked})}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500/20"
                      />
                      <span className="text-white text-xs font-bold group-hover:text-purple-400 transition-colors">Is Active</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={editingPromo.isExternal}
                        onChange={(e) => setEditingPromo({...editingPromo, isExternal: e.target.checked})}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500/20"
                      />
                      <span className="text-white text-xs font-bold group-hover:text-purple-400 transition-colors">Open in New Tab</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/2 border-t border-white/5 flex gap-4">
                <button 
                  type="submit" 
                  disabled={processing}
                  className="flex-1 btn-primary !py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl shadow-purple-500/20"
                >
                  {processing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {editingPromo.id ? "Update Promotion" : "Create Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
