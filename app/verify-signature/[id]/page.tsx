"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle, XCircle, ShieldCheck, User, Calendar, Award, Loader2, ArrowLeft } from "lucide-react";
import { verifySignature } from "@/lib/signatures";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VerifySignaturePage({ params }: PageProps) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      const data = await verifySignature(id);
      setResult(data);
      setLoading(false);
    };
    check();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-purple-500 animate-spin" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Menghubungi Server Validasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-purple-500/30 selection:text-white">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto pt-20 px-6 pb-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 group font-medium text-sm">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke MyLearning
        </Link>

        {result?.success ? (
          <div className="animate-fade-in space-y-8 text-center">
            {/* Success Icon */}
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
               <div className="relative w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck size={48} className="text-emerald-400" />
               </div>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Autentikasi Berhasil</h1>
              <p className="text-slate-400 font-medium">Tanda tangan digital ini valid dan resmi dikeluarkan oleh platform MyLearning.</p>
            </div>

            <div className="grid gap-4 mt-12 text-left">
              <div className="card p-6 border-emerald-500/20 bg-emerald-500/5 group">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                     <User size={24} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-1">Identitas Penanda Tangan</p>
                     <h3 className="text-xl font-bold text-white mb-1">{result.name}</h3>
                     <p className="text-slate-400 text-sm">{result.role} {result.specialization ? `• ${result.specialization}` : ""}</p>
                   </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card p-5 bg-white/5 border-white/10">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                     <Calendar size={12} /> Waktu Aktivasi
                   </p>
                   <p className="text-white font-bold">{new Date(result.signedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-tighter">Timestamp v2.0</p>
                </div>
                <div className="card p-5 bg-white/5 border-white/10">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                     <Award size={12} /> Status Legitimasi
                   </p>
                   <p className="text-emerald-400 font-bold">Resmi & Sah</p>
                   <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-tighter">Platform-Wide Verification</p>
                </div>
              </div>
            </div>

            <div className="pt-8">
               <p className="text-[10px] text-slate-600 italic leading-relaxed max-w-md mx-auto">
                 Penting: Halaman ini hanya memverifikasi keaslian digital dan integritas tanda tangan. 
                 Gambar asli tidak ditampilkan demi keamanan privasi dan kepatuhan GDPR.
               </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Verifikasi Gagal</h1>
              <p className="text-slate-400">ID Tanda Tangan tidak ditemukan atau sudah tidak berlaku lagi.</p>
            </div>
            <Link href="/" className="btn-primary inline-flex mt-6">
              Kembali Ke Beranda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
