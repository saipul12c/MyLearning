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
  Link as LinkIcon,
  CreditCard,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Filter,
  AlertTriangle,
  ImageOff
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

// Safe image component with fallback for broken/unsupported images (.ico, 400 errors, etc.)
function SafeImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if file extension is unsupported by Next.js Image optimizer
  const isUnsupportedFormat = /\.(ico|svg|bmp|tiff?)$/i.test(src);

  if (error || !src) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
        <ImageOff size={40} className="opacity-40" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Gambar Gagal Dimuat</span>
      </div>
    );
  }

  // Use native <img> for unsupported formats to avoid Next.js optimization errors
  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <Loader2 size={20} className="animate-spin text-slate-600" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
      />
    </>
  );
}

export default function AdRequestsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
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

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    
    // NOTE: SQL trigger handle_ad_approval() automatically creates the live promotion
    const res = await upsertPromotionRequest({
      ...selectedRequest,
      status: "active",
    });

    if (res.success) {
      await createNotification({
        userId: selectedRequest.userId,
        title: "Iklan Disetujui! 🚀",
        message: `Pengajuan iklan '${selectedRequest.title}' Anda telah disetujui dan kini aktif.`,
        type: 'success',
        linkUrl: '/dashboard/ads'
      });

      await fetchRequests();
      setSelectedRequest(null);
      setShowApproveConfirm(false);
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

  const handleBack = () => {
    setSelectedRequest(null);
    setShowRejectForm(false);
    setShowApproveConfirm(false);
    setRejectReason("");
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

  const filteredRequests = requests.filter(r => statusFilter === 'all' || r.status === statusFilter);

  // ============== DETAIL VIEW (Inline, bukan pop-up) ==============
  if (selectedRequest) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
        {/* Back Button */}
        <button 
          onClick={handleBack}
          className="group text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded uppercase tracking-widest">
                {selectedRequest.location.replace(/_/g, " ")}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 ${
                selectedRequest.status === 'waiting_verification' ? 'bg-amber-500/10 text-amber-500' :
                selectedRequest.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                selectedRequest.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'
              }`}>
                {selectedRequest.status === 'waiting_verification' ? <Clock size={10} /> : selectedRequest.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {selectedRequest.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{selectedRequest.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-emerald-400 font-black text-2xl">{formatPrice(selectedRequest.totalPrice)}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Biaya</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Ad Preview */}
          <div className="space-y-6">
            <div className="card overflow-hidden border-white/5">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-purple-400" /> Preview Iklan
                </h3>
              </div>
              <div className="relative aspect-video bg-black/40">
                {selectedRequest.imageUrl ? (
                  <SafeImage 
                    src={selectedRequest.imageUrl} 
                    alt={selectedRequest.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
                    <ImageIcon size={48} className="opacity-30" />
                    <span className="text-xs font-bold">Tidak ada gambar iklan</span>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">"{selectedRequest.description}"</p>
                <Link 
                  href={selectedRequest.linkUrl} 
                  target="_blank" 
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors"
                >
                  <ExternalLink size={12} /> Buka Link Iklan
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 bg-white/[0.02] border-white/5 text-center">
                <div className="text-2xl font-black text-white">{selectedRequest.targetImpressions.toLocaleString()}</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Target Views</div>
              </div>
              <div className="card p-5 bg-white/[0.02] border-white/5 text-center">
                <div className="text-2xl font-black text-white">{selectedRequest.durationDays} Hari</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Masa Aktif</div>
              </div>
            </div>
          </div>

          {/* Right: Payment Proof + Actions */}
          <div className="space-y-6">
            <div className="card overflow-hidden border-white/5">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={14} className="text-emerald-400" /> Bukti Pembayaran
                </h3>
                <span className="text-emerald-400 font-black text-sm">{formatPrice(selectedRequest.totalPrice)}</span>
              </div>
              <div className="relative aspect-[3/4] bg-black/40">
                {selectedRequest.paymentProofUrl ? (
                  <>
                    <SafeImage 
                      src={selectedRequest.paymentProofUrl} 
                      alt="Bukti Transfer" 
                      className="w-full h-full object-contain"
                    />
                    <a 
                      href={selectedRequest.paymentProofUrl} 
                      target="_blank" 
                      className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2 transition-all"
                    >
                      <ExternalLink size={12} /> Lihat Asli
                    </a>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
                    <AlertTriangle size={48} className="opacity-30 text-amber-500" />
                    <span className="text-xs font-bold">Bukti Belum Diunggah</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {selectedRequest.status === 'waiting_verification' && (
              <div className="space-y-4">
                {showApproveConfirm ? (
                  <div className="card p-6 space-y-4 border-emerald-500/30 bg-emerald-500/[0.02] shadow-2xl shadow-emerald-500/10 animate-in slide-in-from-bottom-2 duration-300">
                    <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                      <CheckCircle size={14} /> Konfirmasi Persetujuan
                    </label>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Apakah Anda yakin ingin menyetujui iklan <strong className="text-white">{selectedRequest.title}</strong>? 
                      Iklan akan <strong className="text-emerald-400">langsung tayang</strong> sesuai durasi dan penempatan yang dipilih.
                    </p>
                    <div className="flex gap-3 pt-2 border-t border-white/5">
                      <button onClick={() => setShowApproveConfirm(false)} className="flex-1 btn-secondary !py-3 text-xs uppercase font-bold text-slate-400 hover:text-white hover:bg-white/5 border-transparent">
                        Batal
                      </button>
                      <button onClick={confirmApprove} disabled={isProcessing} className="flex-[2] btn-primary !bg-emerald-500 hover:!bg-emerald-400 text-slate-900 !py-3 text-xs uppercase font-black flex items-center justify-center gap-2">
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
                        Ya, Aktifkan Iklan
                      </button>
                    </div>
                  </div>
                ) : showRejectForm ? (
                  <div className="card p-6 space-y-4 border-red-500/20 animate-in slide-in-from-bottom-2 duration-300">
                    <label className="text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-2">
                      <XCircle size={12} /> Alasan Penolakan
                    </label>
                    <textarea 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Contoh: Bukti transfer tidak valid atau judul iklan melanggar kebijakan..."
                      className="input-field min-h-[120px] border-red-500/20 focus:border-red-500/50"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => setShowRejectForm(false)} className="flex-1 btn-secondary !py-3 text-xs uppercase font-bold">Batal</button>
                      <button onClick={handleReject} disabled={isProcessing || !rejectReason} className="flex-1 btn-primary !bg-red-500 !py-3 text-xs uppercase font-bold flex items-center justify-center gap-2">
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Kirim Penolakan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowRejectForm(true)}
                      className="flex-1 btn-secondary !py-4 text-xs font-black uppercase tracking-widest text-red-500 border-red-500/20 hover:bg-red-500/5"
                    >
                      Tolak Pengajuan
                    </button>
                    <button 
                      onClick={() => setShowApproveConfirm(true)}
                      disabled={isProcessing}
                      className="flex-[1.5] btn-primary !py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group shadow-2xl shadow-purple-500/20"
                    >
                      {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />}
                      Setujui & Aktifkan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Admin Notes (for rejected) */}
            {selectedRequest.status === 'rejected' && selectedRequest.adminNotes && (
              <div className="card p-6 border-red-500/10 bg-red-500/[0.02]">
                <label className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2 block">Alasan Penolakan</label>
                <p className="text-slate-400 text-sm">{selectedRequest.adminNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============== LIST VIEW ==============
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

      {filteredRequests.length === 0 ? (
        <div className="card py-20 text-center border-dashed border-white/5">
          <Megaphone size={48} className="text-slate-800 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg">Tidak Ada Pengajuan</h3>
          <p className="text-slate-500 text-sm">Tidak ada pengajuan iklan dengan status tersebut.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => (
          <div 
            key={req.id} 
            className="card p-5 group hover:border-purple-500/30 transition-all cursor-pointer"
            onClick={() => setSelectedRequest(req)}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
               {/* Ad Preview Thumbnail */}
               <div className="relative w-full md:w-40 aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                  {req.imageUrl ? (
                      <SafeImage src={req.imageUrl} alt={req.title} className="w-full h-full object-cover" />
                  ) : (
                      <div className="flex items-center justify-center h-full"><ImageIcon className="text-slate-700" size={24} /></div>
                  )}
               </div>

               <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                     <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded uppercase tracking-widest">
                        {req.location.replace(/_/g, " ")}
                     </span>
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 ${
                       req.status === 'waiting_verification' ? 'bg-amber-500/10 text-amber-500' :
                       req.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                       req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'
                     }`}>
                        {req.status === 'waiting_verification' ? <Clock size={10} /> : req.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {req.status.replace(/_/g, " ")}
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
      )}
    </div>
  );
}
