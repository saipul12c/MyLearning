"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import {
  getMyRegistrations,
  cancelRegistration,
  updateRegistrationProof,
  validateFile,
  FILE_UPLOAD_CONFIG,
  getEventCertificate,
  listUserCertificates,
} from "@/lib/events";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  Upload,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  Award,
  FileText,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import TicketCard from "@/app/components/events/TicketCard";
import { X, Ticket } from "lucide-react";
import NativeAdCard from "@/app/components/NativeAdCard";

import { type Promotion } from "@/lib/promotions";

export default function UserEventsClient({
  initialDashboardPromo = null,
}: {
  initialDashboardPromo?: Promotion | null;
}) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    setLoading(true);
    const data = await getMyRegistrations(user!.id);
    
    // ✅ FIX: Fetch event certificates for attended registrations that lack a certificate_url
    const enriched = await Promise.all(
      data.map(async (reg: any) => {
        if (reg.status === 'attended' && !reg.certificate_url) {
          const cert = await getEventCertificate(user!.id, reg.event_id);
          if (cert) {
            return { ...reg, certificate_url: cert.certificate_url, certificate_number: cert.certificate_number };
          }
        }
        return reg;
      })
    );
    
    setRegistrations(enriched);
    setLoading(false);
  };

  const handleFileUpload = async (
    regId: string,
    event: React.ChangeEvent<HTMLInputElement>,
    type: "payment" | "submission"
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // ✅ Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      setNotification({ type: "error", text: validation.error! });
      return;
    }

    setUploading(regId);
    setNotification(null);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${user.id}/${regId}_${Date.now()}.${fileExt}`;
      const bucket = type === "payment" ? "payments" : "submissions";

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const path = uploadData.path;
      const field = type === "payment" ? "payment_proof" : "submission";
      await updateRegistrationProof(regId, user.id, field as any, path);

      setNotification({
        type: "success",
        text: "File berhasil diunggah!",
      });
      fetchRegistrations();
    } catch (error: any) {
      setNotification({
        type: "error",
        text: error.message || "Gagal mengunggah file. Silakan coba lagi.",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleCancelRegistration = async (regId: string) => {
    if (!user) return;
    if (!confirm("Yakin ingin membatalkan registrasi event ini?")) return;

    setCancelling(regId);
    setNotification(null);
    try {
      await cancelRegistration(regId, user.id);
      setNotification({
        type: "success",
        text: "Registrasi berhasil dibatalkan.",
      });
      fetchRegistrations();
    } catch (error: any) {
      setNotification({
        type: "error",
        text: error.message || "Gagal membatalkan registrasi.",
      });
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-sm font-medium animate-pulse">
          Memuat tiket event Anda...
        </p>
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

      {notification && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-fade-in ${
          notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {notification.text}
          <button onClick={() => setNotification(null)} className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity"><X size={16} /></button>
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="card p-12 text-center border-white/5 border-dashed">
          <Calendar className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">Belum Ada Event</h3>
          <p className="text-slate-400 mb-6">Anda belum mendaftar ke event apa pun.</p>
          <Link href="/events" className="btn-primary">Cari Event Sekarang</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {registrations.map((reg) => {
            const eventInfo = reg.event;
            const isBugHunter = eventInfo.slug.includes("bug-hunter");
            const isCancelled = reg.status === 'cancelled';
            const isWaitlisted = reg.status === 'waitlisted';
            const canCancel = !isCancelled && reg.status !== 'attended' && new Date(eventInfo.event_date) > new Date();

            return (
              <div key={reg.id} className={`card p-6 bg-[#0c0c14] border-white/5 flex flex-col gap-6 ${isCancelled ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-3 ${
                      reg.status === 'attended' ? 'bg-emerald-500/10 text-emerald-400' 
                      : reg.status === 'cancelled' ? 'bg-red-500/10 text-red-400'
                      : reg.status === 'waitlisted' ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {reg.status === 'attended' ? 'Hadir' : reg.status === 'cancelled' ? 'Dibatalkan' : reg.status === 'waitlisted' ? 'Waiting List' : 'Terdaftar'}
                    </span>
                    <Link href={`/events/${eventInfo.slug}`} className="hover:text-purple-400 transition-colors">
                      <h3 className="text-xl font-bold text-white line-clamp-1">{eventInfo.title}</h3>
                    </Link>
                  </div>
                  {canCancel && (
                    <button 
                      onClick={() => handleCancelRegistration(reg.id)}
                      disabled={cancelling === reg.id}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 shrink-0"
                    >
                      {cancelling === reg.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                      Batalkan
                    </button>
                  )}
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
                         <div className="flex gap-3 mt-4 w-full">
                            <button 
                              onClick={() => setExpandedTicketId(expandedTicketId === reg.id ? null : reg.id)}
                              className="flex-1 btn-secondary !h-10 !px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                               <Ticket size={14} /> {expandedTicketId === reg.id ? 'Tutup Tiket' : 'Lihat Tiket'}
                            </button>
                            {eventInfo.registration_link && (
                              <a href={eventInfo.registration_link} target="_blank" rel="noopener noreferrer" className="flex-1 btn-primary !h-10 !px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <ExternalLink size={14} /> Buka Event
                              </a>
                            )}
                         </div>
                      </div>
                   ) : null}

                  {/* ✅ Sertifikat untuk peserta yang hadir */}
                  {reg.status === 'attended' && reg.certificate_url && !isCancelled && (
                    <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex flex-col items-center justify-center text-center">
                      <Award className="text-purple-400 mb-2" size={24} />
                      <p className="text-sm text-purple-300 font-medium">Sertifikat Tersedia</p>
                      <p className="text-[10px] text-slate-500 mt-1">Anda berhak mendapatkan sertifikat kehadiran event ini.</p>
                      <a
                        href={reg.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 btn-primary !h-10 !px-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <FileText size={14} /> Unduh Sertifikat
                      </a>
                    </div>
                  )}

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
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden" 
                            onChange={(e) => handleFileUpload(reg.id, e, 'payment')} 
                            disabled={uploading === reg.id}
                          />
                          {uploading === reg.id && <div className="absolute inset-0 bg-[#0c0c14]/80 flex flex-col items-center justify-center rounded-xl"><Loader2 className="animate-spin text-purple-500" size={20} /></div>}
                        </label>
                        <p className="text-[10px] text-slate-500 mt-2 text-center">Max 10MB • Format: PDF, JPEG, PNG</p>
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
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden" 
                            onChange={(e) => handleFileUpload(reg.id, e, 'payment')} 
                            disabled={uploading === reg.id}
                          />
                          {uploading === reg.id && <div className="absolute inset-0 bg-[#0c0c14]/80 flex flex-col items-center justify-center rounded-xl"><Loader2 className="animate-spin text-purple-500" size={20} /></div>}
                        </label>
                        <p className="text-[10px] text-slate-500 mt-2 text-center">Max 10MB • Format: PDF, JPEG, PNG</p>
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
                            <p className="text-xs text-slate-400 mb-4">Unggah bukti temuan bug Anda dalam format PDF.</p>
                            <label className="btn-primary w-full cursor-pointer flex items-center justify-center gap-2 relative">
                              <FileText size={16} /> Submit Laporan
                              <input 
                                type="file" 
                                accept=".pdf"
                                className="hidden" 
                                onChange={(e) => handleFileUpload(reg.id, e, 'submission')} 
                                disabled={uploading === reg.id}
                              />
                              {uploading === reg.id && <div className="absolute inset-0 bg-[#0c0c14]/80 flex flex-col items-center justify-center rounded-xl z-10"><Loader2 className="animate-spin text-white" size={20} /></div>}
                            </label>
                            <p className="text-[10px] text-slate-500 mt-2 text-center">Max 10MB • Format: PDF</p>
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

                {/* Inline Ticket Display */}
                {expandedTicketId === reg.id && (
                  <div className="mt-8 pt-8 border-t border-white/5 animate-fade-in flex flex-col items-center gap-10 w-full">
                     <div className="w-full shrink-0">
                       <TicketCard 
                         registration={{
                           id: reg.id,
                           status: reg.status,
                           createdAt: reg.created_at,
                           event: {
                             title: eventInfo.title,
                             eventDate: eventInfo.event_date,
                             location: eventInfo.location,
                             shortDescription: eventInfo.short_description
                           },
                           userProfile: {
                             fullName: reg.profile?.full_name || user?.fullName || "Peserta MyLearning"
                           }
                         }} 
                       />
                     </div>
                     
                     <div className="w-full max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2 px-4 py-1 rounded-full border border-white/5 bg-white/[0.02]">
                              <Sparkles size={10} className="text-purple-500" />
                              Sponsor & Partner
                           </div>
                           <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                        </div>
                        <NativeAdCard 
                          location="dashboard_card" 
                          variant="inline" 
                          className="w-full shadow-2xl shadow-purple-500/5" 
                          initialPromo={initialDashboardPromo} 
                        />
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
