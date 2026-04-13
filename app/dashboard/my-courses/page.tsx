"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { getUserEnrollments, completeLesson, uncompleteLesson, getRemainingDays, getEnrollmentDeadline, submitQuiz, submitAssignment, completeFinalProject, isCertificateExpired, resetEnrollmentForRetake, type Enrollment } from "@/lib/enrollment";
import { getCertificateByNumber } from "@/lib/certificates";
import { getCourseBySlug } from "@/lib/courses";
import { getCourseAssessments } from "@/lib/assessments";
import { getLevelLabel } from "@/lib/enrollment";
import { Clock, CheckCircle, XCircle, BookOpen, Download, Award, FileText, Brain, Target, AlertTriangle, CreditCard, RefreshCcw, Loader2, ChevronRight } from "lucide-react";
import CertificateGenerator from "@/app/components/CertificateGenerator";
import PaymentModal from "@/app/components/PaymentModal";
import { getInstructors } from "@/lib/courses";
import QuizModal from "@/app/components/QuizModal";
import AssignmentModal from "@/app/components/AssignmentModal";
import LessonPlayer from "@/app/components/LessonPlayer";
import FinalProjectForm from "@/app/components/FinalProjectForm";
import Skeleton from "@/app/components/ui/Skeleton";
import type { Quiz, Assignment } from "@/lib/assessments";

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<"lessons" | "quizzes" | "assignments" | "project">("lessons");
  const [certData, setCertData] = useState<{
    userName: string;
    courseTitle: string;
    startDate: string;
    endDate: string;
    instructor: string;
    certificateId: string;
    instructorSignatureId?: string | null;
    adminSignatureId?: string | null;
    adminName?: string;
    isExpired: boolean;
  } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Enrollment | null>(null);
  const [activeCourseData, setActiveCourseData] = useState<any>(null);
  const [activeAssessments, setActiveAssessments] = useState<any>(null);
  const [activeInstructor, setActiveInstructor] = useState<any>(null);

  const forceRefresh = useCallback(() => setRefresh((r) => r + 1), []);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      const data = await getUserEnrollments(user.id);
      setEnrollments(data);
      
      const activeEnr = data.find((e) => e.status === "active");
      if (activeEnr) {
        const [course, assessments] = await Promise.all([
          getCourseBySlug(activeEnr.courseSlug),
          getCourseAssessments(activeEnr.courseSlug)
        ]);
        setActiveCourseData(course);
        setActiveAssessments(assessments);
      } else {
        setActiveCourseData(null);
        setActiveAssessments(null);
      }
      
      setLoading(false);
    };
    fetchEnrollments();
  }, [user, refresh]);

  if (!user) return null;

  if (loading && enrollments.length === 0) {
    return (
      <div className="max-w-5xl space-y-8 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="w-56 h-8" />
          <Skeleton className="w-40 h-4 rounded-full" />
        </div>
        <Skeleton className="h-[500px] rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const active = enrollments.find((e) => e.status === "active");
  const waiting = enrollments.filter((e) => e.status === "waiting_verification");
  const rejected = enrollments.filter((e) => e.status === "rejected" || e.status === "pending");
  const failed = enrollments.filter((e) => e.status === "failed");
  const completed = enrollments.filter((e) => e.status === "completed");
  const expired = enrollments.filter((e) => e.status === "expired");

  const handleToggleLesson = async (enrollment: Enrollment, lessonId: string) => {
    if (enrollment.completedLessons.includes(lessonId)) {
      await uncompleteLesson(enrollment.id, lessonId);
    } else {
      await completeLesson(enrollment.id, user.id, lessonId);
    }
    forceRefresh();
  };

  const handleQuizSubmit = async (quizId: string | number, answers: number[]) => {
    if (!active || !activeAssessments) return { score: 0, passed: false };
    const quiz = activeAssessments.quizzes.find((q: any) => q.id === quizId);
    if (!quiz) return { score: 0, passed: false };
    const correctAnswers = quiz.questions.map((q: any) => q.correctAnswer);
    const result = await submitQuiz(active.id, quizId, answers, correctAnswers, quiz.passingScore);
    forceRefresh();
    return { score: result.score, passed: result.passed };
  };

  const handleAssignmentSubmit = async (assignmentId: string | number, answers: string[]) => {
    if (!active || !activeAssessments) return { score: 0, passed: false, results: [] as boolean[] };
    const assignment = activeAssessments.assignments.find((a: any) => a.id === assignmentId);
    if (!assignment) return { score: 0, passed: false, results: [] as boolean[] };
    const correctAnswers = assignment.correctAnswers;
    const result = await submitAssignment(active.id, assignmentId, answers, correctAnswers);
    forceRefresh();
    return { score: result.score, passed: result.passed, results: result.results };
  };

  const handleFinalProject = async () => {
    if (!active) return;
    if (confirm("Tandai proyek akhir sebagai selesai? Pastikan Anda sudah menyelesaikan semua deliverables.")) {
      await completeFinalProject(active.id);
      forceRefresh();
    }
  };

  const handleDownloadCert = async (enrollment: Enrollment) => {
    if (!enrollment.certificateId) return;

    const [course, certDetails] = await Promise.all([
      getCourseBySlug(enrollment.courseSlug),
      getCertificateByNumber(enrollment.certificateId)
    ]);

    const certExpired = isCertificateExpired(enrollment);
    setCertData({
      userName: user.fullName,
      courseTitle: enrollment.courseTitle,
      startDate: new Date(enrollment.enrolledAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      endDate: new Date(enrollment.completedAt!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      instructor: certDetails?.instructorName || course?.instructor || "MyLearning Team",
      certificateId: enrollment.certificateId,
      instructorSignatureId: certDetails?.instructorSignatureId,
      adminSignatureId: certDetails?.adminSignatureId,
      isExpired: certExpired,
    });
  };

  const tabs = [
    { key: "lessons" as const, label: "Pelajaran", icon: BookOpen },
    { key: "quizzes" as const, label: "Quiz", icon: Brain },
    { key: "assignments" as const, label: "Tugas", icon: FileText },
    { key: "project" as const, label: "Proyek Akhir", icon: Target },
  ];

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Kursus <span className="gradient-text">Saya</span></h1>
        <p className="text-slate-400 text-sm mt-1">Kelola dan lacak progress belajar Anda</p>
      </div>

      {/* Active Course */}
      {active && (() => {
        const remaining = getRemainingDays(active);
        const deadline = getEnrollmentDeadline(active);
        const passedQuizzes = active.completedQuizzes?.filter((q) => q.passed).length || 0;

        return (
          <div className="card p-8 border-purple-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full" />
            <div className="flex items-center justify-between mb-6 relative z-10 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Sedang Dipelajari</h2>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full glass ${remaining <= 5 ? "text-red-400 border-red-500/20" : "text-amber-400 border-amber-500/20"}`}>
                <Clock size={14} /> {remaining} Hari Tersisa
              </div>
            </div>

            <h3 className="text-white font-bold text-2xl mb-2 relative z-10 leading-tight">{active.courseTitle}</h3>
            <p className="text-slate-500 text-xs mb-6 font-medium relative z-10">
              Batas Waktu: <span className="text-slate-300 font-bold">{deadline.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
              {activeCourseData && <span className="mx-2">•</span>}
              {activeCourseData && <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter text-[10px]">{getLevelLabel(activeCourseData.level)}</span>}
            </p>

            {/* Progress */}
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all duration-1000 ease-out" style={{ width: `${active.progress}%` }} />
              </div>
              <span className="text-sm font-black text-white min-w-[50px] text-right">{active.progress}%</span>
            </div>

            {/* Progress breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
              {[
                { label: "Materi", value: `${active.completedLessons.length}/${activeCourseData?.lessons.length || 0}`, bg: "bg-purple-500/5", border: "border-purple-500/20" },
                { label: "Quiz", value: `${passedQuizzes}/${activeAssessments?.quizzes.length || 0}`, bg: "bg-cyan-500/5", border: "border-cyan-500/20" },
                { label: "Tugas", value: `${active.completedAssignments?.length || 0}/${activeAssessments?.assignments.length || 0}`, bg: "bg-amber-500/5", border: "border-amber-500/20" },
                { label: "Proyek", value: active.finalProjectCompleted ? "LULUS" : "BELUM", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
              ].map((stat) => (
                <div key={stat.label} className={`text-center p-3 rounded-2xl ${stat.bg} border ${stat.border}`}>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-sm font-black text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-white/5 pb-1 relative z-10 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 rounded-t-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab.key 
                      ? "bg-white/5 text-purple-400 border-b-2 border-purple-500 shadow-[0_4px_12px_rgba(168,85,247,0.2)]" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <tab.icon size={14} className={activeTab === tab.key ? "animate-pulse" : ""} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content: Lessons */}
            {activeTab === "lessons" && activeCourseData && (
              <div className="space-y-2 relative z-10">
                {activeCourseData.lessons.map((lesson: any, idx: number) => {
                  const isDone = active.completedLessons.includes(lesson.id);
                  return (
                    <button key={lesson.id} onClick={() => setActiveLessonId(lesson.id)}
                      className={`w-full group flex items-center justify-between p-4 rounded-2xl transition-all text-left ${
                        isDone ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-white/[0.03] border border-white/5 hover:border-purple-500/30 hover:bg-white/5"
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                          isDone ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-500 group-hover:bg-purple-500/20 group-hover:text-purple-400"
                        }`}>
                          {isDone ? <CheckCircle size={18} /> : idx + 1}
                        </div>
                        <div>
                          <span className={`text-sm font-bold block ${isDone ? "text-emerald-300" : "text-white"}`}>{lesson.title}</span>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Durasi: {lesson.durationMinutes} Menit</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-opacity opacity-0 group-hover:opacity-100">Buka Materi</span>
                         <ChevronRight size={16} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab Content: Quizzes */}
            {activeTab === "quizzes" && activeAssessments && (
              <div className="space-y-4 relative z-10">
                {activeAssessments.quizzes.map((quiz: any) => {
                  const submission = active.completedQuizzes?.find((q) => q.quizId === quiz.id);
                  const passed = submission?.passed;
                  return (
                    <div key={quiz.id} className={`p-4 rounded-xl border ${passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium text-sm">{quiz.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{quiz.questions.length} pertanyaan • Minimal {quiz.passingScore}%</p>
                          {submission && <p className="text-xs mt-1"><span className={passed ? "text-emerald-400" : "text-red-400"}>Skor: {submission.score}%</span></p>}
                        </div>
                        <button
                          onClick={() => setActiveQuiz(quiz)}
                          className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                            passed ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                          }`}
                        >
                          {passed ? "✅ Lulus" : submission ? "Coba Lagi" : "Mulai Quiz"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab Content: Assignments */}
            {activeTab === "assignments" && activeAssessments && (
              <div className="space-y-3">
                {activeAssessments.assignments.map((assignment: any) => {
                  const done = active.completedAssignments?.includes(assignment.id);
                  return (
                    <div key={assignment.id} className={`p-4 rounded-xl border ${done ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium text-sm">{assignment.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{assignment.tasks.length} soal • ~{assignment.timeEstimateMinutes} menit</p>
                        </div>
                        <button
                          onClick={() => setActiveAssignment(assignment)}
                          className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                            done ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                          }`}
                        >
                          {done ? "✅ Selesai" : "Kerjakan"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab Content: Final Project */}
            {activeTab === "project" && activeAssessments && activeAssessments.finalProject && (
              <div className={`p-5 rounded-xl border ${active.finalProjectCompleted ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                <h4 className="text-white font-semibold mb-2">{activeAssessments.finalProject.title}</h4>
                <p className="text-slate-400 text-sm mb-4">{activeAssessments.finalProject.description}</p>
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase">Tujuan:</h5>
                  <ul className="space-y-1">{activeAssessments.finalProject.objectives.map((o: any, i: number) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2"><CheckCircle size={12} className="text-purple-400 mt-0.5 flex-shrink-0" /> {o}</li>
                  ))}</ul>
                </div>
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase">Deliverables:</h5>
                  <ul className="space-y-1">{activeAssessments.finalProject.deliverables.map((d: any, i: number) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2"><Target size={12} className="text-cyan-400 mt-0.5 flex-shrink-0" /> {d}</li>
                  ))}</ul>
                </div>
                <p className="text-xs text-slate-500 mb-6">Estimasi: ~{activeAssessments.finalProject.estimatedHours} jam</p>
                
                <FinalProjectForm 
                  enrollmentId={active.id}
                  projectTitle={activeAssessments.finalProject.title}
                  isCompleted={active.finalProjectCompleted}
                  existingUrl={active.finalProjectUrl}
                  existingNotes={active.finalProjectNotes}
                  adminFeedback={active.finalProjectFeedback}
                  onSuccess={() => forceRefresh()}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* Waiting Verification */}
      {waiting.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-3"><Clock size={20} className="text-cyan-400" /> MENUNGGU VERIFIKASI <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full">{waiting.length}</span></h2>
          <div className="grid gap-4">
            {waiting.map((enr) => (
              <div key={enr.id} className="card p-6 border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">{enr.courseTitle}</h3>
                      <p className="text-slate-400 text-xs mt-1 font-medium">Pembayaran Anda sedang diverifikasi secara manual oleh administrator.</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[.2em] bg-cyan-500/10 px-4 py-2 rounded-full animate-pulse border border-cyan-500/20">
                    <Loader2 size={14} className="animate-spin" /> Verifying
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected / Pending Payment */}
      {rejected.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-3"><AlertTriangle size={20} className="text-amber-400" /> PERLU TINDAKAN <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full">{rejected.length}</span></h2>
          <div className="grid gap-4">
            {rejected.map((enr) => {
              const course = getCourseBySlug(enr.courseSlug);
              return (
                <div key={enr.id} className="card p-6 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-xl mb-2">{enr.courseTitle}</h3>
                      {enr.status === "rejected" ? (
                        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-400 text-xs font-medium leading-relaxed">
                          <span className="font-black flex items-center gap-1.5 mb-1 uppercase tracking-widest text-[10px] opacity-75"><XCircle size={10} /> Alasan Penolakan:</span>
                          {enr.rejectionReason}
                        </div>
                      ) : (
                        <p className="text-amber-400/80 text-sm font-medium">Lengkapi pembayaran untuk mulai belajar.</p>
                      )}
                      <div className="mt-4 flex items-center gap-4">
                        <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Sisa Percobaan: {3 - enr.paymentRetryCount}x Lagi</span>
                        <div className="h-1 w-24 bg-white/5 rounded-full">
                           <div className="h-full bg-amber-500 rounded-full" style={{ width: `${((3 - enr.paymentRetryCount) / 3) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(enr)}
                      className="btn-primary !px-8 !py-3.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap self-stretch md:self-center shadow-xl shadow-purple-500/10"
                    >
                      <CreditCard size={16} /> {enr.status === "rejected" ? "UPDATE BUKTI" : "BAYAR SEKARANG"}
                    </button>
                    {showPaymentModal?.id === enr.id && (
                      <PaymentModal 
                        enrollment={enr}
                        courseTitle={enr.courseTitle}
                        price={enr.price}
                        qrisUrl={""} // Will be fetched inside PaymentModal if needed or pass from a more stable source
                        onClose={() => setShowPaymentModal(null)}
                        onSuccess={() => {
                          setShowPaymentModal(null);
                          forceRefresh();
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed (Limit Exceeded) */}
      {failed.length > 0 && (
        <div className="space-y-4 opacity-75">
          <h2 className="text-lg font-black text-white flex items-center gap-3 text-red-500"><XCircle size={20} /> GAGAL VERIFIKASI</h2>
          <div className="grid gap-4">
            {failed.map((enr) => (
              <div key={enr.id} className="card p-6 border-red-500/20 bg-red-500/5">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-white font-bold text-lg">{enr.courseTitle}</h3>
                      <p className="text-red-400 text-xs mt-1 font-medium italic opacity-80 leading-relaxed">Pendaftaran ditutup otomatis setelah 3 kali penolakan administratif.</p>
                    </div>
                    <button 
                      onClick={async () => {
                        if (confirm("Hapus pendaftaran gagal ini untuk mendaftar ulang?")) {
                          const { error } = await supabase.from("enrollments").delete().eq("id", enr.id);
                          if (!error) forceRefresh();
                          else alert("Error: " + error.message);
                        }
                      }}
                      className="btn-secondary !px-8 !py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/10"
                    >
                      <RefreshCcw size={16} /> DAFTAR ULANG
                    </button>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-3"><Award size={20} className="text-emerald-400" /> RIWAYAT SELESAI <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{completed.length}</span></h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {completed.map((enr) => {
              const certExpired = isCertificateExpired(enr);
              return (
                <div key={enr.id} className="card p-6 border-emerald-500/10 bg-emerald-500/[0.02] hover:border-emerald-500/30 transition-all flex flex-col justify-between group">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${certExpired ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20"}`}>
                      {certExpired ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</p>
                       <p className="text-sm font-black text-white">{enr.completedAt ? new Date(enr.completedAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "N/A"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2 leading-tight">{enr.courseTitle}</h3>
                    <div className="flex items-center gap-2 mb-6">
                      {certExpired ? (
                        <span className="text-[10px] font-black uppercase tracking-tighter text-amber-500 flex items-center gap-1.5"><AlertTriangle size={12} /> Sertifikat Kadaluarsa</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500 flex items-center gap-1.5"><Award size={12} /> Sertifikat Aktif</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleDownloadCert(enr)}
                        className={`w-full flex items-center justify-center gap-2 !py-3 rounded-2xl text-[10px] font-black uppercase tracking-[.2em] transition-all ${certExpired ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"}`}>
                        <Download size={14} className={certExpired ? "" : "animate-bounce"} /> {certExpired ? "DOWNLOAD (EXPIRED)" : "DOWNLOAD SERTIFIKAT"}
                      </button>
                      
                      {certExpired && (
                        <button 
                          onClick={async () => {
                            if (confirm("Sertifikat Anda sudah kadaluarsa. Anda wajib mengulang kursus dari 0% untuk mendapatkan sertifikat baru. Lanjutkan?")) {
                              const res = await resetEnrollmentForRetake(enr.id);
                              if (res.success) {
                                window.location.reload();
                              } else {
                                alert("Gagal mereset kursus: " + res.error);
                              }
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 !py-3 rounded-2xl text-[10px] font-black uppercase tracking-[.2em] bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10 transition-all"
                        >
                          <RefreshCcw size={14} /> ULANG KURSUS (DARI 0%)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <div className="space-y-4 opacity-50 grayscale hover:opacity-100 transition-opacity">
          <h2 className="text-lg font-black text-white flex items-center gap-3"><XCircle size={20} className="text-red-400" /> MASA BELAJAR HABIS</h2>
          <div className="grid gap-4">
            {expired.map((enr) => (
              <div key={enr.id} className="card p-6 border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-red-500"><XCircle size={24} /></div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{enr.courseTitle}</h3>
                    <p className="text-xs text-slate-500 font-medium">Expired pada: {enr.expiredAt ? new Date(enr.expiredAt).toLocaleDateString("id-ID") : "-"}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">No Certificate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {certData && (
        <CertificateGenerator 
          userName={certData.userName} 
          courseTitle={certData.courseTitle} 
          startDate={certData.startDate} 
          endDate={certData.endDate} 
          instructor={certData.instructor} 
          isExpired={certData.isExpired} 
          certificateId={certData.certificateId}
          onClose={() => setCertData(null)} 
        />
      )}
      {activeQuiz && active && (
        <QuizModal quiz={activeQuiz} enrollmentId={active.id} alreadyPassed={active.completedQuizzes?.some((q) => q.quizId === activeQuiz.id && q.passed) || false} previousScore={active.completedQuizzes?.find((q) => q.quizId === activeQuiz.id)?.score} onSubmit={handleQuizSubmit} onClose={() => { setActiveQuiz(null); forceRefresh(); }} />
      )}
      {activeAssignment && active && (
        <AssignmentModal 
          assignment={activeAssignment} 
          enrollmentId={active.id} 
          alreadyCompleted={active.completedAssignments?.includes(activeAssignment.id as any) || false} 
          onSubmit={handleAssignmentSubmit} 
          onClose={() => { setActiveAssignment(null); forceRefresh(); }} 
        />
      )}
      {activeLessonId && active && (
        <LessonPlayer 
          courseTitle={active.courseTitle}
          lessons={activeCourseData?.lessons || []}
          currentLessonId={activeLessonId}
          completedLessonIds={active.completedLessons}
          completedAssignmentIds={active.completedAssignments || []}
          onClose={() => { setActiveLessonId(null); forceRefresh(); }}
          onToggleComplete={(id) => handleToggleLesson(active, id)}
          onNavigate={(id) => setActiveLessonId(id)}
          onSubmitAssignment={handleAssignmentSubmit}
        />
      )}
    </div>
  );
}
