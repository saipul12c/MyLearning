"use client";

import { useState, useEffect } from "react";
import { getAllEnrollmentsAdmin, forceExpireEnrollment, completeCourseAdmin, verifyPayment, REJECTION_REASONS } from "@/lib/enrollment";
import { BookMarked, CheckCircle, XCircle, Clock, Filter, Eye, ThumbsUp, ThumbsDown, X, Tag } from "lucide-react";
import Image from "next/image";
import ErrorState from "@/app/components/ui/ErrorState";
import { formatPrice } from "@/lib/data";

import { useAuth } from "@/app/components/AuthContext";
import { getInstructorProfile } from "@/lib/instructor";

export default function AdminEnrollmentsPage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedProof, setSelectedProof] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);

  // 1. Get instructor profile if needed
  useEffect(() => {
    if (isInstructor && !isAdmin && user) {
      const fetchInstructor = async () => {
        const profile = await getInstructorProfile(user.id);
        if (profile) setInstructorId(profile.id);
      };
      fetchInstructor();
    }
  }, [isInstructor, isAdmin, user]);

  // 2. Fetch Data
  useEffect(() => {
    let isMounted = true;
    
    // If instructor and we don't have instructorId yet, wait
    if (isInstructor && !isAdmin && !instructorId) return;

    const fetchData = async () => {
      try {
        if (enrollments.length === 0) {
           setLoading(true);
        } else {
           setIsFiltering(true);
        }
        
        const { data, totalCount: count, error: fetchErr } = await getAllEnrollmentsAdmin(
          page, 
          pageSize, 
          statusFilter,
          instructorId || undefined
        );
        
        if (isMounted) {
          if (fetchErr) {
            setError(fetchErr);
          } else {
            setEnrollments(data);
            setTotalCount(count);
            setError(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Fetch enrollments error:", err);
          setError("Gagal memuat daftar pendaftaran.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsFiltering(false);
        }
      }
    };

    fetchData();
    
    return () => { isMounted = false; };
  }, [refresh, page, statusFilter, instructorId, isAdmin, isInstructor]);

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1); // Reset to first page on filter change
  };

  const handleExpire = async (id: string) => {
    if (confirm("Expire enrollment ini?")) {
      await forceExpireEnrollment(id);
      setRefresh((r) => r + 1);
    }
  };

  const handleComplete = async (id: string) => {
    if (confirm("Tandai enrollment ini sebagai selesai?")) {
      await completeCourseAdmin(id);
      setRefresh((r) => r + 1);
    }
  };

  const handleVerify = async (id: string, approve: boolean) => {
    const reason = approve ? undefined : rejectionReason;
    
    // Save old state in case we need to roll back
    const oldEnrollments = [...enrollments];
    
    // Optimistically update UI
    setEnrollments(prev => prev.filter(enr => enr.id !== id));
    setTotalCount(prev => prev - 1);
    setSelectedProof(null);
    setIsRejecting(null);

    const result = await verifyPayment(id, approve, reason);
    
    if (!result.success) {
      // Rollback on failure
      setEnrollments(oldEnrollments);
      setTotalCount(oldEnrollments.length);
      alert("Gagal melakukan verifikasi: " + result.error);
    }
  };

  if (error) {
    return (
      <div className="py-20">
        <ErrorState 
          message={error} 
          onRetry={() => setRefresh(r => r + 1)} 
        />
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
    <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
    Memuat data pendaftaran...
  </div>;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Kelola <span className="gradient-text">Enrollment</span></h1>
        <p className="text-slate-400 text-sm mt-1">{totalCount} total enrollment</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        <Filter size={14} className="text-slate-500 shrink-0" />
        {["all", "pending", "waiting_verification", "active", "completed", "expired", "rejected", "failed", "refunded"].map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              statusFilter === s ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/5 text-slate-500 hover:text-slate-300"
            }`}
          >
            {s === "all" ? "Semua" : 
             s === "pending" ? "Pending" :
             s === "waiting_verification" ? "Perlu Verifikasi" : 
             s === "active" ? "Aktif" : 
             s === "completed" ? "Selesai" : 
             s === "expired" ? "Expired" :
             s === "rejected" ? "Ditolak" : 
             s === "failed" ? "Gagal (3x)" : "Refunded"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden relative">
        {isFiltering && (
           <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="bg-[#0f0f1a] p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-3">
                 <div className="w-5 h-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                 <span className="text-white text-xs font-bold uppercase tracking-widest">Sinkronisasi...</span>
              </div>
           </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Pengguna</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Kursus</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Progress</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Tidak ada enrollment</td></tr>
              ) : (
                enrollments.map((enr) => {
                  return (
                    <tr key={enr.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-white">{enr.userName || "Siswa"}</td>
                      <td className="px-5 py-3 text-slate-300 text-xs">{enr.courseTitle}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${enr.progress}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{enr.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          enr.status === "active" ? "bg-cyan-500/15 text-cyan-400" :
                          enr.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                          enr.status === "waiting_verification" ? "bg-amber-500/15 text-amber-400 animate-pulse" :
                          enr.status === "rejected" ? "bg-red-500/15 text-red-400" :
                          enr.status === "failed" ? "bg-red-600/20 text-red-500" :
                          enr.status === "refunded" ? "bg-purple-500/15 text-purple-400" :
                          enr.status === "pending" ? "bg-slate-500/15 text-slate-300" :
                          "bg-slate-500/15 text-slate-400"
                        }`}>
                          {enr.status === "active" ? "Aktif" : 
                           enr.status === "completed" ? "Selesai" : 
                           enr.status === "waiting_verification" ? "Verifikasi" : 
                           enr.status === "rejected" ? "Ditolak" :
                           enr.status === "failed" ? "Gagal 3x" : 
                           enr.status === "refunded" ? "Refunded" :
                           enr.status === "pending" ? "Pending" : "Expired"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-500 text-xs">
                        {new Date(enr.enrolledAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          {enr.status === "waiting_verification" && (
                            <button 
                              onClick={() => setSelectedProof(enr)}
                              className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center gap-1"
                            >
                              <Eye size={12} /> Cek Bukti
                            </button>
                          )}
                          {enr.status === "active" && (
                            <>
                              <button onClick={() => handleComplete(enr.id)} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                                Selesaikan
                              </button>
                              <button onClick={() => handleExpire(enr.id)} className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                Expire
                              </button>
                            </>
                          )}
                          {enr.status === "rejected" && (
                              <span className="text-slate-500 italic">Ditolak ({enr.paymentRetryCount}x)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
           <p className="text-xs text-slate-500">
             Menampilkan <span className="text-white font-bold">{(page - 1) * pageSize + 1}</span> - <span className="text-white font-bold">{Math.min(page * pageSize, totalCount)}</span> dari <span className="text-white font-bold">{totalCount}</span> data
           </p>
           <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= totalCount || loading}
                className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
           </div>
        </div>
      )}

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#0f0f1a] rounded-2xl border border-white/10 max-w-xl w-full overflow-hidden flex flex-col shadow-2xl scale-in-center">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-white font-bold">Verifikasi Bukti Bayar</h3>
              <button onClick={() => { setSelectedProof(null); setIsRejecting(null); }} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <div className="mb-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Pengguna</p>
                    <p className="text-white font-bold text-sm">{selectedProof.userName || "Akun Terhapus"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Kursus</p>
                    <p className="text-purple-400 font-medium text-xs truncate">{selectedProof.courseTitle}</p>
                  </div>
                  {selectedProof.discountAmount > 0 && (
                    <div className="col-span-2 mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-emerald-400" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Voucher:</span>
                        <span className="text-emerald-400 font-black text-xs">{(selectedProof as any).voucher?.code || "DISKON"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mr-2">Potongan:</span>
                        <span className="text-white font-bold text-xs">-{formatPrice(selectedProof.discountAmount)}</span>
                      </div>
                    </div>
                  )}
                  <div className="col-span-2 mt-2 pt-2 border-t border-white/5 flex items-center justify-between bg-white/2 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Bayar (Sesuai Struk):</span>
                    <span className="text-cyan-400 font-black text-sm">{formatPrice(selectedProof.paymentAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="h-64 sm:h-80 bg-black rounded-xl border border-white/10 relative overflow-hidden mb-6 shadow-inner">
                {selectedProof.paymentProofUrl ? (
                  <Image 
                    src={selectedProof.paymentProofUrl} 
                    alt="Payment Proof" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600">Bukti tidak ditemukan</div>
                )}
              </div>

              {isRejecting ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="text-xs text-slate-500 block mb-2">Pilih Alasan Penolakan:</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:border-red-500/50 outline-none"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    >
                      {REJECTION_REASONS.map(r => <option key={r} value={r} className="bg-[#0f0f1a]">{r}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsRejecting(null)} className="btn-secondary !py-2 text-xs">Batal</button>
                    <button onClick={() => handleVerify(selectedProof.id, false)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                      Konfirmasi Tolak
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsRejecting(selectedProof.id)}
                    className="flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/10 text-red-400 py-3 rounded-xl hover:bg-red-500/20 transition-all font-bold"
                  >
                    <ThumbsDown size={18} /> Tolak
                  </button>
                  <button 
                    onClick={() => handleVerify(selectedProof.id, true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all font-bold"
                  >
                    <ThumbsUp size={18} /> Setujui
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
