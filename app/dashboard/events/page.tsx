"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { getMyRegistrations, updateRegistration } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { 
  Calendar, Upload, CheckCircle, Clock, MapPin, Loader2, Award, FileText,
  XCircle, AlertTriangle, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function UserEventsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    setLoading(true);
    const data = await getMyRegistrations(user!.id);
    setRegistrations(data);
    setLoading(false);
  };

  const handleFileUpload = async (regId: string, event: React.ChangeEvent<HTMLInputElement>, type: 'payment' | 'submission') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(regId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${regId}_${Date.now()}.${fileExt}`;
      const bucket = type === 'payment' ? 'payments' : 'submissions';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
      // Note: For private buckets, we construct the path and use signed URLs or just path. Here we'll save the path so admin can download it safely.
      const path = uploadData.path;

      if (type === 'payment') {
        await updateRegistration(regId, { payment_proof_url: path, payment_status: 'waiting_verification' });
      } else {
        await updateRegistration(regId, { submission_url: path });
      }

      alert("File berhasil diunggah!");
      fetchRegistrations();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal mengunggah file. Silakan coba lagi.");
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Memuat tiket event Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Calendar className="text-white" size={24} />
          </div>
          Event <span className="gradient-text">Saya</span>
        </h1>
        <p className="text-slate-400 text-sm mt-3 font-medium">Kelola tiket event, webinar, dan kompetisi (seperti Bug Hunter) yang Anda ikuti.</p>
      </div>

      {registrations.length === 0 ? (
        <div className="card p-12 text-center border-white/5 border-dashed">
          <Calendar className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">Belum Ada Event</h3>
          <p className="text-slate-400 mb-6">Anda belum mendaftar ke event apa pun.</p>
          <a href="/events" className="btn-primary">Cari Event Sekarang</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {registrations.map((reg) => {
            const eventInfo = reg.event;
            const isBugHunter = eventInfo.slug.includes("bug-hunter");
            const isCancelled = reg.status === 'cancelled';

            return (
              <div key={reg.id} className={`card p-6 bg-[#0c0c14] border-white/5 flex flex-col gap-6 ${isCancelled ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-3 ${
                      reg.status === 'attended' ? 'bg-emerald-500/10 text-emerald-400' 
                      : reg.status === 'cancelled' ? 'bg-red-500/10 text-red-400'
                      : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {reg.status === 'attended' ? 'Hadir' : reg.status === 'cancelled' ? 'Dibatalkan' : 'Terdaftar'}
                    </span>
                    <Link href={`/events/${eventInfo.slug}`} className="hover:text-purple-400 transition-colors">
                      <h3 className="text-xl font-bold text-white line-clamp-1">{eventInfo.title}</h3>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 space-y-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> Jadwal</p>
                    <p className="text-sm font-bold text-white">{format(new Date(eventInfo.event_date), "dd MMM yyyy HH:mm", { locale: id })}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 space-y-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1"><MapPin size={12} /> Lokasi</p>
                    <p className="text-sm font-bold text-white line-clamp-1">{eventInfo.location}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  {/* Link Akses — hanya jika sudah lunas atau gratis */}
                  {(reg.payment_status === 'paid' || reg.payment_status === 'free') && !isCancelled ? (
                     <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center text-center">
                        <CheckCircle className="text-emerald-400 mb-2" size={24} />
                        <p className="text-sm text-emerald-300 font-medium">Akses Anda Terkonfirmasi</p>
                        {eventInfo.registration_link && (
                          <a href={eventInfo.registration_link} target="_blank" rel="noopener noreferrer" className="mt-3 btn-primary !h-10 !px-6 text-xs flex items-center gap-2">
                            <ExternalLink size={14} /> Buka / Gabung Event
                          </a>
                        )}
                     </div>
                  ) : null}

                  {/* Pembayaran ditolak */}
                  {reg.payment_status === 'rejected' && (
                     <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="text-red-400" size={18} />
                          <p className="text-sm font-bold text-red-400">Pembayaran Ditolak</p>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Admin menolak bukti pembayaran Anda. Silakan unggah ulang bukti yang valid.</p>
                        <label className="btn-secondary w-full cursor-pointer flex items-center justify-center gap-2 relative">
                          <Upload size={16} /> Unggah Ulang Bukti
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(reg.id, e, 'payment')} 
                            disabled={uploading === reg.id}
                          />
                          {uploading === reg.id && <div className="absolute inset-0 bg-[#0c0c14]/80 flex flex-col items-center justify-center rounded-xl"><Loader2 className="animate-spin text-purple-500" size={20} /></div>}
                        </label>
                     </div>
                  )}

                  {/* Menunggu pembayaran untuk event berbayar */}
                  {reg.payment_status === 'pending' && eventInfo.price > 0 && (
                     <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="text-amber-400" size={18} />
                          <p className="text-sm font-bold text-amber-400">Menunggu Pembayaran</p>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Total: Rp {eventInfo.price.toLocaleString('id-ID')}</p>
                        <label className="btn-secondary w-full cursor-pointer flex items-center justify-center gap-2 relative">
                          <Upload size={16} /> Unggah Bukti Pembayaran
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(reg.id, e, 'payment')} 
                            disabled={uploading === reg.id}
                          />
                          {uploading === reg.id && <div className="absolute inset-0 bg-[#0c0c14]/80 flex flex-col items-center justify-center rounded-xl"><Loader2 className="animate-spin text-purple-500" size={20} /></div>}
                        </label>
                     </div>
                  )}

                  {/* Menunggu verifikasi */}
                  {reg.payment_status === 'waiting_verification' && (
                     <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center">
                        <Loader2 className="animate-spin text-blue-400 mx-auto mb-2" size={24} />
                        <p className="text-sm font-bold text-blue-400">Verifikasi Pembayaran</p>
                        <p className="text-xs text-slate-500">Admin sedang mengecek pembayaran Anda.</p>
                     </div>
                  )}

                  {/* Registrasi dibatalkan */}
                  {isCancelled && (
                     <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                        <XCircle className="text-red-400 mx-auto mb-2" size={24} />
                        <p className="text-sm font-bold text-red-400">Registrasi Dibatalkan</p>
                        <p className="text-xs text-slate-500">Pendaftaran Anda untuk event ini telah dibatalkan.</p>
                     </div>
                  )}

                  {/* Submission untuk Bug Hunter */}
                  {isBugHunter && !isCancelled && (
                     <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                        <div className="flex items-center gap-2 mb-2">
                           <Award className="text-purple-400" size={18} />
                           <p className="text-sm font-bold text-white">Laporan Bug (Bug Bounty)</p>
                        </div>
                        {reg.submission_url ? (
                           <div className="flex items-center justify-between mt-4 p-3 bg-white/5 rounded-xl">
                             <span className="text-xs text-emerald-400 flex items-center gap-2"><CheckCircle size={14}/> Laporan Terkirim</span>
                             <span className="text-[10px] text-slate-500">Menunggu validasi admin</span>
                           </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-400 mb-4">Unggah bukti temuan bug Anda dalam format PDF atau ZIP.</p>
                            <label className="btn-primary w-full cursor-pointer flex items-center justify-center gap-2 relative">
                              <FileText size={16} /> Submit Laporan
                              <input 
                                type="file" 
                                accept=".pdf,.zip,.rar" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(reg.id, e, 'submission')} 
                                disabled={uploading === reg.id}
                              />
                              {uploading === reg.id && <div className="absolute inset-0 bg-[#0c0c14]/80 flex flex-col items-center justify-center rounded-xl z-10"><Loader2 className="animate-spin text-white" size={20} /></div>}
                            </label>
                          </>
                        )}
                        {reg.admin_notes && (
                          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[10px] font-black tracking-widest uppercase text-amber-500 mb-1">Pesan Admin:</p>
                            <p className="text-xs text-slate-300">{reg.admin_notes}</p>
                          </div>
                        )}
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
