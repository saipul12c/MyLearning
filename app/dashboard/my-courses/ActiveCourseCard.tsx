"use client";

import { Clock, BookOpen, Brain, FileText, Target, ChevronRight, CheckCircle } from "lucide-react";
import { getRemainingDays, getEnrollmentDeadline, getLevelLabel, type Enrollment } from "@/lib/enrollment";

interface ActiveCourseCardProps {
  active: Enrollment;
  activeCourseData: any;
  activeAssessments: any;
  activeTab: "lessons" | "quizzes" | "assignments" | "project";
  setActiveTab: (tab: any) => void;
  setActiveLessonId: (id: string) => void;
  setActiveQuiz: (quiz: any) => void;
  setActiveAssignment: (assignment: any) => void;
}

export default function ActiveCourseCard({
  active,
  activeCourseData,
  activeAssessments,
  activeTab,
  setActiveTab,
  setActiveLessonId,
  setActiveQuiz,
  setActiveAssignment,
}: ActiveCourseCardProps) {
  const remaining = getRemainingDays(active);
  const deadline = getEnrollmentDeadline(active);
  const passedQuizzes = active.completedQuizzes?.filter((q) => q.passed).length || 0;

  const tabs = [
    { key: "lessons" as const, label: "Pelajaran", icon: BookOpen },
    { key: "quizzes" as const, label: "Quiz", icon: Brain },
    { key: "assignments" as const, label: "Tugas", icon: FileText },
    { key: "project" as const, label: "Proyek Akhir", icon: Target },
  ];

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

      {/* Tab Content Logic */}
      <div className="relative z-10">
          {activeTab === "lessons" && activeCourseData && (
              <div className="space-y-2">
                  {activeCourseData.lessons.map((lesson: any, idx: number) => (
                      <LessonItem 
                          key={lesson.id} 
                          lesson={lesson} 
                          idx={idx} 
                          isDone={active.completedLessons.includes(lesson.id)} 
                          onClick={() => setActiveLessonId(lesson.id)} 
                      />
                  ))}
              </div>
          )}

          {activeTab === "quizzes" && activeAssessments && (
            <div className="space-y-4">
              {activeAssessments.quizzes.map((quiz: any) => {
                const submission = active.completedQuizzes?.find((q: any) => q.quizId === quiz.id);
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

          {activeTab === "project" && activeAssessments && activeAssessments.finalProject && (
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${active.finalProjectCompleted ? "border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-white/5 bg-white/[0.02]"}`}>
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-white font-bold text-lg">{activeAssessments.finalProject.title}</h4>
                 {active.finalProjectCompleted ? (
                   <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">Lulus & Terverifikasi</span>
                 ) : active.finalProjectUrl ? (
                   <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Menunggu Penilaian</span>
                 ) : (
                   <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest">Belum Dikirim</span>
                 )}
              </div>
              
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">{activeAssessments.finalProject.description}</p>
              
              <div className="flex flex-col gap-4">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 relative overflow-hidden group/instr">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full group-hover/instr:bg-purple-500/10 transition-colors" />
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Target size={14} className="text-purple-400" />
                         Instruksi Proyek & Deliverables:
                      </p>
                      <ul className="space-y-3">
                          {activeAssessments.finalProject.deliverables.map((d: any, i: number) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-3 group/li">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 mt-1.5 shrink-0 group-hover/li:scale-125 transition-transform" />
                                  <span className="leading-relaxed">{d}</span>
                              </li>
                          ))}
                      </ul>
                  </div>

                  {active.finalProjectUrl && !active.finalProjectCompleted && (
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                       <Clock size={16} className="text-amber-400 mt-0.5" />
                       <div>
                          <p className="text-xs font-bold text-amber-200">Proyek Anda Sedang Ditinjau</p>
                          <p className="text-[10px] text-amber-500/70 mt-0.5">Estimasi penilaian: 2-3 hari kerja. Anda akan menerima notifikasi jika hasil sudah tersedia.</p>
                       </div>
                    </div>
                  )}

                  {active.finalProjectFeedback && (
                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                       <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-2">Feedback Instruktur:</p>
                       <p className="text-xs text-slate-300 italic">"{active.finalProjectFeedback}"</p>
                    </div>
                  )}
                  
                  {!active.finalProjectCompleted && !active.finalProjectUrl && (
                    <button 
                      className="btn-primary !py-4 w-full text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/20"
                    >
                      SUBMIT PROYEK AKHIR
                    </button>
                  )}

                  {active.finalProjectCompleted && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                       <CheckCircle size={20} className="text-emerald-400" />
                       <p className="text-xs font-bold text-emerald-400">Selamat! Proyek Anda telah diterima dan kursus ini telah selesai.</p>
                    </div>
                  )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function LessonItem({ lesson, idx, isDone, onClick }: any) {
    return (
        <button onClick={onClick}
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
}
