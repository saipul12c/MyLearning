"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2, QrCode, ArrowRight, ShieldCheck, Zap, Clock } from "lucide-react";
import Image from "next/image";
import { TierPurchase, uploadTierPaymentProof } from "@/lib/tiers";
import { formatPrice } from "@/lib/utils";

interface TierPaymentModalProps {
  purchase: TierPurchase;
  tierName: string;
  price: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TierPaymentModal({ purchase, tierName, price, onClose, onSuccess }: TierPaymentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Countdown Timer Logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdAt = new Date(purchase.created_at).getTime();
      const deadline = createdAt + (3 * 24 * 60 * 60 * 1000); // 3 days
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference <= 0) return null;

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [purchase.created_at]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    processFile(selectedFile);
  };

  const processFile = (selectedFile?: File) => {
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError("Ukuran file maksimal adalah 2MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      processFile(droppedFile);
    } else if (droppedFile) {
      setError("Silakan upload file gambar (JPG/PNG)");
    }
  };

  const handleUpload = async () => {
    if (!file || !preview) {
      setError("Silakan pilih bukti pembayaran terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const result = await uploadTierPaymentProof(purchase.id, preview);
    setIsUploading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Gagal mengunggah bukti.");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#030307]/80 backdrop-blur-xl p-4 animate-in fade-in duration-500"
      onClick={onClose}
    >
      {/* Decorative Orbs inside Modal Area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div 
        className="bg-[#0a0a14] rounded-[2.5rem] border border-white/10 max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.5)] scale-in-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grainy Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Zap size={24} className="text-white" />
            </div>
            <div>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1 block">Tier Activation</span>
                <h2 className="text-white font-black text-2xl tracking-tighter leading-tight">{tierName} Upgrade</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Countdown Bar */}
        {timeLeft && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-3 flex items-center justify-center gap-6 animate-pulse">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock size={16} className="animate-spin-slow" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Batas Waktu Aktivasi Tier:</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: 'D', value: timeLeft.days },
                { label: 'H', value: timeLeft.hours },
                { label: 'M', value: timeLeft.minutes },
                { label: 'S', value: timeLeft.seconds }
              ].map((unit, i) => (
                <div key={unit.label} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <span className="bg-amber-500/20 text-white font-black text-sm px-2 py-1 rounded-lg min-w-[32px] text-center border border-amber-500/30">
                      {unit.value.toString().padStart(2, '0')}
                    </span>
                  </div>
                  {i < 3 && <span className="text-amber-500/50 font-black text-sm">:</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-8 md:p-10 relative z-10">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Left: Payment Info */}
            <div className="space-y-8">
              <div className="text-center md:text-left">
                <h3 className="text-white font-black mb-4 flex items-center gap-3 tracking-tight">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Instruksi Pembayaran
                </h3>
                
                <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 mb-6 shadow-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Total Amount</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{formatPrice(price)}</p>
                </div>

                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  Silakan scan QRIS di bawah dan transfer sesuai nominal di atas. Akun Anda akan diaktifkan secara otomatis setelah sistem memverifikasi bukti transfer Anda.
                </p>

                <div className="bg-white p-5 rounded-[2rem] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.05)] border border-white/10 group">
                  <div className="relative overflow-hidden rounded-xl">
                    <Image 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=MyLearning-Tier-Payment" 
                        alt="QRIS Payment" 
                        width={240} 
                        height={240} 
                        className="rounded-lg group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* QR Scanner Line Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,1)] animate-[scan_3s_linear_infinite]" />
                  </div>
                  <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" /> Secure Payment Gateway
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex gap-4">
                  <AlertCircle size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Akses <span className="text-white font-bold">Lifetime</span> berlaku selamanya. Verifikasi manual biasanya memakan waktu <span className="text-indigo-300 font-bold">15-60 menit</span> di jam kerja.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Upload Section */}
            <div className="flex flex-col">
              <h3 className="text-white font-black mb-4 flex items-center gap-3 tracking-tight">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                Upload Bukti Bayar
              </h3>

              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 min-h-[320px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer group relative overflow-hidden ${
                  preview 
                    ? "border-cyan-500/40 bg-cyan-500/5" 
                    : isDragging 
                      ? "border-cyan-400 bg-cyan-400/10 scale-[1.02]" 
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {preview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <div className="relative w-full aspect-[4/3] mb-6">
                      <Image 
                        src={preview} 
                        alt="Preview" 
                        fill 
                        className="object-contain rounded-2xl shadow-2xl"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-[11px] uppercase tracking-widest">
                        <CheckCircle2 size={14} /> Bukti Pembayaran Terpilih
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                        className="mt-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors underline underline-offset-4"
                    >
                        Ganti File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Upload size={32} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-white text-lg font-black tracking-tight mb-2">Pilih File Bukti</p>
                    <p className="text-slate-500 text-xs font-medium">Klik atau seret gambar (Maks 2MB)</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium animate-shake">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="group/btn relative w-full mt-8 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-50 disabled:grayscale overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                    {isUploading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> Sedang Mengirim...
                        </>
                    ) : (
                        <>
                            Kirim Bukti Pembayaran <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                    )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
