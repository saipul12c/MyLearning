"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  User as UserIcon, Star, Users, BookOpen, Clock,
  Link2, Globe, Award, Calendar, ChevronRight, 
  CheckCircle2, Mail, ShieldCheck, MapPin,
  MessageSquare, GraduationCap, Trophy
} from "lucide-react";
import SocialIcon from "@/app/components/SocialIcon";
import { getPublicProfile, PublicProfile, getAllInstructors, getInstructorReviews, getUserPublicHistory } from "@/lib/profiles";
import { getActivePromotions, trackImpression, trackClick, type Promotion } from "@/lib/promotions";
import { formatPrice, formatNumber, formatDuration } from "@/lib/utils";
import VerifiedBadge from "@/app/components/VerifiedBadge";

export default function PublicProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [extraData, setExtraData] = useState<{
    instructors?: any[];
    reviews?: any[];
    history?: { enrollments: any[]; certificates: any[] };
    ad?: Promotion;
  }>({});
  const [extraLoading, setExtraLoading] = useState(false);

  useEffect(() => {
    getPublicProfile(id).then(async (p) => {
      setProfile(p);
      setLoading(false);
      
      if (p) {
        setExtraLoading(true);
        try {
          // Fetch ad concurrently with role-based data
          const adPromise = getActivePromotions("all").then(ads => {
            if (ads && ads.length > 0) {
              setExtraData(prev => ({ ...prev, ad: ads[0] }));
              trackImpression(ads[0].id);
            }
          });

          if (p.role === 'admin') {
            const inst = await getAllInstructors();
            setExtraData(prev => ({ ...prev, instructors: inst }));
          } else if (p.role === 'instructor') {
            const rev = await getInstructorReviews(p.id); // Base auth user ID
            setExtraData(prev => ({ ...prev, reviews: rev }));
          } else if (p.role === 'user') {
            const hist = await getUserPublicHistory(p.id);
            setExtraData(prev => ({ ...prev, history: hist }));
          }
          
          await adPromise;
        } catch(e) {
          console.error(e);
        } finally {
          setExtraLoading(false);
        }
      }
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#08080c]">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#08080c] py-20 px-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <UserIcon size={40} className="text-slate-700" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Profil Tidak Ditemukan</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">Maaf, profil yang Anda cari tidak tersedia atau mungkin telah dihapus.</p>
        <Link href="/courses" className="btn-primary">Kembali ke Jelajah Kursus</Link>
      </div>
    );
  }

  const isInstructor = (profile.role === "admin" || profile.role === "instructor") && (profile.specialization || profile.coursesTaught?.length! > 0);

  return (
    <div className="flex-1 bg-[#08080c] pb-32">
      {/* Hero Header */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-cyan-900/20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15),transparent)]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#08080c] to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Column: Personal Info Card */}
          <div className="lg:col-span-1">
            <div className="card !bg-[#0f0f1a] p-8 border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={80} className="text-purple-400" />
              </div>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-cyan-400 p-1 mb-6 shadow-xl shadow-purple-500/20 relative">
                  <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 flex items-center justify-center border-4 border-[#0f0f1a]">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt={profile.fullName} fill sizes="128px" className="object-cover" />
                    ) : (
                      <UserIcon size={48} className="text-slate-700" />
                    )}
                  </div>
                  {isInstructor && (
                    <div className="absolute -bottom-2 -right-2 bg-[#08080c] p-1 rounded-xl shadow-2xl animate-bounce-slow">
                      <VerifiedBadge size={24} />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                  {profile.fullName}
                  {isInstructor && <VerifiedBadge size={20} />}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`badge text-[10px] uppercase tracking-widest font-bold py-1 ${isInstructor ? "badge-primary" : "bg-white/5 text-slate-400 border-white/10"}`}>
                    {isInstructor ? "Instruktur Terverifikasi" : "Siswa MyLearning"}
                  </span>
                </div>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
                  &quot;{profile.bio || `Bergabung sejak ${new Date(profile.createdAt).toLocaleDateString()}`}&quot;
                </p>

                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 rounded-xl transition-all border border-white/5" title="Website">
                      <Globe size={18} />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-[#0077b5]/10 text-slate-400 hover:text-[#0077b5] rounded-xl transition-all border border-white/5" title="LinkedIn">
                      <Link2 size={18} />
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-pink-500/10 text-slate-400 hover:text-pink-500 rounded-xl transition-all border border-white/5" title="Instagram">
                      <SocialIcon name="instagram" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-blue-400/10 text-slate-400 hover:text-blue-400 rounded-xl transition-all border border-white/5" title="Twitter / X">
                      <SocialIcon name="twitter" />
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5" title="GitHub">
                      <SocialIcon name="github" />
                    </a>
                  )}
                  <a href={`mailto:${profile.email}`} className="p-2 bg-white/5 hover:bg-purple-500/10 text-slate-400 hover:text-purple-400 rounded-xl transition-all border border-white/5" title="Email">
                    <Mail size={18} />
                  </a>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2"><MapPin size={14} /> Lokasi</span>
                  <span className="text-slate-300">Indonesia</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2"><Calendar size={14} /> Terdaftar</span>
                  <span className="text-slate-300">{new Date(profile.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {isInstructor && (
              <div className="mt-6 card p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3">
                    <div className="text-2xl font-bold text-white mb-1">{formatNumber(profile.enrolledCount || 0)}+</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Siswa</div>
                  </div>
                  <div className="text-center p-3 border-l border-white/5">
                    <div className="text-2xl font-bold text-white mb-1">{profile.coursesTaught?.length || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Kursus</div>
                  </div>
                </div>
              </div>
            )}

            {/* Ad Placement */}
            {extraData.ad ? (
              <a href={extraData.ad.linkUrl} onClick={() => trackClick(extraData.ad!.id)} target="_blank" rel="noopener noreferrer" className="mt-6 block relative rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all group cursor-pointer h-48 bg-[#0f0f1a] shadow-xl">
                 <div className="absolute inset-0 overflow-hidden">
                    <img src={extraData.ad.imageUrl} alt={extraData.ad.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/50 to-transparent z-0"></div>
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
                    <h4 className="text-white font-bold text-sm mb-1 group-hover:text-purple-400 transition-colors">{extraData.ad.title}</h4>
                    <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{extraData.ad.description}</p>
                 </div>
                 {extraData.ad.badgeText && (
                   <span className="absolute top-3 left-3 px-2 py-0.5 bg-purple-500 border border-purple-400/50 text-white rounded text-[8px] uppercase font-bold tracking-widest z-10 shadow-lg">
                     {extraData.ad.badgeText}
                   </span>
                 )}
                 <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#08080c]/80 backdrop-blur-md rounded text-[8px] uppercase font-bold tracking-widest text-slate-500 z-10 border border-white/5">
                   ADS
                 </span>
              </a>
            ) : (
              <div className="mt-6 relative rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all group cursor-pointer h-48 bg-[#0f0f1a] shadow-xl">
                <div className="absolute inset-0 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20 z-0 group-hover:scale-105 transition-transform duration-700"></div>
                </div>
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                      <Star size={18} className="text-purple-400" />
                   </div>
                   <h4 className="text-white font-bold text-sm mb-1 group-hover:text-purple-400 transition-colors">Upgrade ke Premium</h4>
                   <p className="text-slate-400 text-xs mb-4 leading-relaxed">Akses semua kursus {profile.fullName || 'instruktur ini'} tanpa batas waktu.</p>
                   <span className="bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-full transition-colors border border-white/5">
                      Lihat Promo
                   </span>
                </div>
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#08080c]/80 backdrop-blur-md rounded text-[8px] uppercase font-bold tracking-widest text-slate-500 z-10 border border-white/5">
                  ADS
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Detailed Info Container */}
          <div className="lg:col-span-2 space-y-8">
            {profile.role === 'admin' ? (
              <div className="space-y-8">
                {/* Admin Role: Instructor Directory */}
                <div className="card p-8 border-white/5 mb-8">
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                    <ShieldCheck className="text-amber-400" /> Platform Administrator
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Administrator MyLearning yang bertugas menjaga kualitas pembelajaran dan memfasilitasi seluruh instruktur di platform ini.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Users className="text-emerald-400" /> Direktori Instruktur
                    </h2>
                    <span className="text-xs text-slate-500">{extraData.instructors?.length || 0} Instruktur</span>
                  </div>
                  
                  {extraLoading ? (
                     <div className="h-40 flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div></div>
                  ) : extraData.instructors && extraData.instructors.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {extraData.instructors.map((inst: any) => (
                        <Link href={`/profile/${inst.slug}`} key={inst.id} className="card p-5 border-white/5 hover:border-emerald-500/30 transition-all flex items-center gap-4 group">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                            {inst.user_profiles?.avatar_url || inst.avatar_url ? (
                               <Image src={inst.user_profiles?.avatar_url || inst.avatar_url} alt={inst.name} width={64} height={64} className="w-full h-full object-cover" />
                            ) : (
                               <UserIcon className="w-full h-full p-3 text-slate-700" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors">{inst.name}</h3>
                            <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><VerifiedBadge size={12} /> {inst.expertise || 'Instruktur'}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                               <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400" /> {inst.rating}</span>
                               <span className="flex items-center gap-1"><Users size={10} /> {formatNumber(inst.total_students)} Siswa</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="card p-8 border-dashed border-white/10 text-center">
                       <p className="text-slate-500 text-sm">Tidak ada instruktur aktif ditemukan.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : isInstructor ? (
              <>
                {/* About Section */}
                <div className="card p-8 border-white/5">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Award className="text-purple-400" /> Profil Profesional
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Spesialisasi</h3>
                      <p className="text-white font-medium">{profile.specialization}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pengalaman</h3>
                      <p className="text-white font-medium">{profile.experience}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tentang Instruktur</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      {profile.fullName} adalah seorang ahli di bidangnya yang berdedikasi untuk membagikan ilmu praktis kepada para siswa MyLearning. 
                      Dengan pendekatan pengajaran yang sistematis dan berorientasi pada proyek, setiap kursus yang dibawakannya dirancang untuk membantu Anda menguasai skill baru secara efisien.
                    </p>
                  </div>
                </div>

                {/* Courses Taught Section */}
                <div>
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <BookOpen className="text-cyan-400" /> Kursus yang Diampu
                    </h2>
                    <span className="text-xs text-slate-500">{profile.coursesTaught?.length || 0} Total</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {profile.coursesTaught?.map((course) => (
                      <Link 
                        href={`/courses/${course.slug}`} 
                        key={course.id} 
                        className="card group overflow-hidden border-white/5 hover:border-purple-500/30 transition-all"
                      >
                        <div className="relative h-40 bg-slate-900">
                          <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" />
                        </div>
                        <div className="p-5">
                          <h3 className="text-white font-bold text-sm mb-3 line-clamp-1 group-hover:text-purple-400 transition-colors">{course.title}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Star size={10} className={course.totalReviews > 0 ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} /> 
                                {course.totalReviews > 0 ? course.rating : "No reviews"}
                              </span>
                              <span className="flex items-center gap-1"><Users size={10} /> {formatNumber(course.totalStudents)}</span>
                              <span className="flex items-center gap-1"><Clock size={10} /> {formatDuration(course.durationHours)}</span>
                            </div>
                            <span className="text-white font-bold text-xs">{formatPrice(course.discountPrice || course.price)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Reviews Section */}
                {profile.role === 'instructor' && (
                  <div className="mt-12">
                    <div className="flex items-center justify-between mb-6 px-2">
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <MessageSquare className="text-yellow-400" /> Ulasan Siswa
                      </h2>
                    </div>
                    
                    {extraLoading ? (
                      <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div></div>
                    ) : extraData.reviews && extraData.reviews.length > 0 ? (
                      <div className="grid gap-4">
                        {extraData.reviews.map((rev: any) => (
                          <div key={rev.id} className="card p-6 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                            <div className="flex items-start gap-4">
                               <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                                 {rev.user_profiles?.avatar_url ? (
                                    <Image src={rev.user_profiles.avatar_url} alt="Reviewer" width={40} height={40} className="w-full h-full object-cover" />
                                 ) : (
                                    <UserIcon className="w-full h-full p-2 text-slate-700" />
                                 )}
                               </div>
                               <div className="flex-1">
                                 <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-sm text-slate-200">{rev.user_profiles?.full_name || 'Anonymous'}</h4>
                                    <span className="text-[10px] text-slate-500">{new Date(rev.created_at).toLocaleDateString()}</span>
                                 </div>
                                 <div className="flex items-center gap-1 mb-2">
                                    {Array.from({length: 5}).map((_, i) => (
                                      <Star key={i} size={10} className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} />
                                    ))}
                                 </div>
                                 <p className="text-sm text-slate-400 leading-relaxed italic">&quot;{rev.comment}&quot;</p>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card p-8 border-dashed border-white/10 text-center">
                         <p className="text-slate-500 text-sm">Belum ada ulasan untuk instruktur ini.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-12">
                {/* Course History Section */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <GraduationCap className="text-blue-400" /> Riwayat Pembelajaran
                  </h2>
                  
                  {extraLoading ? (
                    <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div></div>
                  ) : extraData.history?.enrollments && extraData.history.enrollments.length > 0 ? (
                    <div className="grid gap-4">
                      {extraData.history.enrollments.map((enr: any) => (
                        <Link href={`/courses/${enr.course_slug}`} key={enr.id} className="card group p-5 border-white/5 hover:border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-white/[0.02]">
                           <div>
                              <h3 className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">{enr.course_title}</h3>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} /> {enr.completed_at ? `Lulus: ${new Date(enr.completed_at).toLocaleDateString()}` : `Terdaftar: ${new Date(enr.enrolled_at).toLocaleDateString()}`}
                              </p>
                           </div>
                           <div className="flex items-center gap-4 min-w-[150px]">
                              <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${enr.progress_percentage >= 100 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} style={{ width: `${enr.progress_percentage}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-300 w-8">{enr.progress_percentage}%</span>
                           </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="card p-12 border-dashed border-white/10 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><BookOpen size={24} className="text-slate-700" /></div>
                      <p className="text-slate-500 text-sm">Siswa ini belum memiliki riwayat pembelajaran publik.</p>
                    </div>
                  )}
                </div>

                {/* Certificates Section */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Trophy className="text-amber-400" /> Galeri Sertifikat
                  </h2>
                  
                  {extraLoading ? (
                    <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div></div>
                  ) : extraData.history?.certificates && extraData.history.certificates.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {extraData.history.certificates.map((cert: any) => (
                        <div key={cert.id} className="card p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent flex flex-col group relative overflow-hidden transition-all hover:border-amber-500/40 hover:bg-amber-500/10">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                             <Award size={64} className="text-amber-400" />
                           </div>
                           <h4 className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">Sertifikat Kelulusan</h4>
                           <h3 className="text-white font-bold text-sm mb-4 line-clamp-2 leading-relaxed">{cert.course_title}</h3>
                           <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                             <span className="text-[10px] text-slate-500 uppercase tracking-widest">No: {cert.certificate_number}</span>
                             {cert.certificate_url && (
                               <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 bg-cyan-500/10 px-3 py-1.5 rounded-full">
                                 Lihat <ChevronRight size={14} />
                               </a>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card p-8 border-dashed border-white/10 text-center">
                       <p className="text-slate-500 text-sm">Belum ada sertifikat yang diperoleh.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
