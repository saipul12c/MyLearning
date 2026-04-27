"use client";

import { useState, useEffect } from "react";
import { 
  Ticket, Plus, Trash2, Eye, EyeOff, Loader2, 
  CheckCircle, AlertCircle, Calendar, Users, 
  ChevronRight, Search, Filter, X, Tag
} from "lucide-react";
import { 
  Voucher, getAllVouchersAdmin, getVouchersForInstructor, 
  deleteVoucher, toggleVoucherStatus, createVoucher, updateVoucher
} from "@/lib/vouchers";
import { getCourses, getAdminCourseById, getCategories } from "@/lib/courses";
import { supabase } from "@/lib/supabase";
import { getAllRegisteredUsers } from "@/lib/auth";
import { useAuth } from "../AuthContext";
import { formatPrice } from "@/lib/utils";
import { Sparkles, Zap, BarChart, Download, Copy, Share2 } from "lucide-react";

interface Props {
  role: "admin" | "instructor";
}

export default function VoucherManagement({ role }: Props) {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, slug: string}[]>([]);
  const [users, setUsers] = useState<{id: string, fullName: string}[]>([]);
  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: "success" | "error"}>({
    show: false, message: "", type: "success"
  });

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "fixed",
    discount_value: 0,
    min_purchase: 0,
    usage_limit: 0,
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    course_id: "",
    category_slug: "",
    target_user_id: "",
    max_discount: 0,
    is_active: true,
    is_featured: false,
    bulk_count: 10,
    bulk_prefix: "PROMO"
  });

  useEffect(() => {
    fetchData();
  }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let instId = null;
      if (role === 'instructor' && user) {
        const { data: inst } = await supabase.from("instructors").select("id").eq("user_id", user.id).single();
        if (inst) {
          instId = inst.id;
          setInstructorProfileId(inst.id);
        }
      }

      const [vData, allCourses, allCats, allUsers] = await Promise.all([
        role === "admin" ? getAllVouchersAdmin() : user ? getVouchersForInstructor(user.id) : Promise.resolve([]),
        getCourses({ 
          status: 'published', 
          instructorId: role === 'instructor' ? instId || 'none' : undefined 
        }),
        getCategories(),
        role === "admin" ? getAllRegisteredUsers() : Promise.resolve([])
      ]);
      
      setVouchers(vData);
      setCourses(allCourses.map(c => ({ id: c.id, title: c.title })));
      setCategories(allCats.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
      setUsers(allUsers.map((u: any) => ({ id: u.id, fullName: u.fullName })));
    } catch (err) {
      showNotification("Gagal mengambil data pendukung", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Hapus voucher "${code}"?`)) return;
    const res = await deleteVoucher(id);
    if (res.success) {
      showNotification("Voucher berhasil dihapus", "success");
      setVouchers(vouchers.filter(v => v.id !== id));
    } else {
      showNotification(res.error || "Gagal menghapus", "error");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleVoucherStatus(id, !currentStatus);
    if (res.success) {
      setVouchers(vouchers.map(v => v.id === id ? { ...v, isActive: !currentStatus } : v));
      showNotification(`Voucher ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`, "success");
    }
  };

  const handleBulkCreate = async () => {
    setIsSaving(true);
    let successCount = 0;
    const { bulk_count, bulk_prefix, code, ...baseData } = formData;
    
        for (let i = 0; i < bulk_count; i++) {
            const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            const generatedCode = `${bulk_prefix}-${randomStr}`;
            const res = await createVoucher({ 
                ...baseData, 
                code: generatedCode,
                instructor_id: role === 'instructor' ? instructorProfileId : null,
                start_date: baseData.start_date || new Date().toISOString()
            });
        if (res.success) successCount++;
    }

    setIsSaving(false);
    showNotification(`${successCount} voucher berhasil digenerate!`, "success");
    setShowForm(false);
    fetchData();
  };

  const handleEditClick = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setFormData({
      code: voucher.code,
      description: voucher.description || "",
      discount_type: voucher.discountType,
      discount_value: voucher.discountValue,
      min_purchase: voucher.minPurchase,
      usage_limit: voucher.usageLimit,
      start_date: voucher.startDate.split('T')[0],
      expiry_date: voucher.expiryDate ? voucher.expiryDate.split('T')[0] : "",
      course_id: voucher.courseId || "",
      category_slug: voucher.categorySlug || "",
      target_user_id: voucher.targetUserId || "",
      max_discount: voucher.maxDiscount,
      is_active: voucher.isActive,
      is_featured: voucher.isFeatured,
      bulk_count: 10,
      bulk_prefix: "PROMO"
    });
    setIsBulkMode(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBulkMode && !editingId) {
      handleBulkCreate();
      return;
    }
    
    setIsSaving(true);
    
    // Convert empty strings to null and remove frontend-only fields
    const { bulk_count, bulk_prefix, is_active, is_featured, ...coreData } = formData;
    
    const payload = {
      ...coreData,
      is_active,
      is_featured,
      course_id: formData.course_id || null,
      category_slug: formData.category_slug || null,
      target_user_id: formData.target_user_id || null,
      expiry_date: formData.expiry_date || null,
      instructor_id: role === 'instructor' ? instructorProfileId : null,
      start_date: formData.start_date || new Date().toISOString()
    };

    const res = editingId 
      ? await updateVoucher(editingId, payload)
      : await createVoucher(payload);

    setIsSaving(false);
    
    if (res.success) {
      showNotification(`Voucher berhasil ${editingId ? 'diperbarui' : 'dibuat'}!`, "success");
      setShowForm(false);
      setEditingId(null);
      setFormData({
        code: "", description: "", discount_type: "fixed", discount_value: 0,
        min_purchase: 0, usage_limit: 0, start_date: new Date().toISOString().split('T')[0],
        expiry_date: "", course_id: "", category_slug: "", target_user_id: "",
        max_discount: 0, is_active: true, is_featured: false,
        bulk_count: 10, bulk_prefix: "PROMO"
      });
      fetchData();
    } else {
      showNotification(res.error || `Gagal ${editingId ? 'mengupdate' : 'membuat'} voucher`, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="text-purple-400" /> Manajemen Voucher
          </h2>
          <p className="text-slate-500 text-sm">Buat dan kelola kode diskon untuk siswa.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              code: "", description: "", discount_type: "fixed", discount_value: 0,
              min_purchase: 0, usage_limit: 0, start_date: new Date().toISOString().split('T')[0],
              expiry_date: "", course_id: "", category_slug: "", target_user_id: "",
              max_discount: 0, is_active: true, is_featured: false,
              bulk_count: 10, bulk_prefix: "PROMO"
            });
            setShowForm(!showForm);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Voucher Baru
        </button>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
           <div className="relative rounded-[2rem] p-1 bg-gradient-to-b from-purple-500/20 via-purple-500/5 to-transparent shadow-2xl">
              <div className="absolute top-0 right-20 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="bg-[#0c0c14] rounded-[1.8rem] p-6 md:p-8 relative z-10">
                 <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
                    <div>
                       <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${editingId ? 'bg-blue-500/10 text-blue-400' : (isBulkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400')}`}>
                             {editingId ? <Ticket size={24} /> : (isBulkMode ? <Zap size={24} /> : <Plus size={24} />)} 
                          </div>
                          {editingId ? "Update Voucher" : (isBulkMode ? "Generate Bulk Voucher" : "Buat Voucher Baru")}
                       </h3>
                       <p className="text-sm text-slate-400 mt-2">Konfigurasi pengaturan diskon dan promosi untuk menarik lebih banyak siswa.</p>
                    </div>
                    <button onClick={() => setShowForm(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                       <X size={20} />
                    </button>
                 </div>

                 {/* Toggle Bulk Mode */}
                 {!editingId && (
                    <div className="flex items-center justify-between p-4 mb-8 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                             <Zap size={20} />
                          </div>
                          <div>
                             <div className="text-base font-bold text-white mb-0.5">Mode Bulk Generation</div>
                             <div className="text-sm text-amber-500/70 font-medium">Buat puluhan kode unik sekaligus secara otomatis.</div>
                          </div>
                       </div>
                       <button 
                        type="button"
                        onClick={() => setIsBulkMode(!isBulkMode)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${isBulkMode ? 'bg-amber-500' : 'bg-slate-700'}`}
                       >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isBulkMode ? 'translate-x-8' : 'translate-x-1'}`} />
                       </button>
                    </div>
                 )}

                 <form onSubmit={handleCreate} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {/* Kiri: Informasi Utama */}
                       <div className="space-y-6">
                          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-5">
                             <h4 className="text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-3">
                                <Ticket size={16} className="text-purple-400" /> Informasi Dasar
                             </h4>
                             
                             {isBulkMode && !editingId ? (
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prefix Kode</label>
                                    <input 
                                      className="input-premium bg-[#0f0a1a]" 
                                      placeholder="Cth: RAMADAN" 
                                      value={formData.bulk_prefix}
                                      onChange={(e) => setFormData({...formData, bulk_prefix: e.target.value.toUpperCase()})}
                                      required 
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah</label>
                                    <input 
                                      type="number"
                                      className="input-premium bg-[#0f0a1a]" 
                                      value={formData.bulk_count}
                                      onChange={(e) => setFormData({...formData, bulk_count: Number(e.target.value)})}
                                      required 
                                    />
                                  </div>
                               </div>
                             ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kode Voucher</label>
                                    <div className="relative">
                                       <input 
                                         className="input-premium bg-[#0f0a1a] !pl-11 uppercase font-mono" 
                                         placeholder="Cth: HEMAT20" 
                                         value={formData.code}
                                         onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                         required 
                                       />
                                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/50">
                                          <Ticket size={18} />
                                       </div>
                                    </div>
                                </div>
                             )}

                             <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deskripsi Promosi</label>
                                <textarea 
                                  className="input-premium bg-[#0f0a1a] min-h-[80px] resize-y" 
                                  placeholder="Cth: Diskon Kemerdekaan untuk semua kelas pemrograman..." 
                                  value={formData.description}
                                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                             </div>
                             
                             <div className="pt-2">
                                <label className="flex items-center justify-between p-4 rounded-xl bg-[#0f0a1a] border border-white/5 cursor-pointer group hover:border-purple-500/30 transition-colors">
                                   <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${formData.is_featured ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-500'}`}>
                                         <Sparkles size={18} />
                                      </div>
                                      <div>
                                         <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors block">Tandai Unggulan</span>
                                         <span className="text-xs text-slate-500">Tampilkan mencolok di Dompet Voucher</span>
                                      </div>
                                   </div>
                                   <input 
                                    type="checkbox" 
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                                    className="w-5 h-5 rounded bg-slate-900 border-white/10 text-purple-500 focus:ring-purple-500/20" 
                                   />
                                </label>
                             </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-5">
                             <h4 className="text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-3">
                                <Filter size={16} className="text-cyan-400" /> Target Promo
                             </h4>
                             <div className="space-y-4">
                               <div className="flex flex-col gap-2">
                                 <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cakupan Voucher</label>
                                 <select 
                                    className="input-premium bg-[#0f0a1a]" 
                                    value={formData.course_id ? `course:${formData.course_id}` : formData.category_slug ? `cat:${formData.category_slug}` : ""}
                                    onChange={(e) => {
                                       const val = e.target.value;
                                       if (val === "") setFormData({...formData, course_id: "", category_slug: ""});
                                       else if (val.startsWith("cat:")) setFormData({...formData, category_slug: val.replace("cat:", ""), course_id: ""});
                                       else if (val.startsWith("course:")) setFormData({...formData, course_id: val.replace("course:", ""), category_slug: ""});
                                    }}
                                 >
                                    <option value="">Seluruh Platform (Semua Kursus)</option>
                                    {categories.length > 0 && <optgroup label="Spesifik Kategori">
                                       {categories.map(c => <option key={`cat:${c.slug}`} value={`cat:${c.slug}`}>{c.name}</option>)}
                                    </optgroup>}
                                    {courses.length > 0 && <optgroup label="Spesifik Kursus">
                                       {courses.map(c => <option key={`course:${c.id}`} value={`course:${c.id}`}>{c.title}</option>)}
                                    </optgroup>}
                                 </select>
                               </div>

                               {role === 'admin' && (
                                  <div className="flex flex-col gap-2">
                                     <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voucher Private (User Tertentu)</label>
                                     <select 
                                       className="input-premium bg-[#0f0a1a]" 
                                       value={formData.target_user_id}
                                       onChange={(e) => setFormData({...formData, target_user_id: e.target.value})}
                                     >
                                        <option value="">Public (Bisa digunakan siapa saja)</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                     </select>
                                  </div>
                               )}
                             </div>
                          </div>
                       </div>

                       {/* Kanan: Pengaturan Nilai & Syarat */}
                       <div className="space-y-6">
                          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-5">
                             <h4 className="text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-3">
                                <Zap size={16} className="text-emerald-400" /> Nilai Diskon
                             </h4>
                             
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipe Diskon</label>
                                   <select 
                                     className="input-premium bg-[#0f0a1a]" 
                                     value={formData.discount_type}
                                     onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                                   >
                                      <option value="fixed">Nominal Tetap (Rp)</option>
                                      <option value="percentage">Persentase (%)</option>
                                   </select>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nilai Potongan</label>
                                   <input 
                                     type="number" 
                                     className="input-premium bg-[#0f0a1a]" 
                                     value={formData.discount_value}
                                     onChange={(e) => setFormData({...formData, discount_value: Number(e.target.value)})}
                                     required 
                                   />
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minimal Beli (Rp)</label>
                                   <input 
                                     type="number" 
                                     className="input-premium bg-[#0f0a1a]" 
                                     value={formData.min_purchase}
                                     onChange={(e) => setFormData({...formData, min_purchase: Number(e.target.value)})}
                                   />
                                </div>
                                <div className={`space-y-2 transition-opacity ${formData.discount_type === 'fixed' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Maks Diskon (Rp)</label>
                                   <input 
                                     type="number" 
                                     className="input-premium bg-[#0f0a1a]" 
                                     placeholder="0 = Tanpa Batas"
                                     value={formData.max_discount}
                                     onChange={(e) => setFormData({...formData, max_discount: Number(e.target.value)})}
                                   />
                                </div>
                             </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-5">
                             <h4 className="text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-3">
                                <Calendar size={16} className="text-amber-400" /> Batasan Waktu & Kuota
                             </h4>
                             
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mulai Berlaku</label>
                                   <input 
                                     type="date" 
                                     className="input-premium bg-[#0f0a1a] text-sm" 
                                     value={formData.start_date}
                                     onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kadaluarsa</label>
                                   <input 
                                     type="date" 
                                     className="input-premium bg-[#0f0a1a] text-sm" 
                                     value={formData.expiry_date}
                                     onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                                   />
                                </div>
                             </div>

                             <div className="space-y-2 pt-2 border-t border-white/5 mt-4">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Batas Penggunaan Global (Kuota)</label>
                                <div className="relative">
                                   <input 
                                     type="number" 
                                     className="input-premium bg-[#0f0a1a] !pl-12" 
                                     placeholder="0 = Tanpa Kuota"
                                     value={formData.usage_limit}
                                     onChange={(e) => setFormData({...formData, usage_limit: Number(e.target.value)})}
                                   />
                                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                      <Users size={18} />
                                   </div>
                                </div>
                                <p className="text-[11px] text-slate-500">Berapa kali voucher ini bisa diklaim secara keseluruhan. Isi 0 untuk tanpa batas.</p>
                             </div>
                          </div>
                       </div>
                    </div>

                 <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-8">
                    <button 
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                    >
                       Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className={`px-8 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${isBulkMode ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20" : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20"}`}
                    >
                       {isSaving ? <Loader2 className="animate-spin" size={20} /> : (editingId ? <Ticket size={20} /> : (isBulkMode ? <Zap size={20} /> : <CheckCircle size={20} />))}
                       {editingId ? "Update Voucher" : (isBulkMode ? `Generate ${formData.bulk_count} Voucher` : "Simpan Voucher")}
                    </button>
                 </div>
              </form>
            </div>
           </div>
        </div>
      )}

      {/* Voucher Analytics Summary */}
      {!loading && vouchers.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="card p-5 border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Ticket size={16} /></div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total Voucher</span>
              </div>
              <div className="text-2xl font-black text-white">{vouchers.length}</div>
           </div>
           <div className="card p-5 border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><CheckCircle size={16} /></div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total Penukaran</span>
              </div>
              <div className="text-2xl font-black text-white">{vouchers.reduce((acc, v) => acc + v.usedCount, 0)}</div>
           </div>
           <div className="card p-5 border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Zap size={16} /></div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Voucher Aktif</span>
              </div>
              <div className="text-2xl font-black text-white">{vouchers.filter(v => v.isActive).length}</div>
           </div>
           <div className="card p-5 border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><BarChart size={16} /></div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Unggulan</span>
              </div>
              <div className="text-2xl font-black text-white">{vouchers.filter(v => v.isFeatured).length}</div>
           </div>
        </div>
      )}

      {notification.show && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
          notification.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {notification.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="card p-20 text-center flex flex-col items-center gap-4 border-dashed border-2 border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
             <Ticket size={32} />
          </div>
          <div>
            <h3 className="text-white font-bold">Belum ada voucher</h3>
            <p className="text-slate-500 text-sm">Klik tombol di atas untuk membuat voucher pertama Anda.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {vouchers.map((voucher) => (
            <div key={voucher.id} className={`card !bg-white/[0.02] border border-white/5 p-5 flex items-center justify-between group hover:border-purple-500/30 transition-all ${!voucher.isActive && "opacity-60"}`}>
               <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 flex items-center justify-center border border-white/5 group-hover:from-purple-500/20 group-hover:to-cyan-400/20 transition-all overflow-hidden relative">
                      {voucher.isFeatured && <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-bl-lg shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                      <Tag className="text-purple-400" size={24} />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-lg font-black text-white tracking-widest">{voucher.code}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${voucher.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                         {voucher.isActive ? "Aktif" : "Nonaktif"}
                       </span>
                       {voucher.targetUserId && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/10 flex items-center gap-1">
                             <Users size={10} /> Private
                          </span>
                       )}
                       {new Date(voucher.startDate) > new Date() && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/10 flex items-center gap-1">
                             <Calendar size={10} /> Scheduled
                          </span>
                       )}
                     </div>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        <span className="text-purple-400">
                          {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : formatPrice(voucher.discountValue)}
                          {voucher.discountType === 'percentage' && voucher.maxDiscount > 0 && ` (Maks ${formatPrice(voucher.maxDiscount)})`}
                        </span>
                        <span className="flex items-center gap-1"><Users size={12} /> {voucher.usedCount} {voucher.usageLimit > 0 && `/ ${voucher.usageLimit}`}</span>
                        {voucher.categorySlug && <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-slate-400">Cat: {voucher.categorySlug}</span>}
                        {voucher.expiryDate && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(voucher.expiryDate).toLocaleDateString('id-ID')}</span>}
                     </div>
                     {voucher.description && (
                        <div className="text-xs text-slate-400 mt-2 font-medium line-clamp-1">{voucher.description}</div>
                     )}
                  </div>
               </div>

               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(voucher.code);
                        showNotification("Kode voucher disalin!", "success");
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400"
                    title="Salin Kode"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => handleEditClick(voucher)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-blue-400"
                    title="Edit Voucher"
                  >
                    <Ticket size={18} />
                  </button>
                  <button 
                    onClick={() => handleToggle(voucher.id, voucher.isActive)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    title={voucher.isActive ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {voucher.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(voucher.id, voucher.code)}
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
