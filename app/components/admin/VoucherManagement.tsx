"use client";

import { useState, useEffect } from "react";
import { 
  Ticket, Plus, Trash2, Eye, EyeOff, Loader2, 
  CheckCircle, AlertCircle, Calendar, Users, 
  ChevronRight, Search, Filter, X, Tag
} from "lucide-react";
import { 
  Voucher, getAllVouchersAdmin, getVouchersForInstructor, 
  deleteVoucher, toggleVoucherStatus, createVoucher 
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBulkMode) {
      handleBulkCreate();
      return;
    }
    
    setIsSaving(true);
    
    // Convert empty strings to null for DB
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

    const res = await createVoucher(payload);
    setIsSaving(false);
    
    if (res.success) {
      showNotification("Voucher berhasil dibuat!", "success");
      setShowForm(false);
      setFormData({
        code: "", discount_type: "fixed", discount_value: 0,
        min_purchase: 0, usage_limit: 0, start_date: new Date().toISOString().split('T')[0],
        expiry_date: "", course_id: "", category_slug: "", target_user_id: "",
        max_discount: 0, is_active: true, is_featured: false,
        bulk_count: 10, bulk_prefix: "PROMO"
      });
      fetchData();
    } else {
      showNotification(res.error || "Gagal membuat voucher", "error");
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
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Voucher Baru
        </button>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="card w-full p-8 space-y-6 border border-purple-500/20 bg-purple-500/[0.02]">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       {isBulkMode ? <Zap className="text-amber-400" /> : <Plus className="text-purple-400" />} 
                       {isBulkMode ? "Generate Bulk Voucher" : "Buat Voucher Baru"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Konfigurasi Strategi Diskon & Promosi</p>
                 </div>
                 <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>

              {/* Toggle Bulk Mode */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isBulkMode ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400"}`}>
                       <Zap size={18} />
                    </div>
                    <div>
                       <div className="text-sm font-bold text-white">Mode Bulk Generation</div>
                       <div className="text-[10px] text-slate-500 font-medium">Buat banyak kode unik sekaligus secara otomatis.</div>
                    </div>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBulkMode ? 'bg-amber-500' : 'bg-slate-700'}`}
                 >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBulkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                 {isBulkMode ? (
                   <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Prefix Kode</label>
                        <input 
                          className="input-premium w-full" 
                          placeholder="CONTOH: RAMADAN" 
                          value={formData.bulk_prefix}
                          onChange={(e) => setFormData({...formData, bulk_prefix: e.target.value.toUpperCase()})}
                          required 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Jumlah Voucher</label>
                        <input 
                          type="number"
                          className="input-premium w-full" 
                          value={formData.bulk_count}
                          onChange={(e) => setFormData({...formData, bulk_count: Number(e.target.value)})}
                          required 
                        />
                      </div>
                   </div>
                 ) : (
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Kode Voucher</label>
                        <div className="relative">
                           <input 
                             className="input-premium w-full !pl-10" 
                             placeholder="CONTOH: HEMAT20" 
                             value={formData.code}
                             onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                             required 
                           />
                           <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        </div>
                    </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Tipe Diskon</label>
                       <select 
                         className="input-premium w-full" 
                         value={formData.discount_type}
                         onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                       >
                          <option value="fixed">Nominal Tetap (Rp)</option>
                          <option value="percentage">Persentase (%)</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nilai Potongan</label>
                       <input 
                         type="number" 
                         className="input-premium w-full" 
                         value={formData.discount_value}
                         onChange={(e) => setFormData({...formData, discount_value: Number(e.target.value)})}
                         required 
                       />
                    </div>
                 </div>

                  <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Pilih Detail Target (Pilih satu dari 10 pilihan cepat)</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                       {/* Option 1: All Platform */}
                       <button 
                         type="button"
                         onClick={() => setFormData({...formData, course_id: "", category_slug: ""})}
                         className={`p-3 rounded-xl border text-[10px] font-bold text-center transition-all ${
                            formData.course_id === "" && formData.category_slug === "" 
                            ? "bg-purple-500/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                            : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                         }`}
                       >
                          <Ticket size={14} className="mx-auto mb-1 opacity-50" />
                          SELURUH PLATFORM
                       </button>

                       {/* Options 2-4: Categories (Admin only) or first courses */}
                       {(role === 'admin' ? categories.slice(0, 4) : []).map(cat => (
                          <button 
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData({...formData, category_slug: cat.slug, course_id: ""})}
                            className={`p-3 rounded-xl border text-[10px] font-bold text-center transition-all ${
                               formData.category_slug === cat.slug 
                               ? "bg-amber-500/20 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                               : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                            }`}
                          >
                             <Filter size={14} className="mx-auto mb-1 opacity-50" />
                             KAT: {cat.name.toUpperCase()}
                          </button>
                       ))}

                       {/* Remaining options: Courses */}
                       {courses.slice(0, role === 'admin' ? 10 - 1 - Math.min(4, categories.length) : 9).map(course => (
                          <button 
                            key={course.id}
                            type="button"
                            onClick={() => setFormData({...formData, course_id: course.id, category_slug: ""})}
                            className={`p-3 rounded-xl border text-[10px] font-bold text-center transition-all line-clamp-2 overflow-hidden items-center justify-center flex flex-col ${
                               formData.course_id === course.id 
                               ? "bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                               : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                            }`}
                          >
                             <Search size={14} className="mx-auto mb-1 opacity-50" />
                             {course.title.toUpperCase()}
                          </button>
                       ))}
                    </div>

                    {/* Search/Fallback for more items */}
                    <div className="flex items-center gap-3 mt-2">
                       <div className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Atau cari lainnya:</div>
                       <select 
                          className="input-premium flex-1 !h-10 text-xs" 
                          value={formData.course_id || formData.category_slug || ""}
                          onChange={(e) => {
                             const val = e.target.value;
                             const isCat = categories.find(c => c.slug === val);
                             if (val === "") setFormData({...formData, course_id: "", category_slug: ""});
                             else if (isCat) setFormData({...formData, category_slug: val, course_id: ""});
                             else setFormData({...formData, course_id: val, category_slug: ""});
                          }}
                       >
                          <option value="">-- Cari Item Lainnya --</option>
                          <optgroup label="Kategori">
                             {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                          </optgroup>
                          <optgroup label="Kursus">
                             {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </optgroup>
                       </select>
                    </div>
                  </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Tanggal Mulai (Jadwal)</label>
                       <input 
                         type="date" 
                         className="input-premium w-full" 
                         value={formData.start_date}
                         onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Tanggal Berakhir</label>
                       <input 
                         type="date" 
                         className="input-premium w-full" 
                         value={formData.expiry_date}
                         onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Minimal Pembelian (Rp)</label>
                       <input 
                         type="number" 
                         className="input-premium w-full" 
                         value={formData.min_purchase}
                         onChange={(e) => setFormData({...formData, min_purchase: Number(e.target.value)})}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Batas Penggunaan (0=unlimited)</label>
                       <input 
                         type="number" 
                         className="input-premium w-full" 
                         value={formData.usage_limit}
                         onChange={(e) => setFormData({...formData, usage_limit: Number(e.target.value)})}
                       />
                    </div>
                 </div>

                 {role === 'admin' && (
                    <div className="space-y-1.5">
                       <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Voucher Khusus User (Private)</label>
                       <select 
                         className="input-premium w-full" 
                         value={formData.target_user_id}
                         onChange={(e) => setFormData({...formData, target_user_id: e.target.value})}
                       >
                          <option value="">Public (Bisa digunakan siapa saja)</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                       </select>
                    </div>
                 )}

                 <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input 
                        type="checkbox" 
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                        className="w-5 h-5 rounded-lg bg-slate-900 border-white/10 text-purple-500 focus:ring-purple-500/20" 
                       />
                       <div className="flex items-center gap-2">
                          <Sparkles size={16} className={formData.is_featured ? "text-purple-400" : "text-slate-500"} />
                          <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Tandai sebagai Voucher Unggulan</span>
                       </div>
                    </label>
                 </div>

                 <div className="flex gap-3 mt-4">
                    <button 
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn-secondary flex-1 font-bold"
                    >
                       Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className={`flex-[2] btn-primary !py-4 font-bold flex items-center justify-center gap-2 ${isBulkMode ? "from-amber-500 to-orange-400" : ""}`}
                    >
                       {isSaving ? <Loader2 className="animate-spin" size={20} /> : (isBulkMode ? <Zap size={20} /> : <CheckCircle size={20} />)}
                       {isBulkMode ? `Generate ${formData.bulk_count} Voucher` : "Simpan Voucher"}
                    </button>
                 </div>
              </form>
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
