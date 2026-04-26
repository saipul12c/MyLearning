"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, MapPin, Clock, Share2, ArrowLeft, ArrowRight, CheckCircle, 
  AlertCircle, Loader2, Sparkles, Shield, UserCheck, Users,
  Globe, Info, DollarSign, ExternalLink,XCircle
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
import { recordInterest } from "@/lib/interests";

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

import { type Promotion } from "@/lib/promotions";

export default function EventDetailClient({ 
  initialEvent, 
  initialInlinePromo = null, 
  initialSidebarPromo = null 
}: { 
  initialEvent: PlatformEvent, 
  initialInlinePromo?: Promotion | null, 
  initialSidebarPromo?: Promotion | null 
}) {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<PlatformEvent>(initialEvent);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [copying, setCopying] = useState(false);

  // Track registration check to prevent race condition
  const registrationCheckRef = useRef<string | null>(null);

  // Memoized registration check to prevent race conditions
  const checkRegistration = useCallback(async () => {
    if (!isLoggedIn || !user || !event) return;
    
    const currentUserId = user.id;
    registrationCheckRef.current = currentUserId;

    try {
      const result = await checkIfRegistered(event.id, currentUserId);
      
      // Only update if this is still the latest check request
      if (registrationCheckRef.current === currentUserId) {
        setIsRegistered(result.registered && result.status !== 'cancelled');
        setRegistrationStatus(result.status || null);
      }
    } catch (error) {
      console.error("Registration check error:", error);
    }
  }, [isLoggedIn, user, event?.id]);

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  // Track user interest in this category
  useEffect(() => {
    if (event?.category) {
      recordInterest(event.category);
    }
  }, [event?.id, event?.category]);

  const handleShare = (platform: string) => {
    if (!event) return;
    
    const url = typeof window !== 'undefined' ? window.location.href : '';
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

  const handleRegister = useCallback(async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${event.slug}`);
      return;
    }

    if (!event || !user || submitting) return; // Prevent double-click

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
  }, [isLoggedIn, event, user, submitting, router]);

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
  const confirmedCount = (event as any).confirmedRegistrations || event.registrationCount || 0;
  const isSoldOut = confirmedCount >= (event.maxSlots || 100);
  const remainingSlots = Math.max(0, (event.maxSlots || 100) - confirmedCount);

  return (
    <div className="min-h-screen bg-[#09090f] text-white selection:bg-purple-500/30 overflow-x-hidden" style={{ "--primary-theme": event.themeColor || "#7c3aed" } as any}>
      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] blur-[150px] opacity-30 animate-pulse" style={{ backgroundColor: "var(--primary-theme)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] blur-[120px] opacity-10" style={{ backgroundColor: "var(--primary-theme)", opacity: 0.05 }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10">
        {/* Immersive Hero Section */}
        <section className="relative w-full min-h-[60vh] md:min-h-[75vh] flex items-end overflow-hidden pt-32">
          {/* Hero Background Image */}
          <div className="absolute inset-0 z-0">
            {(event.bannerUrl || event.thumbnailUrl) ? (
              <img 
                src={event.bannerUrl || event.thumbnailUrl} 
                alt={event.title} 
                className="w-full h-full object-cover scale-105 animate-float" 
                style={{ filter: 'brightness(0.6)' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#09090f] flex items-center justify-center">
                <Calendar size={120} className="text-white/5" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-[#09090f]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090f] via-transparent to-transparent opacity-60" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12 md:pb-24 relative z-10">
            <div className="max-w-4xl space-y-6 animate-fade-in-up">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-5 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border border-white/20" 
                      style={{ backgroundColor: "var(--primary-theme)", boxShadow: "0 0 20px var(--primary-theme)" }}>
                  {event.category || 'Platform Event'}
                </span>
                {event.isFeatured && (
                  <span className="px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                    <Sparkles size={12} className="inline mr-1 mb-0.5" /> Featured Event
                  </span>
                )}
                {event.level && (
                  <span className="px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                    {event.level}
                  </span>
                )}
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.95] text-white">
                <span className="block mb-2">{event.title.split(' ').slice(0, -1).join(' ')}</span>
                <span className="gradient-text">{event.title.split(' ').slice(-1)}</span>
              </h1>
              
              <div className="flex flex-wrap items-center gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md" 
                       style={{ color: "var(--primary-theme)" }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</p>
                    <p className="font-bold text-white text-lg">{format(new Date(event.eventDate), "d MMMM yyyy", { locale: id })}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 backdrop-blur-md">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lokasi</p>
                    <p className="font-bold text-white text-lg">{event.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-20 pb-32 relative z-20">
          <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
            
            {/* Main Column */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Event Stats Card (Glass) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up delay-100">
                {[
                  { icon: Clock, label: 'Waktu Aktif', value: format(new Date(event.eventDate), "HH:mm") + ' WIB', color: "inherit", customColor: true },
                  { icon: Users, label: 'Kapasitas', value: `${event.maxSlots || 100} Peserta`, color: 'text-cyan-400' },
                  { icon: Globe, label: 'Platform', value: event.location === 'Online' ? 'Zoom/Meet' : 'On-Site', color: 'text-emerald-400' },
                  { icon: DollarSign, label: 'Investasi', value: event.price === 0 ? 'GRATIS' : `Rp ${event.price.toLocaleString('id-ID')}`, color: 'text-amber-400' },
                ].map((stat, i) => (
                  <div key={i} className="glass p-6 rounded-[2rem] border-white/5 hover:border-white/10 transition-all group">
                    <stat.icon 
                      className={`${stat.color} mb-3 group-hover:scale-110 transition-transform`} 
                      size={20} 
                      style={ (stat as any).customColor ? { color: "var(--primary-theme)" } : {}}
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                    <p className="font-bold text-white tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Countdown Section */}
              {!isPast && (
                <div className="animate-fade-in-up delay-200">
                  <div className="p-1 rounded-[3rem] shadow-2xl" style={{ background: `linear-gradient(90deg, var(--primary-theme), #06b6d4)`, boxShadow: `0 0 40px -10px var(--primary-theme)` }}>
                    <div className="bg-[#09090f] rounded-[2.9rem] p-8 md:p-12 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-64 h-64 blur-[80px] -mr-32 -mt-32 opacity-20" style={{ backgroundColor: "var(--primary-theme)" }} />
                      <div className="relative z-10 flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 border-b border-white/5 pb-4 w-full text-center">
                          Sesi dimulai dalam waktu
                        </p>
                        <CountdownTimer targetDate={event.eventDate} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description Section */}
              <div className="glass-strong p-8 md:p-12 rounded-[3rem] border-white/5 space-y-10 animate-fade-in-up delay-300">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                      <Info size={28} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black tracking-tight">Detail Acara</h2>
                      <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Latar Belakang & Agenda</p>
                   </div>
                </div>
                
                <div className="prose prose-invert prose-purple max-w-none">
                  <p className="text-xl text-slate-200 leading-relaxed font-semibold bg-white/5 p-8 rounded-3xl border-l-4 border-purple-500">
                    {event.shortDescription}
                  </p>
                  
                  <div className="my-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <div className="text-slate-400 leading-relaxed prose prose-invert prose-purple max-w-none 
                    prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6
                    prose-headings:text-white prose-headings:mt-10 prose-headings:mb-6 prose-headings:font-black prose-headings:tracking-tight
                    prose-li:text-slate-400 prose-li:my-2 prose-li:text-lg
                    prose-strong:text-purple-400 prose-strong:font-bold
                    prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-lg
                    prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5 prose-pre:p-6 prose-pre:rounded-3xl
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {event.description || "Tidak ada deskripsi tambahan untuk event ini."}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Speaker Profiles */}
              {event.speakerInfo && event.speakerInfo.length > 0 && (
                <div className="glass p-8 md:p-12 rounded-[3rem] border-white/5 overflow-hidden relative animate-fade-in-up delay-400">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] -mr-32 -mt-32" />
                  <SpeakerSection speakers={event.speakerInfo} />
                </div>
              )}

              {/* In-content Ad Placement */}
              <div className="animate-fade-in-up delay-500">
                <NativeAdCard 
                  location="event_detail_inline" 
                  variant="inline" 
                  className="rounded-[3rem] shadow-2xl shadow-purple-500/5 overflow-hidden border border-white/5"
                  initialPromo={initialInlinePromo}
                />
              </div>

              {/* Important Notes */}
              <div className="p-10 rounded-[3rem] bg-amber-500/5 border border-amber-500/10 flex flex-col md:flex-row items-start gap-8 animate-fade-in-up delay-600">
                 <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 text-amber-500 flex-shrink-0 flex items-center justify-center border border-amber-500/20">
                    <Shield size={32} />
                 </div>
                 <div>
                    <h4 className="text-xl font-black tracking-tight text-amber-500 mb-4 uppercase tracking-[0.1em]">Informasi Penting</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <CheckCircle className="text-amber-500/50 flex-shrink-0 mt-1" size={16} />
                          <p className="text-sm text-slate-400 leading-relaxed">Pendaftaran hanya menggunakan akun aktif.</p>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle className="text-amber-500/50 flex-shrink-0 mt-1" size={16} />
                          <p className="text-sm text-slate-400 leading-relaxed">E-Sertifikat dikirim otomatis via Email.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <CheckCircle className="text-amber-500/50 flex-shrink-0 mt-1" size={16} />
                          <p className="text-sm text-slate-400 leading-relaxed">Hadir 15 menit sebelum acara dimulai.</p>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle className="text-amber-500/50 flex-shrink-0 mt-1" size={16} />
                          <p className="text-sm text-slate-400 leading-relaxed">Akses link tersedia setelah registrasi.</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Registration Main Card */}
              <div className="sticky top-24 space-y-8 animate-fade-in-up delay-200">
                <div className="glass-strong p-8 md:p-10 rounded-[3rem] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden">
                   {/* Card Shine Effect */}
                   <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 via-transparent to-transparent rotate-45 pointer-events-none" />
                   
                   <div className="relative z-10 space-y-8">
                      {/* Price Banner */}
                      <div className="text-center space-y-2 py-6 border-b border-white/5">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Biaya Investasi</p>
                         <h3 className="text-5xl font-black text-white">
                            {event.price === 0 ? <span className="gradient-text">GRATIS</span> : `Rp ${event.price.toLocaleString('id-ID')}`}
                         </h3>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                               <Users className="text-cyan-400" size={18} />
                               <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sisa Kuota</span>
                            </div>
                            <span className={`text-sm font-black ${remainingSlots < 10 ? 'text-red-400' : 'text-white'}`}>
                               {remainingSlots} / {event.maxSlots || 100}
                            </span>
                         </div>
                         
                         <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                               <MapPin className="text-purple-400" size={18} />
                               <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tipe Lokasi</span>
                            </div>
                            <span className="text-sm font-black text-white">{event.location}</span>
                         </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4">
                        {isPast ? (
                           <div className="space-y-4">
                              <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-center">
                                 <AlertCircle className="mx-auto text-red-500 mb-3" size={32} />
                                 <p className="text-sm font-black text-white uppercase tracking-widest">Event Selesai</p>
                              </div>
                              {event.recordingUrl && (
                                <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer" 
                                   className="btn-primary w-full shadow-2xl !h-14 rounded-2xl flex items-center justify-center gap-2">
                                  <ExternalLink size={18} /> Tonton Rekaman
                                </a>
                              )}
                           </div>
                        ) : isRegistrationClosed ? (
                           <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center">
                              <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
                              <p className="text-sm font-black text-white uppercase tracking-widest">Registrasi Ditutup</p>
                           </div>
                        ) : isRegistered ? (
                           <div className="space-y-4">
                              <div className={`p-8 rounded-[2.5rem] border text-center animate-scale-in-center ${
                                registrationStatus === 'waitlisted' 
                                  ? 'bg-amber-500/10 border-amber-500/20' 
                                  : 'bg-emerald-500/10 border-emerald-500/20'
                              }`}>
                                 {registrationStatus === 'waitlisted' ? (
                                   <>
                                     <Clock className="mx-auto text-amber-500 mb-4" size={48} />
                                     <p className="text-xl font-black text-white leading-tight">Waiting List</p>
                                     <p className="text-[10px] text-amber-400/70 mt-2 uppercase tracking-widest font-black">Antrian Aktif</p>
                                   </>
                                 ) : (
                                   <>
                                     <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                                     <p className="text-xl font-black text-white leading-tight">Berhasil Terdaftar</p>
                                     <p className="text-[10px] text-emerald-400/70 mt-2 uppercase tracking-widest font-black">Tiket Siap</p>
                                   </>
                                 )}
                              </div>
                              
                              {event.registrationLink && event.price === 0 && registrationStatus !== 'waitlisted' && (
                                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer"
                                   className="btn-primary w-full !h-16 rounded-[2rem] flex items-center justify-center gap-3 group text-lg tracking-widest">
                                   <ExternalLink size={20} /> BUKA LINK
                                </a>
                              )}
                              
                              <Link href="/dashboard/events" className="btn-secondary w-full !h-14 rounded-2xl flex items-center justify-center text-xs tracking-widest font-black uppercase">
                                Lihat Dasbor Event
                              </Link>
                           </div>
                        ) : (
                           <div className="space-y-6">
                              <button 
                                onClick={handleRegister}
                                disabled={submitting || isSoldOut}
                                className={`w-full !h-20 text-xl font-black uppercase tracking-[0.3em] shadow-2xl rounded-[2.5rem] transition-all relative overflow-hidden group ${
                                  isSoldOut 
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                                  : 'btn-primary hover:scale-[1.02] active:scale-95'
                                }`}
                              >
                                {submitting ? (
                                  <Loader2 className="animate-spin" size={28} />
                                ) : isSoldOut ? (
                                  <span className="flex flex-col items-center">
                                    <span className="text-xs opacity-50 mb-1">Kuota Habis</span>
                                    WAITING LIST
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-3">
                                    DAFTAR SEKARANG <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                  </span>
                                )}
                                
                                {/* Animated Shine */}
                                {!submitting && !isSoldOut && (
                                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-shimmer-premium pointer-events-none" />
                                )}
                                
                                <style jsx>{`
                                  .btn-primary {
                                    background: linear-gradient(135deg, var(--primary-theme) 0%, #06b6d4 100%) !important;
                                  }
                                  .gradient-text {
                                    background: linear-gradient(135deg, var(--primary-theme) 0%, #06b6d4 100%) !important;
                                    -webkit-background-clip: text !important;
                                    -webkit-text-fill-color: transparent !important;
                                  }
                                `}</style>
                              </button>

                              <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-[0.2em] leading-relaxed px-4">
                                Dengan mendaftar, Anda menyetujui seluruh syarat & ketentuan MyLearning.
                              </p>
                           </div>
                        )}
                      </div>

                      {/* Status Message */}
                      {message && (
                        <div className={`p-5 rounded-2xl border text-xs font-bold flex items-center gap-4 animate-shake ${
                          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : message.type === 'info' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {message.type === 'success' ? <CheckCircle size={20} /> : message.type === 'info' ? <Clock size={20} /> : <AlertCircle size={20} />}
                          {message.text}
                        </div>
                      )}
                   </div>
                </div>

                {/* Calendar & Share Stats */}
                <div className="glass p-8 rounded-[3rem] border-white/5 space-y-8">
                   <div className="flex flex-col gap-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 pb-4 border-b border-white/5">
                         <Share2 size={14} className="text-purple-500" /> Share This Event
                      </h4>
                      <div className="grid grid-cols-5 gap-3">
                         {[
                           { id: 'whatsapp', icon: SocialIcons.WhatsApp, color: 'hover:text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/30' },
                           { id: 'facebook', icon: SocialIcons.Facebook, color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30' },
                           { id: 'twitter', icon: SocialIcons.Twitter, color: 'hover:text-white hover:bg-white/10 hover:border-white/30' },
                           { id: 'linkedin', icon: SocialIcons.LinkedIn, color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30' },
                           { id: 'copy', icon: SocialIcons.Copy, color: 'hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30' },
                         ].map(platform => (
                           <button 
                             key={platform.id} 
                             onClick={() => handleShare(platform.id)}
                             className={`aspect-square rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 transition-all duration-300 transform hover:-translate-y-1 active:scale-90 ${platform.color}`}
                             title={`Share via ${platform.id}`}
                           >
                              <platform.icon size={20} />
                           </button>
                         ))}
                      </div>
                      
                      {copying && (
                         <div className="text-center text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">
                           Link Copied to Clipboard!
                         </div>
                      )}
                   </div>

                   <div className="my-8 h-px bg-white/5" />

                   {!isPast && (
                     <div className="flex flex-col items-center gap-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tambahkan ke Kalender</p>
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
                </div>

                {/* Sidebar Ad Placement */}
                <div className="animate-fade-in-up delay-400">
                  <NativeAdCard 
                    location="event_sidebar" 
                    variant="compact" 
                    className="rounded-[3rem] border border-white/5 shadow-2xl"
                    initialPromo={initialSidebarPromo}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Background Noise/Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
