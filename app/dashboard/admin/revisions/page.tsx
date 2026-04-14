"use client";

import { useState, useEffect } from "react";
import { 
  getPendingCertificateRevisions, 
  processCertificateRevision,
  getCertificateRevisionHistory
} from "@/lib/certificates";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  ShieldCheck, 
  Search,
  Mail,
  FileText,
  Loader2,
  History,
  Info,
  Send,
  X
} from "lucide-react";

export default function AdminRevisionsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [revisions, setRevisions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  
  // Rejection Modal State
  const [rejectionModal, setRejectionModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (activeTab === "pending") fetchRevisions();
    else fetchHistory();
  }, [activeTab]);

  const fetchRevisions = async () => {
    setLoading(true);
    const data = await getPendingCertificateRevisions();
    setRevisions(data);
    setLoading(false);
  };

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getCertificateRevisionHistory();
    setHistory(data);
    setLoading(false);
  };

  const handleAction = async (certId: string, status: "approved" | "rejected", notes?: string) => {
    if (status === "approved") {
      if (!confirm(`Apakah Anda yakin ingin menyetujui pengajuan ini? Nama akan otomatis terupdate di sertifikat.`)) return;
    }
    
    setProcessing(certId);
    const res = await processCertificateRevision(certId, status, notes);
    if (res.success) {
      if (activeTab === "pending") {
        setRevisions(revisions.filter(r => r.id !== certId));
      }
      setRejectionModal(null);
      setRejectionReason("");
    } else {
      alert("Gagal memproses: " + res.error);
    }
    setProcessing(null);
  };

  const list = activeTab === "pending" ? revisions : history;
  const filtered = list.filter(r => 
    r.certificate_number?.toLowerCase().includes(filter.toLowerCase()) ||
    r.user_name?.toLowerCase().includes(filter.toLowerCase()) ||
    r.requested_name?.toLowerCase().includes(filter.toLowerCase()) ||
    r.user_profiles?.full_name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manajemen <span className="gradient-text">Revisi Sertifikat</span></h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Tinjau dan proses pengajuan perbaikan nama sertifikat dari siswa.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Cari ID atau Nama..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all w-full md:w-[320px]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/2 border border-white/5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          <Clock size={16} /> Pending ({revisions.length})
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          <History size={16} /> History
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-purple-500" size={48} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-24 text-center border-dashed border-white/5 bg-transparent">
           <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <ShieldCheck size={40} className="text-emerald-500/50" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Kosong Melompong</h3>
           <p className="text-slate-500 max-w-xs mx-auto text-sm">Tidak ada data revisi yang ditemukan untuk kategori ini.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((rev) => (
            <div key={rev.id} className="card p-0 overflow-hidden border-white/10 hover:border-purple-500/20 transition-all group">
              <div className="flex flex-col lg:flex-row">
                {/* Left Side: Info */}
                <div className="flex-1 p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {rev.revision_status === 'pending' ? (
                          <span className="text-[10px] font-black bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Request Pending</span>
                        ) : rev.revision_status === 'approved' ? (
                          <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Approved</span>
                        ) : (
                          <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Rejected</span>
                        )}
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {rev.certificate_number}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white leading-tight">{rev.course_title}</h3>
                    </div>
                    <div className="hidden sm:block text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{rev.revision_status === 'pending' ? 'Diajukan Pada' : 'Diproses Pada'}</p>
                       <p className="text-white font-bold text-sm">
                        {new Date(rev.revision_status === 'pending' ? rev.issued_at : rev.processed_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                       </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 p-6 bg-white/2 rounded-3xl border border-white/5">
                     <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={12} /> NAMA SAAT INI</p>
                          <p className={`text-white font-bold text-lg ${rev.revision_status === 'approved' ? 'line-through opacity-50' : ''}`}>{rev.user_name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShieldCheck size={12} /> NAMA YANG DIAJUKAN</p>
                          <p className="text-emerald-400 font-black text-xl">{rev.requested_name}</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Mail size={12} /> KONTAK SISWA</p>
                           <p className="text-white font-medium text-sm">{rev.user_profiles?.full_name}</p>
                           <p className="text-slate-500 text-xs mt-0.5">{rev.user_profiles?.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={12} /> ALASAN PERBAIKAN</p>
                          <p className="text-slate-400 text-xs italic leading-relaxed">
                            {rev.revision_reason || "Tidak ada alasan yang disertakan."}
                          </p>
                        </div>
                     </div>
                  </div>

                  {/* Admin Notes in History */}
                  {rev.admin_notes && (
                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info size={12} /> CATATAN ADMIN</p>
                      <p className="text-slate-300 text-xs italic">{rev.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Side: Actions (Only for Pending) */}
                {rev.revision_status === 'pending' && (
                  <div className="lg:w-72 bg-white/2 border-t lg:border-t-0 lg:border-l border-white/5 p-8 flex lg:flex-col justify-center gap-4">
                    <button 
                      onClick={() => handleAction(rev.id, "approved")}
                      disabled={!!processing}
                      className="flex-1 btn-primary !py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {processing === rev.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      APPROVE
                    </button>
                    <button 
                      onClick={() => setRejectionModal({ id: rev.id, name: rev.requested_name })}
                      disabled={!!processing}
                      className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {processing === rev.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      REJECT
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setRejectionModal(null)} />
          <div className="relative bg-[#0c0c14] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-3xl">
            <div className="p-8 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <h2 className="text-white font-bold text-xl tracking-tight">Tolak <span className="text-red-500">Pengajuan</span></h2>
              <button onClick={() => setRejectionModal(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Target Revisi</p>
                <p className="text-white font-bold">{rejectionModal.name}</p>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-center italic">Berikan Alasan Penolakan</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-red-500/50 transition-all text-sm min-h-[120px] resize-none"
                  placeholder="Contoh: Nama tidak sesuai dengan identitas resmi atau mengandung karakter terlarang."
                  required
                />
              </div>
              <button 
                onClick={() => handleAction(rejectionModal.id, "rejected", rejectionReason)}
                disabled={!rejectionReason.trim() || !!processing}
                className="w-full bg-red-600 text-white !py-5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-red-500/20 disabled:opacity-50 transition-all"
              >
                {processing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                PROSES PENOLAKAN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-center gap-6 pt-12 text-slate-600">
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
           <ShieldCheck size={14} /> MyLearning Secure Admin
         </div>
         <div className="w-1 h-1 bg-slate-700 rounded-full" />
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
           <Clock size={14} /> Platfrom v2.5.0-Release (Enhanced)
         </div>
      </div>
    </div>
  );
}

