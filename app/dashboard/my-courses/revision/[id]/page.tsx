"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Send, AlertTriangle, CheckCircle,
  Info, Loader2, Award, History, UserCheck
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { getCertificateByEnrollmentId, requestCertificateRevision, CertificateDetails } from "@/lib/certificates";

export default function NameRevisionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const enrollmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [certificate, setCertificate] = useState<CertificateDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [reason, setReason] = useState("");

  const nameWordCount = newName.trim().split(/\s+/).filter(w => w.length > 0).length;

  useEffect(() => {
    if (enrollmentId) {
      fetchCertificate();
    }
  }, [enrollmentId]);

  const fetchCertificate = async () => {
    setLoading(true);
    const cert = await getCertificateByEnrollmentId(enrollmentId);
    if (cert) {
      setCertificate(cert);
      setNewName(cert.userName);
    } else {
      setError("Data sertifikat tidak ditemukan.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificate) return;

    if (newName.trim().length < 3) {
      setError("Nama terlalu pendek (minimal 3 karakter).");
      return;
    }

    if (nameWordCount > 9) {
      setError("Nama baru maksimal 9 kata.");
      return;
    }

    if (newName.trim() === certificate.userName) {
      setError("Nama baru harus berbeda dengan nama saat ini.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await requestCertificateRevision(certificate.id, newName, reason);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/my-courses");
      }, 3000);
    } else {
      setError(res.error || "Gagal mengajukan perbaikan.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat data sertifikat...</p>
      </div>
    );
  }

  if (error && !certificate) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Oops! Terjadi Kesalahan</h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <Link href="/dashboard/my-courses" className="btn-primary flex items-center gap-2 mx-auto w-fit">
          <ChevronLeft size={18} /> Kembali ke Kursus Saya
        </Link>
      </div>
    );
  }

  const hasRevisionUsed = certificate && (certificate.revisionCount || 0) >= 1;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Breadcrumbs / Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/my-courses"
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors w-fit group"
        >
          <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </div>
          Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Perbaikan <span className="gradient-text">Nama Sertifikat</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              <History size={14} /> ID Sertifikat: {certificate?.certificateNumber}
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
            <div className={`w-2 h-2 rounded-full ${hasRevisionUsed ? "bg-red-400" : "bg-emerald-400"} animate-pulse`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Jatah Revisi: {hasRevisionUsed ? "0" : "1"} Tersisa
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-6">
          {success ? (
            <div className="bg-[#0c0c14] border border-emerald-500/20 rounded-[2.5rem] p-12 text-center shadow-3xl animate-scale-in">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle size={48} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Pengajuan Terkirim!</h2>
              <p className="text-slate-400 mb-8 leading-relaxed italic">
                "Pengajuan perbaikan nama Anda sedang diproses oleh tim kami. Mohon tunggu informasi selanjutnya melalui notifikasi."
              </p>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-progress" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-8">
                Mengarahkan kembali dalam 3 detik...
              </p>
            </div>
          ) : (
            <div className="bg-[#0c0c14] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-3xl">
              <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <UserCheck className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Formulir Perbaikan</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Verify identity details</p>
                </div>
              </div>

              <div className="p-8">
                {hasRevisionUsed ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-red-400">
                      <AlertTriangle size={32} />
                    </div>
                    <h4 className="text-white font-bold text-lg">Jatah Revisi Habis</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Maaf, Anda sudah pernah menggunakan jatah satu kali revisi untuk sertifikat ini.
                      Perbaikan nama tidak dapat dilakukan kembali melalui sistem ini.
                    </p>
                    <Link href="/dashboard/my-courses" className="btn-secondary inline-block mt-4">
                      Kembali ke Dashboard
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Information Banner */}
                    <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="text-amber-400" size={20} />
                      </div>
                      <div>
                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">Peringatan Penting</p>
                        <p className="text-amber-400/80 text-xs leading-relaxed font-medium">
                          Fasilitas perbaikan hanya diberikan <strong>sebanyak 1 kali</strong>. Pastikan nama baru yang Anda masukkan <strong>sudah tepat</strong> sesuai KTP/Ijazah karena tidak dapat diubah lagi.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="group">
                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1">Nama Saat Ini</label>
                        <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-slate-600 font-bold italic select-none">
                          {certificate?.userName}
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1 group-focus-within:text-purple-400 transition-colors">
                          Nama Baru (Sesuai Identitas Resmi)
                        </label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className={`w-full bg-[#12121e] border ${nameWordCount > 9 ? "border-red-500/50" : "border-white/10"} rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all font-black placeholder:text-slate-800 text-lg`}
                          placeholder="Masukkan Nama Lengkap Baru"
                          required
                        />
                        <div className="mt-2 flex items-center justify-between px-1">
                          <p className="text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
                            <Info size={10} /> Pastikan ejaan, spasi, dan gelar (jika ada) sudah tepat.
                          </p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${nameWordCount > 9 ? "text-red-400" : "text-slate-700"}`}>
                            {nameWordCount} / 9 Kata
                          </p>
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1 group-focus-within:text-purple-400 transition-colors">
                          Alasan Perbaikan (Opsional)
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full bg-[#12121e] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all text-sm min-h-[140px] resize-none font-medium placeholder:text-slate-800"
                          placeholder="Contoh: Terdapat salah penulisan marga atau ingin menambahkan gelar akademik."
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 rounded-2xl bg-red-400/10 border border-red-400/20 animate-shake">
                        <p className="text-red-400 text-xs font-bold flex items-center gap-2">
                          <AlertTriangle size={14} /> {error}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-primary !py-6 text-base font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/20 disabled:opacity-50 group hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      {submitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      )}
                      {submitting ? "MENGIRIM PENGAJUAN..." : "KIRIM PENGAJUAN REVISI"}
                    </button>

                    <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Platform MyLearning Masterpiece &bull; Certified System
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Live Preview</h3>
            <div className="flex items-center gap-1.5 text-emerald-400 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Generating Real-time</span>
            </div>
          </div>

          <div className="relative aspect-[16/10.5] w-full bg-[#0c0c14] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl group cursor-default">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.1),transparent_70%)]" />
            <div className="absolute inset-4 border border-white/5 rounded-[1.8rem]" />
            <div className="absolute inset-8 border border-white/[0.02] rounded-[1.2rem]" />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-10 text-center">
              <div className="mb-6 opacity-40">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg flex items-center justify-center mx-auto shadow-lg">
                  <Award size={20} className="text-white" />
                </div>
              </div>

              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-500 mb-3 underline underline-offset-4 decoration-purple-500/30">
                Certificate of Achievement
              </p>

              <p className="text-[10px] font-medium text-slate-500 mb-1">Diberikan kepada:</p>

              <div className="w-full relative py-3 group">
                <h4 className={`text-xl font-black text-white px-6 inline-block transition-all duration-300 ${!newName.trim() ? "text-slate-800 italic" : "text-white"}`}>
                  {newName.trim() || "(NAMA LENGKAP)"}
                </h4>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
              </div>

              <p className="text-[8px] text-slate-500 mt-6 max-w-[240px] leading-relaxed mx-auto italic font-medium">
                Telah menyelesaikan program kursus intensif secara digital di platform MyLearning Indonesia.
              </p>

              <div className="mt-8 flex items-center justify-between w-full px-10 opacity-30">
                <div className="text-left">
                  <div className="w-12 h-[1px] bg-white/40 mb-2" />
                  <p className="text-[5px] text-white/60 font-black uppercase">Instructor</p>
                </div>
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center p-1">
                  <div className="w-full h-full border border-white/20 rounded-sm" />
                </div>
                <div className="text-right">
                  <div className="w-12 h-[1px] bg-white/40 mb-2 ml-auto" />
                  <p className="text-[5px] text-white/60 font-black uppercase">Director</p>
                </div>
              </div>
            </div>

            {/* Expired Watermark if applicable (optional aesthetic) */}
            <div className="absolute -bottom-8 -right-8 w-40 h-40 border border-white/5 rounded-full flex items-center justify-center rotate-[-15deg] opacity-10">
              <div className="w-32 h-32 border border-white/5 rounded-full" />
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-3xl p-6">
            <h4 className="text-white text-xs font-bold mb-3 flex items-center gap-2">
              <Info size={14} className="text-purple-400" /> Tahapan Selanjutnya:
            </h4>
            <ul className="space-y-3">
              {[
                "Admin meninjau data identitas Anda.",
                "Persetujuan diberikan dalam 1-2 hari kerja.",
                "Sertifikat lama akan otomatis diperbarui.",
                "Anda akan menerima notifikasi lewat WhatsApp/Email."
              ].map((text, i) => (
                <li key={i} className="text-slate-500 text-[11px] font-medium flex gap-3">
                  <span className="w-4 h-4 rounded-full bg-purple-500/10 flex-shrink-0 flex items-center justify-center text-[10px] text-purple-400 font-black">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
