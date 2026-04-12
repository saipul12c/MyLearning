"use client";

import { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2, QrCode, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Enrollment, uploadPaymentProof } from "@/lib/enrollment";

interface PaymentModalProps {
  enrollment: Enrollment;
  qrisUrl: string;
  courseTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ enrollment, qrisUrl, courseTitle, onClose, onSuccess }: PaymentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f0f1a] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in-center">
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
                <p className="text-slate-400 text-xs leading-relaxed">
                  Silakan lakukan pembayaran sesuai harga kursus. Pastikan nominal sesuai agar verifikasi lebih cepat.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Image 
                  src={qrisUrl || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MyLearning-Mock"} 
                  alt="QRIS Payment" 
                  width={250} 
                  height={250} 
                  className="rounded-lg"
                />
              </div>

              <div className="card !bg-purple-500/5 p-4 border-purple-500/20">
                <div className="flex gap-3">
                  <AlertCircle size={16} className="text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Kesempatan mengunggah bukti: <span className="text-white font-bold">{3 - enrollment.paymentRetryCount} kali lagi</span>.
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
                className={`flex-1 min-h-[200px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer group ${
                  preview ? "border-cyan-500/50 bg-cyan-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/5"
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
                    <div className="relative w-full aspect-[3/4] mb-4">
                      <Image 
                        src={preview} 
                        alt="Preview" 
                        fill 
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <p className="text-slate-400 text-xs">Klik untuk ganti gambar</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={24} className="text-slate-500 group-hover:text-cyan-400" />
                    </div>
                    <p className="text-white text-sm font-medium mb-1">Klik atau seret file</p>
                    <p className="text-slate-500 text-xs">JPG, PNG (Maks 2MB)</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs">
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
