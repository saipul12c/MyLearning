"use client";

import { useState } from "react";
import { X, Send, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { requestCertificateRevision } from "@/lib/certificates";

interface RevisionModalProps {
  certificateId: string;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RevisionModal({ certificateId, currentName, onClose, onSuccess }: RevisionModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 3) {
      setError("Nama terlalu pendek (minimal 3 karakter).");
      return;
    }
    if (newName.trim().length > 100) {
      setError("Nama terlalu panjang (maksimal 100 karakter).");
      return;
    }
    if (newName.trim() === currentName) {
      setError("Nama baru harus berbeda dengan nama saat ini.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await requestCertificateRevision(certificateId, newName, reason);
    
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } else {
      setError(res.error || "Gagal mengajukan perbaikan.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-[#0c0c14] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-3xl">
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-white/2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-bold text-xl tracking-tight">Perbaikan <span className="gradient-text">Nama Sertifikat</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest flex items-center gap-1.5">
             <Info size={12} /> One-Time Revision System
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {success ? (
            <div className="py-12 text-center animate-scale-in">
               <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle size={40} className="text-emerald-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Pengajuan Terkirim!</h3>
               <p className="text-slate-400 text-sm">Admin akan meninjau pengajuan Anda segera.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                  <AlertTriangle size={12} /> Penting
                </p>
                <p className="text-amber-400/80 text-xs leading-relaxed">
                  Kesempatan perbaikan hanya diberikan **satu kali**. Pastikan nama baru yang Anda masukkan sudah benar.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Nama Saat Ini</label>
                <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-slate-500 font-medium italic">
                  {currentName}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Nama Baru (Sesuai KTP/Ijazah)</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-slate-700"
                  placeholder="Masukkan Nama Lengkap Baru"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Alasan Perbaikan (Opsional)</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all text-sm min-h-[100px] resize-none"
                  placeholder="Contoh: Salah penulisan marga atau gelar."
                />
              </div>

              {/* Preview Section */}
              <div className="pt-4">
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-1">Preview Sertifikat</label>
                <div className="relative aspect-[16/10] w-full bg-white/5 border border-white/5 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05)_0%,transparent_100%)]" />
                  <div className="relative z-10 border border-white/10 p-4 rounded-xl w-full h-full flex flex-col items-center justify-center bg-[#0c0c14]">
                    <p className="text-[6px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2">Certificate of Completion</p>
                    <p className="text-[10px] font-medium text-slate-500 mb-1">Diberikan kepada:</p>
                    <h4 className="text-sm font-black text-white px-4 border-b border-purple-500/30 pb-1 max-w-full truncate">
                      {newName || "NAMA HARUS DIISI"}
                    </h4>
                    <p className="text-[6px] text-slate-600 mt-2 font-medium">Platform MyLearning Masterpiece</p>
                  </div>
                  <div className="absolute top-2 right-2 text-[8px] font-black text-slate-700 uppercase tracking-tighter opaciy-20">Live Preview</div>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs font-bold bg-red-400/10 p-4 rounded-2xl border border-red-400/20">{error}</p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary !py-5 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-purple-500/20 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                {loading ? "MENGIRIM..." : "KIRIM PENGAJUAN"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
