"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, MapPin, Clock, Share2, ArrowLeft, ArrowRight, CheckCircle, 
  AlertCircle, Loader2, Sparkles, Shield, UserCheck, Users,
  Globe, Info, DollarSign, ExternalLink, XCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import { getEventBySlug, registerForEvent, checkIfRegistered, PlatformEvent } from "@/lib/events";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import NativeAdCard from "../../components/NativeAdCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CountdownTimer from "../../components/events/CountdownTimer";
import AddToCalendar from "../../components/events/AddToCalendar";
import SpeakerSection from "../../components/events/SpeakerSection";

// Social Icons as simple SVG components for compatibility
const SocialIcons = {
  WhatsApp: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-4.821 4.991l-.001.001h-.001zM12.012 21C10.15 21 8.332 20.505 6.746 19.569l-.369-.219-4.381 1.15 1.169-4.27-.24-.381C1.96 14.3 1.444 12.193 1.444 10.009 1.444 4.197 6.183.47 12.016.47c2.825 0 5.482 1.102 7.481 3.102 1.999 1.999 3.1 4.656 3.1 7.481 0 5.812-4.738 10.536-10.585 10.536" />
    </svg>
  ),
  Facebook: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  Twitter: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  LinkedIn: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Copy: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
};

export default function EventDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (slug && !authLoading) {
      fetchEvent();
    }
  }, [slug, authLoading]);

  const fetchEvent = async () => {
    setLoading(true);
    const data = await getEventBySlug(slug as string);
    if (data) {
      setEvent(data);
      if (isLoggedIn && user) {
        const result = await checkIfRegistered(data.id, user.id);
        setIsRegistered(result.registered && result.status !== 'cancelled');
        setRegistrationStatus(result.status || null);
      }
    }
    setLoading(false);
  };

  const handleShare = (platform: string) => {
    if (!event) return;
    
    const url = window.location.href;
    const text = `Ayo ikuti event "${event.title}" di MyLearning!`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopying(true);
          setTimeout(() => setCopying(false), 2000);
        });
        break;
    }
  };

  const handleRegister = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${slug}`);
      return;
    }

    if (!event || !user) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const result = await registerForEvent(event.id, user.id);
      setIsRegistered(true);
      setRegistrationStatus(result.status || 'registered');
      
      if (result.status === 'waitlisted') {
        setMessage({ type: 'info', text: result.message });
      } else {
        setMessage({ type: 'success', text: result.message });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setMessage({ type: 'error', text: error.message || 'Gagal mendaftar. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-purple-500" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Menyiapkan Informasi Event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center p-8">
        <div className="card p-12 text-center max-w-md">
          <AlertCircle className="mx-auto text-red-500 mb-6" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">Event Tidak Ditemukan</h2>
          <p className="text-slate-500 mb-8">Maaf, acara yang kamu cari tidak tersedia atau mungkin sudah dihapus.</p>
          <Link href="/events" className="btn-primary w-full">Kembali ke Galeri</Link>
        </div>
      </div>
    );
  }

  const isPast = new Date(event.eventDate) < new Date();
  const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : new Date(event.eventDate);
  const isRegistrationClosed = registrationDeadline < new Date();
  const isSoldOut = (event.registrationCount || 0) >= (event.maxSlots || 100);
  const remainingSlots = Math.max(0, (event.maxSlots || 100) - (event.registrationCount || 0));

  return (
    <div className="min-h-screen bg-[#09090f] text-white selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[150px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 relative">
        {/* Navigation */}
        <Link 
          href="/events" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Kembali ke Semua Event</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Hero Image/Banner */}
            <div className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#0c0c14] shadow-2xl">
              {event.thumbnailUrl ? (
                <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Calendar size={64} className="text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-transparent to-transparent" />
              
              <div className="absolute bottom-8 left-8">
                 <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 rounded-full bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20">
                       Platform Event
                    </span>
                    {event.isFeatured && (
                       <span className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                         Featured
                       </span>
                    )}
                 </div>
              </div>
            </div>

            {/* Event Title & Meta */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-6">
                 <div className="flex items-center gap-3 text-slate-400">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-purple-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</p>
                      <p className="font-bold text-white">{format(new Date(event.eventDate), "d MMMM yyyy", { locale: id })}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-purple-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waktu</p>
                      <p className="font-bold text-white">{format(new Date(event.eventDate), "HH:mm")} WIB</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-purple-400">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lokasi</p>
                      <p className="font-bold text-white">{event.location}</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Countdown Section */}
            {!isPast && (
              <div className="card p-10 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent border-purple-500/20">
                <CountdownTimer targetDate={event.eventDate} />
              </div>
            )}

            {/* Description Section */}
            <div className="card p-10 bg-[#0c0c14] border-white/5 space-y-8">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                 <Info className="text-purple-500" size={24} />
                 <h2 className="text-xl font-bold uppercase tracking-widest">Tentang Event</h2>
              </div>
              
              <div className="prose prose-invert prose-purple max-w-none">
                <p className="text-lg text-slate-300 leading-relaxed font-medium">
                  {event.shortDescription}
                </p>
                <div className="h-px bg-white/5 my-8" />
                <div className="text-slate-400 leading-relaxed prose prose-invert prose-purple max-w-none 
                  prose-p:text-slate-400 prose-p:leading-relaxed prose-p:mb-4
                  prose-headings:text-white prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold
                  prose-li:text-slate-400 prose-li:my-1
                  prose-strong:text-purple-400 prose-strong:font-bold
                  prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:px-1 prose-code:rounded
                  prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5 prose-pre:p-4
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {event.description || "Tidak ada deskripsi tambahan untuk event ini."}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Speaker Profiles */}
            {event.speakerInfo && event.speakerInfo.length > 0 && (
              <div className="card p-10 bg-[#0c0c14] border-white/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] -mr-32 -mt-32" />
                <SpeakerSection speakers={event.speakerInfo} />
              </div>
            )}

            {/* In-content Ad Placement */}
            <NativeAdCard 
              location="event_detail_inline" 
              variant="inline" 
              className="mt-8 shadow-xl shadow-purple-500/5"
            />

            {/* FAQ/Note Section */}
            <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-6">
               <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 flex-shrink-0">
                  <Shield size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-2">Informasi Penting</h4>
                  <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                    <li>Link akses {event.location === 'Online' ? 'Zoom/YouTube' : 'detail lokasi'} akan dikirimkan otomatis setelah mendaftar.</li>
                    <li>Sertifikat kehadiran akan diberikan maksimal 2 hari setelah acara selesai.</li>
                    <li>Harap hadir 15 menit sebelum acara dimulai untuk proses verifikasi.</li>
                  </ul>
               </div>
            </div>
          </div>

          {/* Registration Sidebar */}
          <div className="space-y-8">
             <div className="sticky top-24 card p-8 bg-[#0c0c14] border-white/10 shadow-3xl">
                <div className="space-y-6">
                   <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                         <span>Tipe Acara</span>
                         <span className="text-white">{event.location}</span>
                      </div>
                       <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Tingkat Kesulitan</span>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            event.level === 'Starter' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            event.level === 'Accelerator' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {event.level || 'Starter'}
                          </span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Biaya Pendaftaran</span>
                          <span className="text-2xl font-black text-white">
                            {event.price === 0 ? <span className="text-emerald-400">GRATIS</span> : `Rp ${event.price.toLocaleString('id-ID')}`}
                          </span>
                       </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sisa Kuota</span>
                       <span className={`text-sm font-black ${remainingSlots < 10 ? 'text-red-400' : 'text-white'}`}>
                          {remainingSlots} / {event.maxSlots || 100} Kursi
                       </span>
                    </div>

                   {isPast ? (
                     <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 text-center">
                        <AlertCircle className="mx-auto text-red-500 mb-3" size={32} />
                        <p className="text-sm font-bold text-red-400">Event Sudah Selesai</p>
                        {event.recordingUrl && (
                          <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 !h-10 !px-6 text-xs inline-flex items-center gap-2">
                            <ExternalLink size={14} /> Tonton Rekaman
                          </a>
                        )}
                     </div>
                   ) : isRegistrationClosed ? (
                     <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-center">
                        <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
                        <p className="text-sm font-bold text-amber-400">Pendaftaran Ditutup</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Batas waktu registrasi sudah lewat</p>
                     </div>
                   ) : isRegistered ? (
                     <div className="space-y-4">
                        <div className={`p-6 rounded-3xl border text-center animate-bounce-in ${
                          registrationStatus === 'waitlisted' 
                            ? 'bg-amber-500/10 border-amber-500/20' 
                            : 'bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                           {registrationStatus === 'waitlisted' ? (
                             <>
                               <Clock className="mx-auto text-amber-400 mb-3" size={40} />
                               <p className="text-lg font-black text-white">Dalam Waiting List</p>
                               <p className="text-xs text-amber-400 mt-1">Kami akan memberi tahu jika ada slot tersedia.</p>
                             </>
                           ) : (
                             <>
                               <CheckCircle className="mx-auto text-emerald-400 mb-3" size={40} />
                               <p className="text-lg font-black text-white">Sudah Terdaftar!</p>
                               {event.price > 0 ? (
                                 <p className="text-xs text-amber-400 mt-1">Silakan lengkapi pembayaran di Dasbor &rarr; Event Terdaftar.</p>
                               ) : (
                                 <p className="text-xs text-slate-400 mt-1">Kami telah mencatat kehadiranmu.</p>
                               )}
                             </>
                           )}
                        </div>
                        {event.registrationLink && event.price === 0 && registrationStatus !== 'waitlisted' && (
                          <a 
                            href={event.registrationLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-primary w-full !h-14 flex items-center justify-center gap-2 group"
                          >
                            <ExternalLink size={18} />
                            Buka Link Event
                          </a>
                        )}
                        <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                          Detail akses juga tersedia di<br/>halaman profil Anda.
                        </p>
                     </div>
                   ) : (
                      <div className="space-y-6">
                         <button 
                           onClick={handleRegister}
                           disabled={submitting || isSoldOut}
                           className={`w-full !h-16 text-lg font-black uppercase tracking-[0.2em] shadow-2xl group overflow-hidden relative rounded-3xl transition-all ${
                             isSoldOut 
                             ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 shadow-none' 
                             : 'btn-primary shadow-purple-500/40'
                           }`}
                         >
                           {submitting ? (
                             <Loader2 className="animate-spin" size={24} />
                           ) : isSoldOut ? (
                             <span className="flex items-center justify-center gap-3">
                               Kuota Penuh — Masuk Waiting List <Clock size={20} />
                             </span>
                           ) : (
                             <span className="flex items-center justify-center gap-3">
                               Daftar Sekarang <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                             </span>
                           )}
                         </button>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/2 border border-white/5">
                           <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                             <Shield size={16} />
                           </div>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-normal">
                             Pendaftaran wajib menggunakan akun MyLearning yang aktif.
                           </p>
                        </div>
                     </div>
                   )}

                   {message && (
                     <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 transition-all ${
                       message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                       : message.type === 'info' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                       : 'bg-red-500/10 border-red-500/20 text-red-400'
                     }`}>
                       {message.type === 'success' ? <CheckCircle size={18} /> : message.type === 'info' ? <Clock size={18} /> : <AlertCircle size={18} />}
                       {message.text}
                     </div>
                   )}
                </div>
             </div>

             {/* Secondary Sidebar Content */}
             <div className="card p-8 bg-gradient-to-br from-purple-500/5 to-transparent border-white/5">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                   <Users size={14} /> Berbagi Event
                </h4>
                <div className="flex gap-3 relative">
                   {[
                     { id: 'whatsapp', icon: SocialIcons.WhatsApp, color: 'hover:text-[#25D366]' },
                     { id: 'facebook', icon: SocialIcons.Facebook, color: 'hover:text-[#1877F2]' },
                     { id: 'twitter', icon: SocialIcons.Twitter, color: 'hover:text-white' },
                     { id: 'linkedin', icon: SocialIcons.LinkedIn, color: 'hover:text-[#0A66C2]' },
                     { id: 'copy', icon: SocialIcons.Copy, color: 'hover:text-purple-400' },
                   ].map(platform => (
                     <button 
                       key={platform.id} 
                       onClick={() => handleShare(platform.id)}
                       className={`flex-1 aspect-square rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 ${platform.color} hover:bg-white/10 transition-all active:scale-95`}
                       title={`Bagikan ke ${platform.id}`}
                     >
                        <platform.icon size={20} />
                     </button>
                   ))}
                   
                   {copying && (
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl animate-bounce-in">
                       Link Tersalin!
                     </div>
                   )}
                </div>
              </div>

              {/* Calendar Integration */}
              {!isPast && (
                <div className="flex justify-center mt-6">
                  <AddToCalendar 
                    event={{
                      title: event.title,
                      description: event.shortDescription,
                      location: event.location,
                      startDate: event.eventDate,
                      endDate: event.eventEndDate
                    }} 
                  />
                </div>
              )}

             {/* Sidebar Ad Placement */}
             <NativeAdCard 
               location="event_sidebar" 
               variant="compact" 
               className="mt-8"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
