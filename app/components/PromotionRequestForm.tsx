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
import { uploadPaymentProofToStorage, uploadPromotionImage } from "@/lib/storage";
import { useAuth } from "./AuthContext";
import PromotionCard from "./PromotionCard";
import { Promotion } from "@/lib/promotions";

interface PromotionRequestFormProps {
  course?: Course;
  mode?: "custom" | "course";
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

export default function PromotionRequestForm({ course: initialCourse, mode, onClose }: PromotionRequestFormProps) {
  const { user, isInstructor, isAdmin } = useAuth();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<PromotionLocation>("homepage_banner");
  const [views, setViews] = useState(1000);
  const [duration, setDuration] = useState(7);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse || null);
  const [customTitle, setCustomTitle] = useState(initialCourse ? `Promo: ${initialCourse.title}` : "");
  const [customDesc, setCustomDesc] = useState(initialCourse?.description?.substring(0, 150) || "");
  const [customImage, setCustomImage] = useState(initialCourse?.thumbnail || "");
  const [customLink, setCustomLink] = useState(initialCourse ? `/courses/${initialCourse.slug}` : "");
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const initialMode = initialCourse ? "course" : (mode || "custom");
  
  // Instructor courses for selection
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if ((isInstructor || isAdmin) && !initialCourse) {
      const fetchMyCourses = async () => {
        const { getCourses } = await import("@/lib/courses");
        const { getInstructorProfile } = await import("@/lib/instructor");
        
        setLoadingCourses(true);
        try {
          let instructorId;
          if (isInstructor && !isAdmin && user) {
            const prof = await getInstructorProfile(user.id);
            if (prof) instructorId = prof.id;
          }
          
          const data = await getCourses({ 
            instructorId: instructorId,
            status: 'published'
          });
          setMyCourses(data);
          
          if (initialMode === "course" && data.length > 0 && !selectedCourse) {
             setSelectedCourse(data[0]);
             setCustomTitle(`Promo: ${data[0].title}`);
             setCustomDesc(data[0].description?.substring(0, 150) || "");
             setCustomImage(data[0].thumbnail || "");
             setCustomLink(`/courses/${data[0].slug}`);
          }
        } catch (err) {
          console.error("Error fetching courses for promo:", err);
        }
        setLoadingCourses(false);
      };
      fetchMyCourses();
    }
  }, [isInstructor, isAdmin, user, initialCourse]);

  // Handle course selection
  useEffect(() => {
    if (selectedCourse && !initialCourse) {
       setCustomTitle(`Promo: ${selectedCourse.title}`);
       setCustomDesc(selectedCourse.description?.substring(0, 150) || "");
       setCustomImage(selectedCourse.thumbnail || "");
       setCustomLink(`/courses/${selectedCourse.slug}`);
    }
  }, [selectedCourse, initialCourse]);

  const LOCATION_DESCRIPTIONS: Record<PromotionLocation, string> = {
    all: "Ditayangkan di SELURUH lokasi iklan yang tersedia secara bersamaan! Jangkauan maksimal.",
    global_announcement: "Pita promosi warna-warni yang selalu melekat di paling atas layar seluruh halaman web.",
    homepage_banner: "Banner raksasa / karosel di atas beranda yang sangat menyita perhatian.",
    homepage_inline: "Diselipkan secara natural menyerupai kursus biasa di lini beranda.",
    dashboard_card: "Kartu khusus di dashboard pelajar, cocok untuk promosi retensi pelanggan.",
    course_sidebar: "Sorotan premium di bilah sisi materi kursus yang sering dilihat secara vertikal.",
    course_listing: "Berada tepat di tengah halaman pencarian (katalog kursus) standar.",
    course_listing_spotlight: "Banner dominan di halaman pencarian, dijamin menangkap mata audiens.",
    lesson_sidebar: "Tampil di bilah samping saat pelajar sedang asyik menonton video pembelajaran.",
    quiz_success: "Muncul seketika sebagai kejutan (pop-up) ketika pelajar berhasil menyelesaikan kuis.",
    verify_page: "Penempatan khusus pada halaman verifikasi sertifikat kursus yang sangat bergengsi.",
    search_recovery: "Menjadi rekomendasi cerdas ketika pencarian kursus pelajar tidak membuahkan hasil.",
    footer_native: "Penempatan elegan yang menyatu pada bagian terbawah situs (footer).",
    sticky_bottom: "Pop-up bar bawah layar yang terus mengikuti ketika pelajar menggulir layar secara dinamis.",
    interstitial: "Iklan besar yang mengambil alih layar sesaat, layaknya tayangan TV premium berbatas waktu.",
    video_card: "Iklan video otomatis yang terputar senyap seakan menceritakan detail promonya langsung.",
    privacy_sidebar: "Penempatan eksklusif di bilah sisi halaman Kebijakan Privasi yang memberikan kesan formal dan terpercaya.",
    privacy_policy_inline: "Disisipkan secara elegan di antara poin-poin hukum kebijakan privasi, menjangkau audiens yang teliti.",
    event_listing: "Iklan premium yang muncul secara natural di antara daftar event di galeri event Platform.",
    event_sidebar: "Penempatan strategis di bilah sisi halaman detail event, tepat di samping formulir pendaftaran.",
    event_detail_inline: "Iklan yang menyatu di dalam konten deskripsi pada halaman detail event untuk engagement tinggi.",
    instructor_tips: "Menampilkan konten promosi khusus di baris tips instruktur di dashboard panel pengajar.",
    student_engagement: "Posisi strategis di dashboard instruktur untuk mempromosikan tools atau kursus engagement siswa."
  };

  const totalPrice = useMemo(() => {
    return calculateAdPrice(views, duration, location);
  }, [views, duration, location]);

  const handleSubmit = async () => {
    if (!user || !paymentProof) return;
    
    setSubmitting(true);
    setError(null);
    
    const res = await upsertPromotionRequest({
      userId: user.id,
      courseId: selectedCourse?.id,
      title: customTitle,
      description: customDesc || "No description provided.",
      imageUrl: customImage || selectedCourse?.thumbnail || "",
      linkUrl: customLink || (selectedCourse ? `/courses/${selectedCourse.slug}` : "#"),
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
      setError("Gagal mengunggah bukti transfer.");
    } else {
      setPaymentProof(url);
    }
    setUploading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { url, error: uploadError } = await uploadPromotionImage(file);
    if (uploadError) {
      setError("Gagal mengunggah gambar iklan.");
    } else if (url) {
      setCustomImage(url);
    }
    setUploadingImage(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-12 mt-4">
      <div className="relative flex flex-col bg-white/[0.02] border border-white/10 w-full rounded-[3rem] shadow-3xl">
        {/* Header */}
        <div className="sticky top-0 z-20 p-6 sm:p-8 border-b border-white/5 bg-[#0c0c14]/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <Megaphone className="text-white" size={24} />
             </div>
             <div>
                <h2 className="text-white font-black text-xl tracking-tight leading-none mb-1">Kreator Spotlight</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">
                  {selectedCourse ? `PROMOSI: ${selectedCourse.title.substring(0, 30)}...` : "IKLAN UMUM & BRANDING"}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"><X size={24} /></button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {/* Course Selection (if not pre-selected and mode is course) */}
              {!initialCourse && initialMode === "course" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                    1. Pilih Kursus yang Ingin Dipromosikan
                  </label>
                  <select 
                    value={selectedCourse?.id || ""}
                    onChange={(e) => {
                       const c = myCourses.find(x => x.id === e.target.value);
                       setSelectedCourse(c || null);
                    }}
                    className="input-field !py-3 bg-white/5 border-white/10 text-white text-xs"
                  >
                    <option value="" disabled>-- Pilih Kursus Anda --</option>
                    {myCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Ad Content */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-purple-500 tracking-widest ml-1 flex items-center gap-1.5">
                  <Sparkles size={12} /> Desain Kreatif Iklan
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between ml-1 mb-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Judul Iklan</label>
                      <span className="text-[10px] text-slate-500 font-bold">{customTitle.length}/60</span>
                    </div>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value.slice(0, 60))}
                      className="input-field !py-3 bg-white/5 border-white/10 text-white text-sm"
                      placeholder="Judul iklan yang menarik..."
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between ml-1 mb-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Deskripsi</label>
                      <span className="text-[10px] text-slate-500 font-bold">{customDesc.length}/150</span>
                    </div>
                    <textarea
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value.slice(0, 150))}
                      className="input-field !py-3 bg-white/5 border-white/10 text-white text-xs min-h-[70px] resize-none"
                      placeholder="Deskripsi singkat yang memikat..."
                      maxLength={150}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 mb-1.5 block">Gambar Iklan</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="url"
                        value={customImage}
                        onChange={(e) => setCustomImage(e.target.value)}
                        className="input-field flex-1 !py-3 bg-white/5 border-white/10 text-white text-xs"
                        placeholder="URL gambar atau unggah..."
                      />
                      <label className="cursor-pointer shrink-0">
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                        <div className={`h-full px-4 rounded-xl border border-white/10 flex items-center justify-center transition-all ${uploadingImage ? 'opacity-50 cursor-not-allowed bg-white/5' : 'bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 text-purple-400'}`}>
                          {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        </div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 mb-1.5 block">Tautan Tujuan (URL)</label>
                    <input
                      type="text"
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                      className="input-field !py-3 bg-white/5 border-white/10 text-white text-xs"
                      placeholder="https://mylearning.id/..."
                    />
                  </div>
                </div>
              </div>

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
                    <option value="global_announcement">Global Top Bar (1.6x)</option>
                    <option value="homepage_banner">Homepage Banner (1.3x)</option>
                    <option value="homepage_inline">Homepage Inline (1.0x)</option>
                    <option value="dashboard_card">Dashboard Card (1.1x)</option>
                    <option value="course_sidebar">Course Sidebar Spotlight (1.0x)</option>
                    <option value="course_listing">Course Listing Standard (1.2x)</option>
                    <option value="course_listing_spotlight">Course Listing Spotlight (1.4x)</option>
                    <option value="lesson_sidebar">Lesson Sidebar (0.9x)</option>
                    <option value="quiz_success">Quiz Success Notification (1.5x)</option>
                    <option value="verify_page">Certificate Verify Page (0.9x)</option>
                    <option value="search_recovery">Empty Search Recovery (0.8x)</option>
                    <option value="footer_native">Footer Native Ad (0.8x)</option>
                    <option value="sticky_bottom">Sticky Bottom Ad (1.5x)</option>
                    <option value="interstitial">Full Screen Interstitial (2.0x)</option>
                    <option value="video_card">Autoplay Video Card (1.5x)</option>
                    <option value="privacy_sidebar">Privacy Sidebar (1.0x)</option>
                    <option value="privacy_policy_inline">Privacy Policy Inline (1.1x)</option>
                    <option value="event_listing">Event Gallery Listing (1.2x)</option>
                    <option value="event_sidebar">Event Detail Sidebar (1.1x)</option>
                    <option value="event_detail_inline">Event Detail Inline (1.2x)</option>
                    <option value="instructor_tips">Instructor Tips Row (1.1x)</option>
                    <option value="student_engagement">Student Engagement Row (1.1x)</option>
                  </select>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl mt-2">
                     <p className="text-[11px] text-purple-200 leading-relaxed font-medium">
                        {LOCATION_DESCRIPTIONS[location]}
                     </p>
                  </div>
                </div>

                {/* Live Preview Display (Responsive) */}
                 <div className="md:row-span-2 space-y-3">
                   <label className="text-[10px] font-black uppercase text-purple-500 tracking-widest ml-1 flex items-center gap-1.5">
                      Pratinjau Langsung
                   </label>
                   <div className="relative rounded-2xl border border-dashed border-white/10 overflow-x-hidden overflow-y-auto bg-white/2 flex items-start justify-center h-[350px] custom-scrollbar">
                      <div className="w-full flex justify-center scale-[0.75] origin-top transition-all duration-500 p-2 sm:p-4">
                        <PromotionCard 
                          isPreview
                          variant={location.includes('sidebar') || location.includes('spotlight') ? 'spotlight' : (location.includes('banner') || location.includes('announcement') || location.includes('sticky')) ? 'banner' : 'card'}
                          promotion={{
                            id: 'preview',
                            title: customTitle,
                            description: customDesc || "Lihat materi kursus terbaik kami...",
                            imageUrl: customImage || "",
                            videoUrl: location === 'video_card' ? 'dummy.mp4' : undefined,
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
                  <input 
                    type="number"
                    min="1"
                    max="365"
                    value={duration}
                    onChange={(e) => setDuration(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="input-field !py-3 bg-white/5 border-white/10 text-white"
                    placeholder="Masukkan jumlah hari..."
                  />
                </div>
              </div>

              {/* View Packages */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                    <Eye size={12} className="text-emerald-500" /> Tentukan Target Penayangan (Impressions) Manual
                 </label>
                 <input 
                    type="number"
                    min="1000"
                    max="1000000"
                    step="500"
                    value={views}
                    onChange={(e) => setViews(Math.min(1000000, Math.max(10, parseInt(e.target.value) || 10)))}
                    className="input-field !py-3 bg-white/5 border-white/10 text-white text-lg font-mono tracking-widest"
                    placeholder="Contoh: 10000"
                 />
                 <p className="text-[10px] text-slate-500 ml-1">Minimal target: 10 impressions.</p>
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
