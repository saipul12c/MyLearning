"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  User as UserIcon, Star, Users, BookOpen, Clock,
  Link2, Globe, Award, Calendar, ChevronRight, 
  CheckCircle2, Mail, ShieldCheck, MapPin
} from "lucide-react";
import { getPublicProfile, PublicProfile } from "@/lib/profiles";
import { formatPrice, formatNumber, formatDuration } from "@/lib/utils";

export default function PublicProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProfile(id).then((p) => {
      setProfile(p);
      setLoading(false);
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
    <div className="flex-1 bg-[#08080c]">
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
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border-4 border-[#0f0f1a] animate-bounce-slow">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-white mb-1">{profile.fullName}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`badge text-[10px] uppercase tracking-widest font-bold py-1 ${isInstructor ? "badge-primary" : "bg-white/5 text-slate-400 border-white/10"}`}>
                    {isInstructor ? "Instruktur Terverifikasi" : "Siswa MyLearning"}
                  </span>
                </div>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
                  &quot;{profile.bio || `Bergabung sejak ${new Date(profile.createdAt).toLocaleDateString()}`}&quot;
                </p>

                {isInstructor && (
                  <div className="flex gap-3 mt-2">
                    {profile.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-[#0077b5]/10 text-slate-400 hover:text-[#0077b5] rounded-xl transition-all border border-white/5">
                        <Link2 size={18} />
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 rounded-xl transition-all border border-white/5">
                        <Globe size={18} />
                      </a>
                    )}
                    <a href={`mailto:${profile.email}`} className="p-2 bg-white/5 hover:bg-purple-500/10 text-slate-400 hover:text-purple-400 rounded-xl transition-all border border-white/5">
                      <Mail size={18} />
                    </a>
                  </div>
                )}
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
          </div>

          {/* Right Column: Detailed Info Container */}
          <div className="lg:col-span-2 space-y-8">
            {isInstructor ? (
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
              </>
            ) : (
              <div className="card p-12 border-dashed border-white/10 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <BookOpen size={40} className="text-slate-800" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Profil Publik Siswa</h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                  Halaman ini menampilkan informasi dasar siswa. Detail kemajuan belajar dan sertifikat bersifat pribadi dan hanya dapat diakses melalui Dashboard.
                </p>
                <div className="flex items-center gap-2 text-xs text-purple-400 font-bold bg-purple-500/5 px-4 py-2 rounded-full border border-purple-500/10">
                  <CheckCircle2 size={14} /> Akun Terverifikasi MyLearning
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
