"use client";

import { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2, QrCode, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Enrollment, uploadPaymentProof } from "@/lib/enrollment";

interface PaymentModalProps {
  enrollment: Enrollment;
  qrisUrl: string;
  courseTitle: string;
  price: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ enrollment, qrisUrl, courseTitle, price, onClose, onSuccess }: PaymentModalProps) {
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

    // Simulate Supabase Storage Upload
    const result = await uploadPaymentProof(enrollment.id, preview);
    setIsUploading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Gagal mengunggah bukti.");
    }
  };

  // Format price for display
  const formatPriceLocal = (p: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(p);
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
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1 block">Konfirmasi Pembayaran</span>
            <h2 className="text-white font-bold text-lg leading-tight">{courseTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: QRIS Info */}
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <QrCode size={18} className="text-purple-400" />
                  Scan QRIS di Bawah
                </h3>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total yang harus dibayar:</p>
                    <p className="text-xl font-extrabold text-white">{formatPriceLocal(price)}</p>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Silakan lakukan pembayaran sesuai harga kursus di atas. Pastikan nominal sesuai agar verifikasi otomatis lebih lancar.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10 relative group">
                <Image 
                  src={qrisUrl || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MyLearning-Mock"} 
                  alt="QRIS Payment" 
                  width={240} 
                  height={240} 
                  className="rounded-lg"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-[10px] bg-black/60 text-white px-2 py-1 rounded">Klik kanan & simpan jika perlu</span>
                </div>
              </div>

              <div className="card !bg-purple-500/5 p-4 border-purple-500/20">
                <div className="flex gap-3">
                  <AlertCircle size={16} className="text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Sisa kesempatan upload: <span className="text-white font-bold">{3 - (enrollment.paymentRetryCount || 0)} kali lagi</span>.
                    Jika gagal 3x, pendaftaran akan dibatalkan otomatis.
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
                className={`flex-1 min-h-[220px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer group relative ${
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
                    <div className="relative w-full aspect-[4/3] sm:aspect-[3/4] mb-3">
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
                    <p className="text-slate-500 text-[10px] mt-1">Klik untuk ganti gambar</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={24} className={isDragging ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"} />
                    </div>
                    <p className="text-white text-sm font-medium mb-1">{isDragging ? "Lepaskan file sekarang" : "Klik atau seret file"}</p>
                    <p className="text-slate-500 text-xs">JPG, PNG (Maks 2MB)</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-[11px] animate-shake">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`btn-primary w-full mt-6 flex items-center justify-center gap-2 !py-4 font-bold shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sedang Mengunggah...
                  </>
                ) : (
                  <>
                    Kirim Bukti Pembayaran <ArrowRight size={18} />
                  </>
                )}
              </button>
              
              <p className="mt-4 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
                🔒 Pembayaran Aman via QRIS
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
