"use client";

import { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2, QrCode, ArrowRight } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Upload using our tier-specific function
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
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f0f1a] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 block">Upgrade Tier</span>
            <h2 className="text-white font-bold text-lg leading-tight">{tierName}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Payment Info */}
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <QrCode size={18} className="text-purple-400" />
                  Instruksi Pembayaran
                </h3>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total yang harus dibayar:</p>
                    <p className="text-xl font-extrabold text-white">{formatPrice(price)}</p>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                  Silakan scan QRIS di bawah dan transfer sesuai nominal di atas. Akun Anda akan diaktifkan secara otomatis setelah Admin memverifikasi bukti transfer Anda.
                </p>

                <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10">
                  <Image 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MyLearning-Tier-Payment" 
                    alt="QRIS Payment" 
                    width={200} 
                    height={200} 
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="card !bg-blue-500/5 p-4 border-blue-500/20">
                <div className="flex gap-3">
                  <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Satu kali bayar untuk akses **Lifetime**. Admin kami biasanya memverifikasi dalam waktu 1-3 jam.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Upload Section */}
            <div className="flex flex-col">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Upload size={18} className="text-cyan-400" />
                Upload Bukti Bayar
              </h3>

              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 min-h-[250px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer group relative ${
                  preview 
                    ? "border-cyan-500/50 bg-cyan-500/5" 
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
                    <div className="relative w-full aspect-[4/3] mb-3">
                      <Image 
                        src={preview} 
                        alt="Preview" 
                        fill 
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase">
                        <CheckCircle2 size={12} /> Bukti Terpilih
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Upload size={24} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-white text-sm font-medium mb-1">Klik atau seret file</p>
                    <p className="text-slate-500 text-xs">JPG, PNG (Maks 2MB)</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-[11px]">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 !py-4 font-bold shadow-xl shadow-purple-500/20 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Mengunggah...
                  </>
                ) : (
                  <>
                    Kirim Bukti Pembayaran <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
