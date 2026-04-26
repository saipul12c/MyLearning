"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { getEventRegistrants, updateRegistration } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { 
  Calendar, Users, ArrowLeft, Loader2, CheckCircle, Clock, XCircle, FileText, Download, Edit
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminEventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  
  // Modal states
  const [manageReg, setManageReg] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [attendance, setAttendance] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isAdmin && eventId) {
      fetchData();
    }
  }, [isAdmin, eventId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch event info
    const { data: eData } = await supabase.from("platform_events").select("*").eq("id", eventId).single();
    setEventData(eData);
    
    // Fetch registrants
    const rData = await getEventRegistrants(eventId);
    setRegistrants(rData.data);
    setLoading(false);
  };

  const openManageModal = (reg: any) => {
    setManageReg(reg);
    setPaymentStatus(reg.payment_status || "free");
    setAttendance(reg.status || "registered");
    setAdminNotes(reg.admin_notes || "");
  };

  const handleUpdate = async () => {
    if (!manageReg) return;
    setUpdating(true);
    try {
      await updateRegistration(manageReg.id, {
        status: attendance,
        payment_status: paymentStatus,
        admin_notes: adminNotes
      });
      setManageReg(null);
      fetchData();
    } catch (error) {
      alert("Gagal update data.");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = async (bucket: string, path: string, label: string) => {
    const key = `${bucket}:${path}`;
    setDownloadingFile(key);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Signed URL error:', error);
      alert(`Gagal membuka ${label}. Pastikan file ada di storage.`);
    } finally {
      setDownloadingFile(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <Link href="/dashboard/admin/events" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">Kembali ke Event Utama</span>
      </Link>

      <div className="card p-8 bg-[#0c0c14] border-white/5 space-y-4">
         <h1 className="text-3xl font-black text-white">{eventData?.title}</h1>
         <div className="flex gap-4">
            <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest">{eventData?.location}</span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest">{eventData?.price === 0 ? 'Gratis' : `Rp ${eventData?.price.toLocaleString('id-ID')}`}</span>
         </div>
      </div>

      <div className="card border-white/5 bg-[#0c0c14] overflow-hidden">
         <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-bold flex items-center gap-2 text-white"><Users size={18} className="text-purple-400" /> Kelola Peserta</h3>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total : {registrants.length}</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Peserta</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Auth / Presensi</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pembayaran & Bukti</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registrants.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-4">
                       <p className="font-bold text-white text-sm">{reg.profile?.full_name || 'Tanpa Nama'}</p>
                       <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{reg.profile?.role}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-[10px] items-center gap-1 inline-flex font-black uppercase tracking-widest ${reg.status === 'attended' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                         {reg.status === 'attended' ? <CheckCircle size={10} /> : <Clock size={10}/>} {reg.status}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="space-y-2">
                           <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${reg.payment_status === 'paid' || reg.payment_status === 'free' ? 'bg-emerald-500/10 text-emerald-400' : reg.payment_status === 'waiting_verification' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-500'}`}>
                             {reg.payment_status}
                           </span>

                           {(reg.payment_proof_url || reg.submission_url) && (
                              <div className="flex gap-2 mt-2">
                                 {reg.payment_proof_url && (
                                   <button 
                                     onClick={() => handleDownload('payments', reg.payment_proof_url, 'Bukti Pembayaran')}
                                     disabled={downloadingFile === `payments:${reg.payment_proof_url}`}
                                     className="btn-secondary !h-7 !px-3 text-[10px] !bg-cyan-500/10 !text-cyan-400 border-none flex items-center gap-1"
                                   >
                                     {downloadingFile === `payments:${reg.payment_proof_url}` 
                                       ? <Loader2 size={10} className="animate-spin" /> 
                                       : <Download size={10} />} Bukti Trx
                                   </button>
                                 )}
                                 {reg.submission_url && (
                                   <button 
                                     onClick={() => handleDownload('submissions', reg.submission_url, 'Submission')}
                                     disabled={downloadingFile === `submissions:${reg.submission_url}`}
                                     className="btn-secondary !h-7 !px-3 text-[10px] !bg-purple-500/10 !text-purple-400 border-none flex items-center gap-1"
                                   >
                                     {downloadingFile === `submissions:${reg.submission_url}` 
                                       ? <Loader2 size={10} className="animate-spin" /> 
                                       : <Download size={10} />} Submission
                                   </button>
                                 )}
                              </div>
                           )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => openManageModal(reg)} className="btn-primary !h-8 !px-4 text-[10px]">Verifikasi</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>

      {manageReg && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0c0c14] border border-white/10 rounded-3xl w-full max-w-lg p-6 space-y-6">
                <h3 className="text-xl font-bold">Verifikasi Peserta</h3>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Status Pembayaran</label>
                          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input w-full">
                             <option value="free">Gratis (Free)</option>
                             <option value="pending">Menunggu (Pending)</option>
                             <option value="waiting_verification">Cek Bukti (Waiting)</option>
                             <option value="paid">Lunas (Paid)</option>
                             <option value="rejected">Ditolak (Rejected)</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Status Presensi</label>
                          <select value={attendance} onChange={(e) => setAttendance(e.target.value)} className="input w-full">
                             <option value="registered">Terdaftar</option>
                             <option value="attended">Hadir</option>
                             <option value="waitlisted">Waiting List</option>
                             <option value="cancelled">Batal</option>
                          </select>
                       </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Catatan Admin (Bisa Berisi Kode Voucher untuk Bug Hunter)</label>
                      <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Berikan ucapan selamat atau kode voucher rahasia di sini..." className="input w-full resize-none"></textarea>
                   </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                   <button onClick={() => setManageReg(null)} className="btn-secondary">Tutup</button>
                   <button onClick={handleUpdate} disabled={updating} className="btn-primary px-8">
                      {updating ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Status'}
                   </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
