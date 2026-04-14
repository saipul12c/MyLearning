"use client";

import { useState, useMemo, useEffect } from "react";
import { type Course } from "@/lib/data";
import { 
  calculateAdPrice, 
  PromotionLocation, 
  LOCATION_MULTIPLIERS,
  upsertPromotionRequest,
  PromotionRequest
} from "@/lib/promotions";
import { 
  X, 
  Megaphone, 
  Eye, 
  Calendar, 
  ChevronRight, 
  CheckCircle, 
  Upload, 
  Loader2,
  AlertCircle,
  CreditCard,
  Sparkles,
  Info
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { uploadPaymentProofToStorage } from "@/lib/storage";
import { useAuth } from "./AuthContext";
import PromotionCard from "./PromotionCard";
import { Promotion } from "@/lib/promotions";

interface PromotionRequestModalProps {
  course: Course;
  onClose: () => void;
}

const VIEW_PACKAGES = [
  { label: "1,000 Views", value: 1000 },
  { label: "5,000 Views", value: 5000 },
  { label: "10,000 Views", value: 10000 },
  { label: "25,000 Views", value: 25000 },
  { label: "50,000 Views", value: 50000 },
];

const DURATION_OPTIONS = [1, 3, 7, 30, 60, 90];

export default function PromotionRequestModal({ course, onClose }: PromotionRequestModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<PromotionLocation>("homepage_banner");
  const [views, setViews] = useState(1000);
  const [duration, setDuration] = useState(7);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = useMemo(() => {
    return calculateAdPrice(views, duration, location);
  }, [views, duration, location]);

  const handleSubmit = async () => {
    if (!user || !paymentProof) return;
    
    setSubmitting(true);
    setError(null);
    
    const res = await upsertPromotionRequest({
      userId: user.id,
      courseId: course.id,
      title: `Promo: ${course.title}`,
      description: course.description || "No description provided.",
      imageUrl: course.thumbnail || "",
      linkUrl: `/courses/${course.slug}`,
      location,
      targetImpressions: views,
      durationDays: duration,
      totalPrice: totalPrice,
      amountPaid: totalPrice,
      paymentProofUrl: paymentProof,
      status: "waiting_verification"
    });

    if (res.success) {
      setStep(3);
    } else {
      setError(res.error || "Gagal mengirim pengajuan.");
    }
    setSubmitting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { url, error: uploadError } = await uploadPaymentProofToStorage(file);
    if (uploadError) {
      setError("Gagal mengunggah bukti transer.");
    } else {
      setPaymentProof(url);
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-[#0c0c14] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-3xl my-8">
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-white/2 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center">
                <Megaphone className="text-purple-400" size={24} />
             </div>
             <div>
                <h2 className="text-white font-bold text-xl tracking-tight">Promosikan Kursus</h2>
                <p className="text-slate-500 text-xs font-medium">{course.title}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"><X size={24} /></button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Location Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-purple-500" /> Penempatan Iklan
                  </label>
                  <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value as PromotionLocation)}
                    className="input-field !py-3 bg-white/5 border-white/10 text-white"
                  >
                    <option value="homepage_banner">Homepage Banner (1.3x)</option>
                    <option value="global_announcement">Global Top Bar (1.6x)</option>
                    <option value="course_listing">Course Listing (1.2x)</option>
                    <option value="dashboard_card">Dashboard Card (1.1x)</option>
                    <option value="course_sidebar">Sidebar Spotlight (1.0x)</option>
                  </select>
                </div>

                {/* Live Preview Display (Responsive) */}
                <div className="md:row-span-2 space-y-3">
                   <label className="text-[10px] font-black uppercase text-purple-500 tracking-widest ml-1 flex items-center gap-1.5">
                      Pratinjau Langsung
                   </label>
                   <div className="relative rounded-2xl border border-dashed border-white/10 p-4 bg-white/2 min-h-[120px] flex items-center justify-center">
                      <div className="w-full h-full scale-[0.8] md:scale-100 origin-center transition-all duration-500">
                        <PromotionCard 
                          isPreview
                          variant={location === 'course_sidebar' ? 'spotlight' : location === 'homepage_banner' || location === 'global_announcement' ? 'banner' : 'card'}
                          promotion={{
                            id: 'preview',
                            title: `Promo: ${course.title}`,
                            description: course.description?.substring(0, 100) || "Lihat materi kursus terbaik kami...",
                            imageUrl: course.thumbnail || "",
                            linkUrl: "#",
                            location: location,
                            badgeText: location === 'global_announcement' ? 'PENGUMUMAN' : 'PARTNER',
                            isActive: true,
                            isExternal: false,
                            priority: 5,
                            targetImpressions: views,
                            currentImpressions: 0,
                            currentClicks: 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          }}
                        />
                      </div>
                   </div>
                </div>

                {/* Duration Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                    <Calendar size={12} className="text-cyan-500" /> Masa Aktif
                  </label>
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="input-field !py-3 bg-white/5 border-white/10 text-white"
                  >
                    {DURATION_OPTIONS.map(d => (
                      <option key={d} value={d}>{d} Hari</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Packages */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                    <Eye size={12} className="text-emerald-500" /> Pilih Target Penayangan (Impressions)
                 </label>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {VIEW_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.value}
                        onClick={() => setViews(pkg.value)}
                        className={`p-4 rounded-2xl border transition-all text-center group ${
                          views === pkg.value 
                          ? "bg-purple-600/20 border-purple-500 text-white" 
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20"
                        }`}
                      >
                         <div className={`text-lg font-black ${views === pkg.value ? "text-purple-400" : "text-white"}`}>{pkg.label.split(' ')[0]}</div>
                         <div className="text-[10px] font-bold opacity-60">VIEWS</div>
                      </button>
                    ))}
                 </div>
              </div>

              {/* Summary Card */}
              <div className="card p-6 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 border-white/10">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h4 className="text-white font-bold text-sm">Estimasi Biaya</h4>
                       <p className="text-slate-400 text-xs">Transparan & Fleksibel</p>
                    </div>
                    <div className="text-right">
                       <div className="text-3xl font-black text-white">{formatPrice(totalPrice)}</div>
                       <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mt-1">Total Pembayaran</div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full btn-primary !py-5 font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 group"
              >
                Lanjutkan ke Pembayaran <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
                     <Info size={18} className="shrink-0" />
                     Silahkan transfer sesuai nominal ke rekening MyLearning dan unggah struk sebagai bukti verifikasi.
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/10">
                        <div className="flex items-center gap-3">
                           <CreditCard size={20} className="text-slate-400" />
                           <span className="text-slate-300 text-sm font-medium">BCA (Manual Transfer)</span>
                        </div>
                        <span className="text-white font-bold text-sm font-mono tracking-wider">1234-567-890</span>
                     </div>
                     <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/10">
                        <div className="flex items-center gap-3">
                           <CreditCard size={20} className="text-slate-400" />
                           <span className="text-slate-300 text-sm font-medium">Mandiri (Manual Transfer)</span>
                        </div>
                        <span className="text-white font-bold text-sm font-mono tracking-wider">0987-654-321</span>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Upload Bukti Transfer</label>
                     <div className="relative group">
                        <label className={`flex flex-col items-center justify-center w-full h-40 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer ${
                          paymentProof ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:border-purple-500/40'
                        }`}>
                          {uploading ? (
                            <Loader2 className="animate-spin text-purple-500" size={32} />
                          ) : paymentProof ? (
                             <>
                               <CheckCircle size={32} className="text-emerald-400 mb-2" />
                               <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Selesai Diunggah</span>
                             </>
                          ) : (
                            <>
                              <Upload className="text-slate-500 group-hover:text-purple-400 mb-2 transition-colors" size={32} />
                              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest group-hover:text-purple-300 transition-colors">Klik untuk Unggah</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                     </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                       <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex-1 btn-secondary !py-4 font-black uppercase tracking-widest text-xs"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={!paymentProof || submitting}
                      className="flex-[2] btn-primary !py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      Kirim Pengajuan
                    </button>
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
             <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                   <CheckCircle className="text-emerald-400" size={48} />
                </div>
                <div>
                   <h3 className="text-white font-black text-2xl tracking-tight">Pengajuan Terkirim!</h3>
                   <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2 leading-relaxed">
                     Admin akan memverifikasi pembayaran dan konten iklan Anda dalam maksimal 24 jam.
                   </p>
                </div>
                <button 
                  onClick={onClose}
                  className="btn-primary !py-4 px-10 font-black uppercase tracking-widest text-xs inline-flex"
                >
                  Selesai
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
