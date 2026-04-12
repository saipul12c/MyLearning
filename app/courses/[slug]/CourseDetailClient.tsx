"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, Users, Clock, Globe, ChevronRight, CheckCircle, 
  PlayCircle, Brain, FileText, Target, BarChart3, Award, 
  Lock, Infinity, BookOpen 
} from "lucide-react";
import { type Course, type Lesson } from "@/lib/data";
import { formatPrice, formatNumber, formatDuration } from "@/lib/utils";
import { getCourseAssessments, type CourseAssessments } from "@/lib/assessments";
import CourseEnrollButton from "./CourseEnrollButton";
import PreviewModal from "@/app/components/PreviewModal";
import ReviewSection from "@/app/components/ReviewSection";

interface CourseDetailClientProps {
  course: Course;
}

export default function CourseDetailClient({ course }: CourseDetailClientProps) {
  const [selectedPreview, setSelectedPreview] = useState<Lesson | null>(null);
  const [assessments, setAssessments] = useState<CourseAssessments | null>(null);
  
  useEffect(() => {
    async function loadAssessments() {
      const data = await getCourseAssessments(course.slug);
      setAssessments(data);
    }
    loadAssessments();
  }, [course.slug]);

  const liveStats = {
    rating: course.rating,
    reviews: course.totalReviews,
    students: course.totalStudents
  };

  const discountPercent = course.discountPrice
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
    : 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link href="/courses" className="hover:text-white transition-colors">Kursus</Link>
          <ChevronRight size={14} />
          <span className="text-slate-400 truncate">{course.title}</span>
        </div>
      </div>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="badge badge-primary">{course.category}</span>
                <span className="badge bg-white/5 text-slate-400 border-0">{course.level}</span>
                {course.discountPrice && <span className="badge badge-success">{discountPercent}% DISKON</span>}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">{course.title}</h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-4">{course.description}</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{course.detailedDescription}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
                <span className="flex items-center gap-1">
                  <Star size={16} className={liveStats.reviews > 0 ? "text-yellow-400 fill-yellow-400" : "text-slate-600"} />
                  {liveStats.reviews > 0 ? (
                    <>
                      <span className="text-white font-semibold">{liveStats.rating}</span>
                      <span>({formatNumber(liveStats.reviews)} ulasan)</span>
                    </>
                  ) : (
                    <span className="text-slate-500 italic">Belum ada ulasan</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} /> 
                  {liveStats.students > 0 ? `${formatNumber(liveStats.students)} siswa` : "Jadilah siswa pertama"}
                </span>
                <span className="flex items-center gap-1"><Clock size={16} /> {formatDuration(course.durationHours)}</span>
                <span className="flex items-center gap-1"><Globe size={16} /> {course.language}</span>
              </div>

              <Link href={`/profile/${course.instructorId}`} className="flex items-center gap-3 mb-8 group w-fit">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden border-2 border-transparent group-hover:border-purple-500 transition-all">
                  {course.instructorAvatar ? (
                    <Image src={course.instructorAvatar} alt={course.instructor} width={40} height={40} className="object-cover" />
                  ) : (
                    course.instructor.split(" ").map((n) => n[0]).join("")
                  )}
                </div>
                <div>
                  <div className="text-white text-sm font-medium group-hover:text-purple-400 transition-colors">{course.instructor}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1">Instruktur <ChevronRight size={10} /></div>
                </div>
              </Link>

              <div className="card p-6 sm:p-8 mb-8">
                <h2 className="text-xl font-bold text-white mb-5">Yang Akan Anda Pelajari</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.learningPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-5">Kurikulum Kursus</h2>
                <div className="text-sm text-slate-400 mb-4">{course.totalLessons} pelajaran • {formatDuration(course.durationHours)}</div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {(course.lessons || []).map((lesson, idx) => (
                      <div 
                        key={lesson.id} 
                        onClick={() => lesson.isFreePreview && setSelectedPreview(lesson)}
                        className={`card !rounded-xl p-4 flex items-center justify-between border-l-2 ${lesson.isFreePreview ? "border-l-purple-500 cursor-pointer hover:bg-white/5 transition-colors" : "border-l-slate-700"}`}
                      >
                        <div className="flex items-center gap-3">
                          {lesson.isFreePreview ? <PlayCircle size={18} className="text-purple-400" /> : <Lock size={18} className="text-slate-600" />}
                          <div>
                            <span className="text-slate-300 text-sm">{idx + 1}. {lesson.title}</span>
                            {lesson.isFreePreview && <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Preview Gratis</span>}
                          </div>
                        </div>
                        <span className="text-slate-500 text-xs">{lesson.durationMinutes} min</span>
                      </div>
                    ))}
                    {course.totalLessons > (course.lessons || []).length && (
                      <div className="text-center py-4 text-sm text-slate-500">+ {course.totalLessons - (course.lessons || []).length} pelajaran lainnya</div>
                    )}
                  </div>
                  
                  {/* Assessments Preview */}
                  {assessments && Object.keys(assessments).length > 0 && (
                    <div className="mt-8 border-t border-white/5 pt-6">
                      <h3 className="text-lg font-bold text-white mb-4">Ujian & Penilaian</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-[#141420] border border-purple-500/10">
                          <Brain className="text-purple-400 mb-2" size={24} />
                          <h4 className="text-white font-medium mb-1">Quizzes</h4>
                          <p className="text-xs text-slate-400">{assessments.quizzes.length} quiz auto-grade untuk menguji pemahaman per modul.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#141420] border border-cyan-500/10">
                          <FileText className="text-cyan-400 mb-2" size={24} />
                          <h4 className="text-white font-medium mb-1">Tugas Praktek</h4>
                          <p className="text-xs text-slate-400">{assessments.assignments.length} tugas praktek dengan hint dan auto-check jawaban.</p>
                        </div>
                        {assessments.finalProject && (
                          <div className="p-4 rounded-xl bg-[#141420] border border-emerald-500/10 sm:col-span-2">
                            <Target className="text-emerald-400 mb-2" size={24} />
                            <h4 className="text-white font-medium mb-1">Proyek Akhir: {assessments.finalProject.title}</h4>
                            <p className="text-xs text-slate-400">{assessments.finalProject.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-5">Persyaratan</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                      <ChevronRight size={16} className="mt-0.5 text-purple-400 flex-shrink-0" /> {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="card overflow-hidden">
                  <div className="relative aspect-video group bg-[#0c0c14]">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <BookOpen size={64} className="text-slate-800" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none group-hover:bg-black/30 transition-colors">
                      <div 
                        onClick={() => {
                          const preview = (course.lessons || []).find(l => l.isFreePreview);
                          if (preview) setSelectedPreview(preview);
                        }}
                        className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur shadow-lg shadow-black/50 pointer-events-auto cursor-pointer hover:bg-white/30 transition-colors"
                      >
                        <PlayCircle size={32} className="text-white ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-end gap-3 mb-6" id="enroll-section">
                      {course.discountPrice ? (
                        <>
                          <span className="text-3xl font-extrabold text-white">{formatPrice(course.discountPrice)}</span>
                          <span className="text-lg text-slate-500 line-through">{formatPrice(course.price)}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-extrabold text-white">{formatPrice(course.price)}</span>
                      )}
                    </div>

                    <CourseEnrollButton 
                      courseId={course.id}
                      courseSlug={course.slug} 
                      courseTitle={course.title} 
                      totalLessons={course.totalLessons} 
                      level={course.level} 
                      price={course.discountPrice || course.price}
                      instructorId={course.instructorId}
                      instructorQrisUrl={course.instructorQrisUrl}
                    />

                    <p className="text-center text-xs text-slate-500 mb-6 mt-3">Garansi uang kembali 30 hari</p>

                    <div className="space-y-3 text-sm">
                      <h3 className="text-white font-semibold text-sm mb-3">Termasuk:</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-400"><Clock size={16} className="text-cyan-400 flex-shrink-0" /><span>{formatDuration(course.durationHours)} video on-demand</span></div>
                        <div className="flex items-center gap-3 text-slate-400"><BookOpen size={16} className="text-purple-400 flex-shrink-0" /><span>{course.totalLessons} pelajaran</span></div>
                        {assessments && <div className="flex items-center gap-3 text-slate-400"><Brain size={16} className="text-pink-400 flex-shrink-0" /><span>{assessments.quizzes.length} Quiz & {assessments.assignments.length} Tugas</span></div>}
                        {assessments?.finalProject && <div className="flex items-center gap-3 text-slate-400"><Target size={16} className="text-emerald-400 flex-shrink-0" /><span>1 Proyek Akhir</span></div>}
                        <div className="flex items-center gap-3 text-slate-400"><Infinity size={16} className="text-blue-400 flex-shrink-0" /><span>Akses seumur hidup</span></div>
                        <div className="flex items-center gap-3 text-slate-400"><BarChart3 size={16} className="text-orange-400 flex-shrink-0" /><span>Level: {course.level}</span></div>
                        <div className="flex items-center gap-3 text-slate-400"><Award size={16} className="text-amber-400 flex-shrink-0" /><span>Sertifikat penyelesaian</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-[#08080c] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewSection courseSlug={course.slug} courseTitle={course.title} />
        </div>
      </section>

      {/* Preview Modal */}
      {selectedPreview && (
        <PreviewModal 
          lesson={selectedPreview} 
          courseTitle={course.title}
          onClose={() => setSelectedPreview(null)}
          onEnroll={() => {
            setSelectedPreview(null);
            document.getElementById("enroll-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
    </>
  );
}
