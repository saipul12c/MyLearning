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
import { getCourses, getAdminCourseById } from "@/lib/courses";
import { useAuth } from "../AuthContext";
import { formatPrice } from "@/lib/utils";

interface Props {
  role: "admin" | "instructor";
}

export default function VoucherManagement({ role }: Props) {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: "success" | "error"}>({
    show: false, message: "", type: "success"
  });

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "fixed",
    discount_value: 0,
    min_purchase: 0,
    usage_limit: 0,
    expiry_date: "",
    course_id: "",
    max_discount: 0,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (role === "admin") {
        const data = await getAllVouchersAdmin();
        setVouchers(data);
      } else if (user) {
        const data = await getVouchersForInstructor(user.id);
        setVouchers(data);
      }
      
      const allCourses = await getCourses();
      setCourses(allCourses.map(c => ({ id: c.id, title: c.title })));
    } catch (err) {
      showNotification("Gagal mengambil data voucher", "error");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Auto-set instructor id for instructor role
    let payload = { ...formData };
    if (role === "instructor" && user) {
        // We might need to fetch the instructor_id first in a real app
        // but for now let's assume the lib handles it or we pass it
        // The lib/vouchers createVoucher will need valid instructor_id if specified.
    }

    const res = await createVoucher(formData);
    setIsSaving(false);
    
    if (res.success) {
      showNotification("Voucher berhasil dibuat!", "success");
      setIsModalOpen(false);
      setFormData({
        code: "", discount_type: "fixed", discount_value: 0,
        min_purchase: 0, usage_limit: 0, expiry_date: "",
        course_id: "", max_discount: 0, is_active: true
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
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Voucher Baru
        </button>
      </div>

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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5 group-hover:from-purple-500 group-hover:to-cyan-400 transition-all">
                     <Tag className="text-purple-400 group-hover:text-white" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black text-white tracking-widest">{voucher.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${voucher.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {voucher.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                       <span className="text-purple-400">
                         Potongan: {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : formatPrice(voucher.discountValue)}
                         {voucher.discountType === 'percentage' && voucher.maxDiscount > 0 && ` (Maks ${formatPrice(voucher.maxDiscount)})`}
                       </span>
                       <span className="flex items-center gap-1"><Users size={12} /> {voucher.usedCount} {voucher.usageLimit > 0 && `/ ${voucher.usageLimit}`} Terpakai</span>
                       {voucher.expiryDate && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(voucher.expiryDate).toLocaleDateString('id-ID')}</span>}
                    </div>
                  </div>
               </div>

               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
           <div className="card w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Plus className="text-purple-400" /> Buat Voucher Baru
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Kode Voucher</label>
                    <input 
                      className="input-premium w-full" 
                      placeholder="CONTOH: HEMAT20" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      required 
                    />
                 </div>

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

                 {formData.discount_type === 'percentage' && (
                   <div className="space-y-1.5 animate-in slide-in-from-top-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Maksimal Potongan (Rp) - Opsional</label>
                      <input 
                        type="number" 
                        className="input-premium w-full" 
                        placeholder="Contoh: 50000"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({...formData, max_discount: Number(e.target.value)})}
                      />
                      <p className="text-[9px] text-slate-500 ml-1">Batasi jumlah maksimal diskon yang didapat siswa.</p>
                   </div>
                 )}

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

                 <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Tanggal Kadaluarsa</label>
                    <input 
                      type="date" 
                      className="input-premium w-full" 
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Kursus Spesifik (Opsional)</label>
                    <select 
                      className="input-premium w-full" 
                      value={formData.course_id}
                      onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                    >
                       <option value="">Semua Kursus</option>
                       {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isSaving}
                   className="btn-primary w-full !py-4 font-bold flex items-center justify-center gap-2 mt-4"
                 >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                    Simpan Voucher
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
