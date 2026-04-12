"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle, AlertTriangle, Loader2, FileText, Trash2 } from "lucide-react";
import { getSignatureStatus, uploadSignature, type SignatureStatus } from "@/lib/signatures";

interface SignatureManagerProps {
  userId: string;
  role: 'admin' | 'instructor';
  onSuccess?: () => void;
}

export default function SignatureManager({ userId, role, onSuccess }: SignatureManagerProps) {
  const [status, setStatus] = useState<SignatureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    const data = await getSignatureStatus(userId, role);
    setStatus(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, [userId, role]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Hanya file gambar yang diizinkan (PNG/JPG).");
      return;
    }

    if (file.size > 1024 * 1024 * 2) { // 2MB
      setError("Ukuran file maksimal 2MB.");
      return;
    }

    setUploading(true);
    setError(null);
    
    const result = await uploadSignature(userId, role, file);
    
    if (result.success) {
      await fetchStatus();
      if (onSuccess) onSuccess();
    } else {
      setError(result.error || "Gagal mengunggah tanda tangan.");
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="card p-6 animate-pulse bg-white/5">
        <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
        <div className="h-20 w-full bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="card p-6 border-white/10 bg-gradient-to-br from-white/5 to-transparent">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-purple-400" />
            Keamanan Tanda Tangan Digital
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'admin' 
              ? "Tanda tangan Anda digunakan untuk melegitimasi seluruh sertifikat platform."
              : "Tanda tangan ini akan diverifikasi via QR Code pada sertifikat kursus Anda."}
          </p>
        </div>
        {status?.hasSignature && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <CheckCircle size={14} /> Aktif
          </div>
        )}
      </div>

      <div className="space-y-4">
        {status?.hasSignature ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ID Tanda Tangan Unik</p>
                <code className="text-purple-300 font-mono text-sm">{status.signatureId}</code>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Terakhir Diperbarui</p>
                <p className="text-white text-xs font-medium">
                  {status.lastUpdated ? new Date(status.lastUpdated).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
            <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3 opacity-50" />
            <p className="text-amber-200/70 text-sm font-medium">Anda belum mengunggah tanda tangan digital.</p>
            <p className="text-[10px] text-amber-500/60 mt-1 font-bold uppercase tracking-widest">Wajib untuk melegitimasi sertifikat</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className="pt-2">
          {!status?.canUpdate ? (
            <div className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Pembaruan berikutnya tersedia dalam <span className="text-purple-400 font-black">{status?.daysUntilNextUpdate} hari</span>
              </p>
            </div>
          ) : (
            <label className={`w-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${uploading ? 'bg-white/5 border-white/10 pointer-events-none' : 'hover:bg-purple-500/5 border-white/10 hover:border-purple-500/40 group'}`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="text-purple-400 animate-spin" size={32} />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mengunggah...</p>
                </div>
              ) : (
                <>
                  <Upload size={32} className="text-slate-600 group-hover:text-purple-400 mb-3 transition-colors" />
                  <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                    {status?.hasSignature ? "Perbarui Tanda Tangan" : "Unggah Tanda Tangan"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-tighter">PNG/JPG Max 2MB (Direkomendasikan Latar Belakang Transparan)</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </>
              )}
            </label>
          )}
        </div>

        <p className="text-[10px] text-slate-600 italic leading-relaxed text-center px-4">
          Catatan: Tanda tangan Anda akan dienkripsi dalam bentuk ID digital unik. Gambar asli tidak akan pernah ditampilkan ke publik demi keamanan.
        </p>
      </div>
    </div>
  );
}
