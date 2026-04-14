"use client";

import { useAuth } from "@/app/components/AuthContext";
import PromotionManagement from "@/app/components/admin/PromotionManagement";
import { Loader2, ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";

export default function PromotionsPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-20">
        <h2 className="text-xl font-bold text-white mb-2">Akses Dibatasi</h2>
        <p className="text-slate-500 text-sm mb-6">Halaman ini hanya dapat diakses oleh Administrator MyLearning.</p>
        <Link href="/dashboard" className="btn-secondary !py-2.5 px-6 inline-flex">Kembali ke Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-300">Promotions</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Megaphone size={20} className="text-purple-400" />
             </div>
             Manajemen <span className="gradient-text">Iklan & Promo</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Kelola banner promosi dan spotlight mitra di seluruh platform.</p>
        </div>
        
        <Link href="/dashboard" className="group text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </Link>
      </div>

      <PromotionManagement />
      
      {/* Policy Tip */}
      <div className="card p-6 border-amber-500/10 bg-amber-500/5">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
             <Megaphone className="text-amber-500" size={18} />
          </div>
          <div className="space-y-1">
             <h4 className="text-amber-500 font-bold text-sm">Prinsip Iklan Non-Intrusif</h4>
             <p className="text-slate-400 text-xs leading-relaxed">
               Iklan harus disesuaikan dengan desain Masterpiece platform. Gunakan gambar berkualitas tinggi, judul yang relevan, 
               dan hindari penggunaan kata-kata "SPAMMY" agar pengalaman belajar siswa tetap terjaga secara premium.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
