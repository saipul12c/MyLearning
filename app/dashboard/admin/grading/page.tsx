"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { getGradingQueue, gradeSubmission } from "@/lib/enrollment";
import { 
  ClipboardCheck, 
  FileText, 
  Target, 
  User, 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function GradingQueuePage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assignments" | "projects">("assignments");
  const [queue, setQueue] = useState<{ assignments: any[]; projects: any[] }>({ assignments: [], projects: [] });
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
       fetchQueue();
    }
  }, [user]);

  const fetchQueue = async () => {
    setLoading(true);
    // If instructor, only show their courses. If admin, show all.
    const instructorId = isInstructor && !isAdmin ? user?.id : undefined;
    const data = await getGradingQueue(instructorId);
    setQueue(data);
    setLoading(false);
  };

  const handleGrade = async (id: string, type: 'assignment' | 'project', passed: boolean) => {
    if (!feedback.trim() && !passed) {
      setMessage({ type: "error", text: "Berikan feedback jika tidak lulus." });
      return;
    }

    setIsSubmitting(true);
    const result = await gradeSubmission({
      type,
      id,
      passed,
      feedback,
      score: passed ? 100 : 0
    });

    if (result.success) {
      setMessage({ type: "success", text: "Berhasil memberikan penilaian!" });
      setGradingId(null);
      setFeedback("");
      fetchQueue();
    } else {
      setMessage({ type: "error", text: result.error || "Gagal menyimpan penilaian." });
    }
    setIsSubmitting(false);
  };

  if (!isAdmin && !isInstructor) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
       <AlertCircle size={48} className="text-red-500 mb-4" />
       <h1 className="text-xl font-bold text-white">Akses Ditolak</h1>
       <p className="text-slate-400">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Antrian <span className="gradient-text">Penilaian</span>
             <ClipboardCheck size={28} className="text-purple-400" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">Verifikasi tugas dan proyek akhir siswa secara terpusat</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
           <button 
             onClick={() => setActiveTab("assignments")}
             className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "assignments" ? "bg-purple-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
           >
             Tugas ({queue.assignments.length})
           </button>
           <button 
             onClick={() => setActiveTab("projects")}
             className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "projects" ? "bg-cyan-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
           >
             Proyek ({queue.projects.length})
           </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top duration-300 ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
           {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
           <p className="text-sm font-medium">{message.text}</p>
           <button onClick={() => setMessage(null)} className="ml-auto text-xs font-bold uppercase opacity-50 hover:opacity-100">Tutup</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 size={40} className="text-purple-500 animate-spin" />
           <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Memuat antrian...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeTab === "assignments" && (
            queue.assignments.length === 0 ? (
               <EmptyState icon={FileText} label="Antrian Tugas Kosong" />
            ) : (
               queue.assignments.map((item) => (
                 <GradingCard 
                   key={item.id}
                   item={item}
                   type="assignment"
                   isGrading={gradingId === item.id}
                   onGradeClick={() => setGradingId(item.id)}
                   onCancel={() => setGradingId(null)}
                   feedback={feedback}
                   setFeedback={setFeedback}
                   onSubmit={(passed: boolean) => handleGrade(item.id, "assignment", passed)}
                   isSubmitting={isSubmitting}
                 />
               ))
            )
          )}

          {activeTab === "projects" && (
            queue.projects.length === 0 ? (
               <EmptyState icon={Target} label="Antrian Proyek Kosong" />
            ) : (
               queue.projects.map((item) => (
                 <GradingCard 
                   key={item.id}
                   item={item}
                   type="project"
                   isGrading={gradingId === item.id}
                   onGradeClick={() => setGradingId(item.id)}
                   onCancel={() => setGradingId(null)}
                   feedback={feedback}
                   setFeedback={setFeedback}
                   onSubmit={(passed: boolean) => handleGrade(item.id, "project", passed)}
                   isSubmitting={isSubmitting}
                 />
               ))
            )
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
       <Icon size={48} className="text-slate-800 mx-auto mb-4" />
       <p className="text-white font-black uppercase tracking-widest text-lg">{label}</p>
       <p className="text-slate-500 text-xs mt-2 font-medium">Semua pekerjaan siswa telah dinilai. Bagus!</p>
    </div>
  );
}

interface GradingCardProps {
  item: any;
  type: 'assignment' | 'project';
  isGrading: boolean;
  onGradeClick: () => void;
  onCancel: () => void;
  feedback: string;
  setFeedback: (val: string) => void;
  onSubmit: (passed: boolean) => void;
  isSubmitting: boolean;
}

function GradingCard({ item, type, isGrading, onGradeClick, onCancel, feedback, setFeedback, onSubmit, isSubmitting }: GradingCardProps) {
  const studentName = item.user?.full_name || "Siswa";
  const courseTitle = type === "assignment" ? item.enrollment?.course_title : item.course_title;
  const submittedAt = type === "assignment" ? new Date(item.submitted_at) : new Date(item.enrolled_at); // Fallback for project
  const submissionUrl = type === "assignment" ? item.submission_url : item.final_project_url;
  const notes = type === "assignment" ? item.submission_notes : item.final_project_notes;

  return (
    <div className={`card overflow-hidden transition-all duration-500 border-white/5 ${isGrading ? "border-purple-500/30 bg-purple-500/[0.02] scale-[1.01]" : "hover:border-white/10"}`}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-[1px]">
               <div className="w-full h-full rounded-2xl bg-[#0c0c14] flex items-center justify-center">
                  <User size={20} className="text-white" />
               </div>
            </div>
            <div>
               <h3 className="text-white font-bold text-lg leading-none mb-1">{studentName}</h3>
               <p className="text-xs text-slate-500 font-medium">{courseTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Dikirim Pada</p>
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold justify-end">
                   <Clock size={14} className="text-purple-400" />
                   {submittedAt.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
             </div>
             
             {!isGrading && (
               <button 
                 onClick={onGradeClick}
                 className="btn-primary text-[10px] !py-3 !px-6 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-purple-500/10"
               >
                 Beri Nilai <ChevronRight size={14} />
               </button>
             )}
          </div>
        </div>

        {isGrading && (
          <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">Link Submission:</p>
                    <a 
                      href={submissionUrl} 
                      target="_blank" 
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-cyan-400 text-sm font-bold hover:bg-white/10 transition-all group"
                    >
                      Buka Hasil Kerja <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                  {notes && (
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Catatan Siswa:</p>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-slate-400 italic">
                         "{notes}"
                      </div>
                    </div>
                  )}
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Feedback & Penilaian:</p>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tulis saran atau evaluasi untuk siswa..."
                    className="input min-h-[120px] text-sm py-4 resize-none"
                  />
                  
                  <div className="flex items-center gap-3 pt-2">
                     <button 
                       disabled={isSubmitting}
                       onClick={() => onSubmit(true)}
                       className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                     >
                       <CheckCircle size={14} /> Lulus / Terima
                     </button>
                     <button 
                       disabled={isSubmitting}
                       onClick={() => onSubmit(false)}
                       className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                     >
                       <XCircle size={14} /> Tolak / Revisi
                     </button>
                  </div>
                  <button 
                    onClick={onCancel}
                    className="w-full text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors pt-2"
                  >
                    Batal
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
