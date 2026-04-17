"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { 
  getAllPromotionRequests, 
  upsertPromotionRequest, 
  PromotionRequest 
} from "@/lib/promotions";
import { createNotification } from "@/lib/notifications";
import { 
  Loader2, 
  ArrowLeft, 
  Megaphone, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Clock, 
  Eye,
  AlertCircle,
  Link as LinkIcon,
  X,
  CreditCard,
  Image as ImageIcon,
  ChevronRight,
  Filter
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export default function AdRequestsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("waiting_verification");

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin]);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getAllPromotionRequests();
    setRequests(data);
    setLoading(false);
  };

  const handleApprove = async (req: PromotionRequest) => {
    if (!confirm("Setujui iklan ini? Iklan akan langsung aktif setelah disetujui.")) return;
    
    setIsProcessing(true);
    
    // Update request status to 'active'
    // NOTE: SQL trigger handle_ad_approval() automatically creates the live promotion
    // when the status changes to 'active', so we do NOT manually call upsertPromotion()
    const res = await upsertPromotionRequest({
      ...req,
      status: "active",
    });

    if (res.success) {
      // Send notification to instructor
      await createNotification({
        userId: req.userId,
        title: "Iklan Disetujui! 🚀",
        message: `Pengajuan iklan '${req.title}' Anda telah disetujui dan kini aktif.`,
        type: 'success',
        linkUrl: '/dashboard/ads'
      });

      await fetchRequests();
      setSelectedRequest(null);
    } else {
      alert("Gagal mengaktifkan promo: " + res.error);
    }
    
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason) return;
    
    setIsProcessing(true);
    const res = await upsertPromotionRequest({
      ...selectedRequest,
      status: "rejected",
      adminNotes: rejectReason
    });

    if (res.success) {
      // Send notification to instructor
      await createNotification({
        userId: selectedRequest.userId,
        title: "Iklan Ditolak ❌",
        message: `Pengajuan iklan '${selectedRequest.title}' Anda ditolak. Alasan: ${rejectReason}`,
        type: 'error',
        linkUrl: '/dashboard/ads'
      });

      await fetchRequests();
      setSelectedRequest(null);
      setShowRejectForm(false);
      setRejectReason("");
    } else {
      alert("Gagal menolak: " + res.error);
    }
    setIsProcessing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading requests...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-300">Ad Requests</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Megaphone size={20} className="text-purple-400" />
             </div>
             Verifikasi <span className="gradient-text">Pengajuan Iklan</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Validasi bukti transfer dan kelayakan konten iklan dari pengguna.</p>
        </div>
        
        <Link href="/dashboard" className="group text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </Link>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: "Pendapatan Iklan", 
              value: formatPrice(requests.filter(r => r.status === 'active' || r.status === 'completed').reduce((sum, r) => sum + r.totalPrice, 0)),
              color: "text-emerald-400",
              icon: CreditCard
            },
            { 
              label: "Potensi Pendapatan", 
              value: formatPrice(requests.filter(r => r.status === 'waiting_verification').reduce((sum, r) => sum + r.totalPrice, 0)),
              color: "text-amber-400",
              icon: Clock
            },
            { 
              label: "Total Tayangan", 
              value: requests.filter(r => r.status === 'active').reduce((sum, r) => sum + r.targetImpressions, 0).toLocaleString(),
              color: "text-purple-400",
              icon: Eye
            },
            { 
              label: "Antrian Aktif", 
              value: requests.filter(r => r.status === 'waiting_verification').length,
              color: "text-white",
              icon: Megaphone
            }
          ].map((stat, i) => (
            <div key={i} className="card p-5 bg-white/[0.02] border-white/5 group hover:border-white/10 transition-all">
               <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                     <stat.icon size={16} />
                  </div>
                  <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
               </div>
               <div className={`text-xl font-black tracking-tight ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4 overflow-x-auto">
         <Filter size={14} className="text-slate-500 flex-shrink-0" />
         {['all', 'waiting_verification', 'active', 'rejected', 'completed'].map(status => (
            <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  statusFilter === status ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'
               }`}
            >
               {status === 'all' ? 'Semua' : status === 'waiting_verification' ? 'Pending' : status}
            </button>
         ))}
      </div>

      {(() => {
        const filteredRequests = requests.filter(r => statusFilter === 'all' || r.status === statusFilter);
        if (filteredRequests.length === 0) {
          return (
            <div className="card py-20 text-center border-dashed border-white/5">
              <Megaphone size={48} className="text-slate-800 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg">Tidak Ada Pengajuan</h3>
              <p className="text-slate-500 text-sm">Tidak ada pengajuan iklan dengan status tersebut.</p>
            </div>
          );
        }
        return (
          <div className="grid gap-4">
            {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className={`card p-5 group hover:border-purple-500/30 transition-all cursor-pointer ${selectedRequest?.id === req.id ? 'border-purple-500/50 ring-1 ring-purple-500/20 shadow-2xl' : ''}`}
              onClick={() => setSelectedRequest(req)}
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                 {/* Ad Preview Thumbnail */}
                 <div className="relative w-full md:w-40 aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                    {req.imageUrl ? (
                        <Image src={req.imageUrl} alt={req.title} fill className="object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full"><ImageIcon className="text-slate-700" size={24} /></div>
                    )}
                 </div>

                 <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                       <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded uppercase tracking-widest">
                          {req.location.replace("_", " ")}
                       </span>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 ${
                         req.status === 'waiting_verification' ? 'bg-amber-500/10 text-amber-500' :
                         req.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                         req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'
                       }`}>
                          {req.status === 'waiting_verification' ? <Clock size={10} /> : req.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {req.status.replace("_", " ")}
                       </span>
                    </div>
                    <h4 className="text-white font-bold">{req.title}</h4>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-500 font-medium">
                       <span className="flex items-center gap-1"><Eye size={12} /> {req.targetImpressions.toLocaleString()} Views</span>
                       <span className="flex items-center gap-1"><Clock size={12} /> {req.durationDays} Hari</span>
                       <span className="flex items-center gap-1 text-emerald-500/80"><CreditCard size={12} /> {formatPrice(req.totalPrice)}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 px-6 border-l border-white/5">
                    <ChevronRight size={24} className="text-slate-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                  </div>
               </div>
            </div>
          ))}
        </div>
        );
      })()}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setSelectedRequest(null)} />
          <div className="relative bg-[#0c0c14] border border-white/10 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-3xl my-8">
             <div className="grid lg:grid-cols-2">
                {/* Proof Section */}
                <div className="p-8 bg-black/40 border-r border-white/5 space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                         <CreditCard size={14} className="text-purple-500" /> Bukti Pembayaran
                      </h3>
                      <span className="text-emerald-400 font-black text-lg">{formatPrice(selectedRequest.totalPrice)}</span>
                   </div>
                   
                   <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-white/5 group">
                      {selectedRequest.paymentProofUrl ? (
                         <Image 
                            src={selectedRequest.paymentProofUrl} 
                            alt="Bukti Transfer" 
                            fill 
                            className="object-contain" 
                         />
                      ) : (
                         <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30 text-slate-500">
                            <ImageIcon size={48} />
                            <span className="text-xs font-bold">Bukti Belum Diunggah</span>
                         </div>
                      )}
                      
                      {selectedRequest.paymentProofUrl && (
                        <a 
                          href={selectedRequest.paymentProofUrl} 
                          target="_blank" 
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white font-bold gap-2"
                        >
                           <ExternalLink size={20} /> Lihat Fullscreen
                        </a>
                      )}
                   </div>
                </div>

                {/* Info Section */}
                <div className="p-10 flex flex-col justify-between">
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                               <ImageIcon size={18} className="text-purple-400" />
                            </div>
                            <div>
                               <h2 className="text-white font-bold text-xl">{selectedRequest.title}</h2>
                               <p className="text-slate-500 text-xs font-medium">Penempatan: {selectedRequest.location}</p>
                            </div>
                         </div>
                         <button onClick={() => setSelectedRequest(null)} className="text-slate-600 hover:text-white transition-colors"><X size={24} /></button>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Detail Promosi</label>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 text-center">
                               <div className="text-xl font-black text-white">{selectedRequest.targetImpressions.toLocaleString()}</div>
                               <div className="text-[9px] font-black text-slate-500 uppercase">Target Views</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 text-center">
                               <div className="text-xl font-black text-white">{selectedRequest.durationDays} Hari</div>
                               <div className="text-[9px] font-black text-slate-500 uppercase">Masa Aktif</div>
                            </div>
                         </div>
                         <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                            <p className="text-slate-400 text-xs leading-relaxed italic">"{selectedRequest.description}"</p>
                            <Link href={selectedRequest.linkUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 mt-2 uppercase">
                               Lihat Konten <ExternalLink size={10} />
                            </Link>
                         </div>
                      </div>

                      {showRejectForm ? (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                           <label className="text-[10px] font-black uppercase text-red-500 tracking-widest">Alasan Penolakan</label>
                           <textarea 
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Contoh: Bukti transfer tidak valid atau judul iklan melanggar kebijakan..."
                              className="input-field min-h-[100px] border-red-500/20 focus:border-red-500/50"
                           />
                           <div className="flex gap-2">
                              <button onClick={() => setShowRejectForm(false)} className="flex-1 btn-secondary !py-3 text-xs uppercase font-bold">Batal</button>
                              <button onClick={handleReject} disabled={isProcessing || !rejectReason} className="flex-1 btn-primary !bg-red-500 !py-3 text-xs uppercase font-bold flex items-center justify-center gap-2">
                                 {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Kirim Penolakan
                              </button>
                           </div>
                        </div>
                      ) : (
                         <div className="flex gap-4 pt-10">
                            {selectedRequest.status === 'waiting_verification' && (
                               <>
                                <button 
                                    onClick={() => setShowRejectForm(true)}
                                    className="flex-1 btn-secondary !py-5 text-xs font-black uppercase tracking-widest text-red-500 border-red-500/20 hover:bg-red-500/5"
                                >
                                    Tolak Pengajuan
                                </button>
                                <button 
                                    onClick={() => handleApprove(selectedRequest)}
                                    disabled={isProcessing}
                                    className="flex-[1.5] btn-primary !py-5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group shadow-2xl shadow-purple-500/20"
                                >
                                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />}
                                    Setujui & Aktifkan
                                </button>
                               </>
                            )}
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
