"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { getAvailableVouchersForUser, type Voucher } from "@/lib/vouchers";
import { 
  Ticket, 
  Search, 
  Copy, 
  ExternalLink, 
  Calendar, 
  Tag, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { fuzzyMatch } from "@/lib/search-utils";
import SearchHighlight from "@/app/components/SearchHighlight";

export default function VoucherWalletPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (user) {
      fetchVouchers();
    }
  }, [user]);

  const fetchVouchers = async () => {
    setLoading(true);
    const data = await getAvailableVouchersForUser(user!.id);
    setVouchers(data);
    setLoading(false);
  };

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = vouchers.filter(v => 
    fuzzyMatch(v.code, filter) || 
    (v.instructorName && fuzzyMatch(v.instructorName, filter)) ||
    (v.categorySlug && fuzzyMatch(v.categorySlug, filter))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Memuat Voucher Untukmu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-300">Dompet Voucher</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
             <Ticket size={22} className="text-purple-400" />
          </div>
          Dompet <span className="gradient-text">Voucher</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">Temukan penawaran eksklusif dan potongan harga untuk kursus favorit Anda.</p>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className="card p-4 border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
               <Ticket size={20} />
            </div>
            <div>
               <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Voucher</div>
               <div className="text-xl font-black text-white">{vouchers.length}</div>
            </div>
         </div>
         <div className="card p-4 border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
               <Sparkles size={20} />
            </div>
            <div>
               <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Siap Digunakan</div>
               <div className="text-xl font-black text-white">{vouchers.length}</div>
            </div>
         </div>
         <div className="card p-4 border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
               <Clock size={20} />
            </div>
            <div>
               <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Masa Berlaku</div>
               <div className="text-sm font-bold text-white uppercase mt-0.5">Selamanya / Terbatas</div>
            </div>
         </div>
      </div>

      {/* Search Filter */}
      <div className="relative group">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
         <input 
            type="text" 
            placeholder="Cari kode voucher atau instruktur..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field !pl-12 !py-4 bg-white/2 hover:bg-white/5 transition-all text-sm font-medium"
         />
      </div>

      {/* Voucher Grid */}
      {filtered.length === 0 ? (
        <div className="card py-24 text-center border-dashed border-white/10 glass-strong">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Ticket size={32} className="text-slate-700" />
           </div>
           <h3 className="text-white font-black text-lg">Belum Ada Voucher</h3>
           <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Voucher akan otomatis muncul di sini jika tersedia untuk kursus yang Anda incar.</p>
           <Link href="/dashboard/courses" className="btn-primary !py-2.5 px-6 inline-flex mt-8 text-xs font-black uppercase tracking-widest">
              Jelajahi Kursus <ChevronRight size={14} />
           </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map((voucher) => (
            <div key={voucher.id} className="relative group cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Left Ticket Cut */}
               <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full bg-[#0c0c14] border-r border-white/10 z-10" />
               {/* Right Ticket Cut */}
               <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full bg-[#0c0c14] border-l border-white/10 z-10" />
               
               <div className="card p-0 flex h-full overflow-hidden border-white/10 hover:border-purple-500/30 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                  {/* Discount Section */}
                  <div className="w-32 flex-shrink-0 bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4 text-center">
                     <div className="text-white font-black text-3xl leading-none">
                        {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : 'FIX'}
                     </div>
                     <div className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-1">Potongan</div>
                     {voucher.discountType === 'fixed' && (
                        <div className="text-[11px] font-bold text-white mt-1">{formatPrice(voucher.discountValue)}</div>
                     )}
                  </div>

                  {/* Info Section */}
                  <div className="flex-grow p-6 flex flex-col justify-between">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                              voucher.courseId ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' :
                              voucher.instructorId ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/10' :
                              voucher.categorySlug ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                              'bg-purple-500/20 text-purple-400 border border-purple-500/10'
                           }`}>
                              {voucher.courseId ? 'Kursus Spesifik' :
                               voucher.instructorId ? 'Instruktur Saja' :
                               voucher.categorySlug ? `Kategori ${voucher.categorySlug}` :
                               'Platform Wide'}
                           </span>
                           {voucher.isFeatured && (
                              <div className="text-[9px] font-black text-purple-400 flex items-center gap-1">
                                 <Sparkles size={10} /> HOT
                              </div>
                           )}
                        </div>
                        
                        <h3 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">
                           <SearchHighlight text={voucher.instructorName ? `Voucher ${voucher.instructorName}` : "Diskon Spesial MyLearning"} query={filter} />
                        </h3>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                           <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium">
                              <Calendar size={12} className="text-purple-500" />
                              Exp: {voucher.expiryDate ? new Date(voucher.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "Tanpa Batas"}
                           </div>
                           <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium">
                              <Tag size={12} className="text-cyan-500" />
                              Min: {formatPrice(voucher.minPurchase)}
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 mt-6">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between group/code transition-all hover:bg-white/10 shadow-inner">
                           <code className="text-white font-mono font-black text-sm tracking-wider">
  <SearchHighlight text={voucher.code} query={filter} className="bg-purple-500/30 text-purple-200" />
</code>
                           <button 
                              onClick={() => handleCopy(voucher.id, voucher.code)}
                              className="text-slate-500 hover:text-white transition-colors p-1"
                              title="Salin Kode"
                           >
                              {copiedId === voucher.id ? <CheckCircle2 size={16} className="text-emerald-400 animate-in zoom-in" /> : <Copy size={16} />}
                           </button>
                        </div>
                        <Link 
                           href="/dashboard/courses" 
                           className="flex-shrink-0 w-11 h-11 rounded-xl bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 flex items-center justify-center transition-all active:scale-95 shadow-lg group-hover:translate-x-1"
                           title="Gunakan Ke Katalog"
                        >
                           <ExternalLink size={18} />
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="card p-6 border-white/5 bg-white/[0.01] flex items-start gap-4">
         <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <AlertCircle size={20} />
         </div>
         <div>
            <h4 className="text-white font-bold text-sm">Ketentuan Penggunaan</h4>
            <ul className="text-slate-500 text-xs mt-2 space-y-1.5 list-disc ml-4 font-medium">
               <li>Setiap voucher hanya dapat digunakan <strong>1 kali</strong> per akun.</li>
               <li>Voucher tidak dapat diuangkan atau digabungkan dengan promo lainnya secara bersamaan.</li>
               <li>Pastikan nilai pembelian minimal terpenuhi sebelum menerapkan kode voucher.</li>
               <li>Jika terjadi kegagalan transaksi, kuota voucher tidak akan terpakai selama status pesanan tidak aktif.</li>
            </ul>
         </div>
      </div>
    </div>
  );
}
