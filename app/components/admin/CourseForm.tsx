"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
   ArrowLeft, Save, Loader2, Plus, Trash2, CheckCircle, AlertCircle, Check,
   Image as ImageIcon, Play, FileText, ChevronUp, ChevronDown, Edit, X, Eye,
   Brain, Target, Upload, Info, BookOpen, Clock, Settings, List, Award, Timer, HelpCircle,
   Type, ListOrdered, Bold, Italic, Link2, Code, Heading1, Heading2, Sparkles
} from "lucide-react";
import {
   getCategories, getInstructors, upsertCourse, getAdminCourseById,
   upsertLesson, deleteLesson, updateLessonsOrder
} from "@/lib/courses";
import { getInstructorProfile, ensureInstructorProfile } from "@/lib/instructor";
import { useAuth } from "../AuthContext";
import {
   getCourseAssessments, upsertAssessment, deleteAssessment,
   upsertQuizQuestion, deleteQuizQuestion
} from "@/lib/assessments";
import { uploadThumbnail } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { type Course } from "@/lib/data";
import Link from "next/link";
import Skeleton from "../ui/Skeleton";
import VideoInput from "../VideoInput";
import { generateAILessonContent, generateAIQuizQuestions, generateAIAssessmentContent } from "@/lib/gemini";
import Portal from "@/app/components/ui/Portal";

interface Props {
   courseId?: string;
}

interface CourseFormData {
   id?: string;
   title: string;
   slug: string;
   description: string;
   detailedDescription: string;
   thumbnail: string;
   previewVideoUrl: string;
   price: number;
   discountPrice: number;
   adminDiscountPrice: number;
   categoryId: string;
   instructorIdDb: string;
   level: "Starter" | "Accelerator" | "Mastery";
   language: string;
   durationHours: number;
   totalLessons: number;
   isPublished: boolean;
   isFeatured: boolean;
   learningPoints: string[];
   requirements: string[];
   lessons: any[];
}

interface NotificationState {
   show: boolean;
   message: string;
   type: "success" | "error";
}

export default function CourseForm({ courseId }: Props) {
   const router = useRouter();
   const { user, isAdmin, isInstructor } = useAuth();
   const [loading, setLoading] = useState(false);
   const [fetching, setFetching] = useState(!!courseId);
   const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
   const [instructors, setInstructors] = useState<{ id: string, name: string }[]>([]);
   const [notification, setNotification] = useState<NotificationState>({ show: false, message: "", type: "success" });
   const [activeTab, setActiveTab] = useState<"basic" | "curriculum" | "assessments">("basic");
   const [isUploading, setIsUploading] = useState(false);

   // Assessments state
   const [assessments, setAssessments] = useState<any>({ quizzes: [], assignments: [], finalProject: null });
   const [assessmentModal, setAssessmentModal] = useState<{
      isOpen: boolean;
      type: "quiz" | "assignment" | "final_project";
      data: any | null;
      isSaving: boolean;
   }>({
      isOpen: false,
      type: "quiz",
      data: null,
      isSaving: false
   });

   const [questionModal, setQuestionModal] = useState<{
      isOpen: boolean;
      assessmentId: string;
      data: any | null;
      isSaving: boolean;
   }>({
      isOpen: false,
      assessmentId: "",
      data: null,
      isSaving: false
   });

   const [formData, setFormData] = useState<CourseFormData>({
      title: "",
      slug: "",
      description: "",
      detailedDescription: "",
      thumbnail: "",
      previewVideoUrl: "",
      price: 0,
      discountPrice: 0,
      adminDiscountPrice: 0,
      categoryId: "",
      instructorIdDb: "",
      level: "Starter",
      language: "Bahasa Indonesia",
      durationHours: 1,
      totalLessons: 0,
      isPublished: false,
      isFeatured: false,
      learningPoints: [""],
      requirements: [""],
      lessons: []
   });

   const [modalTab, setModalTab] = useState<"config" | "content">("config");

   const [lessonModal, setLessonModal] = useState<{
      isOpen: boolean;
      lesson: any | null;
      isSaving: boolean;
   }>({
      isOpen: false,
      lesson: null,
      isSaving: false
   });

   const [isReordering, setIsReordering] = useState(false);
   const [isGeneratingAI, setIsGeneratingAI] = useState(false);
   const [initialInstructorId, setInitialInstructorId] = useState<string | null>(null);

   useEffect(() => {
      async function loadResources() {
         setFetching(true);
         try {
            const [cats, insts] = await Promise.all([getCategories(), getInstructors()]);

            const fetchedInstructors = insts.map(i => ({ id: i.id, name: i.name }));

            // If instructor or admin, auto-set their profile ID
            if (user && !courseId) {
               let profile: any = null;
               if (isAdmin) {
                 profile = await ensureInstructorProfile(user.id, user.fullName);
                 // Make sure it's in the list
                 if (profile && !fetchedInstructors.find(i => i.id === profile.id)) {
                   fetchedInstructors.push({ id: profile.id, name: profile.name });
                 }
               } else if (isInstructor) {
                 profile = await getInstructorProfile(user.id);
               }
               
               if (profile) {
                  setFormData(prev => ({ ...prev, instructorIdDb: profile.id }));
               }
            }

            setCategories(cats.map(c => ({ id: c.id, name: c.name })) || []);
            setInstructors(fetchedInstructors || []);

            if (courseId) {
               const course = await getAdminCourseById(courseId);
               if (course) {
                  setFormData({
                     id: course.id,
                     title: course.title,
                     slug: course.slug,
                     description: course.short_description || "",
                     detailedDescription: course.description || "",
                     thumbnail: course.thumbnail_url || "",
                     previewVideoUrl: course.preview_video_url || "",
                     price: course.price || 0,
                     discountPrice: course.discount_price || 0,
                     adminDiscountPrice: course.admin_discount_price || 0,
                     categoryId: course.category_id,
                     instructorIdDb: course.instructor_id,
                     level: course.level,
                     language: course.language || "Bahasa Indonesia",
                     durationHours: Number(course.duration_hours) || 0,
                     totalLessons: course.total_lessons || 0,
                     isPublished: !!course.is_published,
                     isFeatured: !!course.is_featured,
                     learningPoints: course.learning_points || [""],
                     requirements: course.requirements || [""],
                     lessons: course.lessons || []
                  });
                  setInitialInstructorId(course.instructor_id);

                  const realAssessments = await getCourseAssessments(course.slug);
                  if (realAssessments) setAssessments(realAssessments);
               }
            }
         } catch (err) {
            console.error("Error loading resources:", err);
         } finally {
            setFetching(false);
         }
      }
      loadResources();
   }, [courseId]);

   const showNotification = (message: string, type: "success" | "error") => {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const res = await upsertCourse(formData as any);
      setLoading(false);

      if (res.success) {
         showNotification("Data kursus berhasil disimpan!", "success");
         setTimeout(() => router.push("/dashboard/admin/courses"), 1500);
      } else {
         showNotification("Gagal menyimpan: " + (res.error as any).message, "error");
      }
   };

   const handleArrayChange = (field: 'learningPoints' | 'requirements', index: number, value: string) => {
      const newArr = [...formData[field]];
      newArr[index] = value;
      setFormData({ ...formData, [field]: newArr });
   };

   const addArrayItem = (field: 'learningPoints' | 'requirements') => {
      setFormData({ ...formData, [field]: [...formData[field], ""] });
   };

   const removeArrayItem = (field: 'learningPoints' | 'requirements', index: number) => {
      const newArr = formData[field].filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, [field]: newArr });
   };

   // Lesson Handlers
   const openLessonModal = (lesson: any = null) => {
      setLessonModal({
         isOpen: true,
         lesson: lesson ? {
            ...lesson,
            lessonAssignment: assessments.assignments.find((a: any) => a.lesson_id === lesson.id) || null
         } : {
            course_id: courseId,
            title: "",
            duration_minutes: 0,
            video_url: "",
            description: "",
            is_free_preview: false,
            content_type: "video",
            order_index: formData.lessons.length,
            lessonAssignment: null
         },
         isSaving: false
      });
   };

   const handleSaveLesson = async (lessonData: any) => {
      if (!courseId) {
         showNotification("Simpan kursus terlebih dahulu sebelum mengelola materi.", "error");
         return;
      }

      setLessonModal(prev => ({ ...prev, isSaving: true }));
      const res = await upsertLesson({ ...lessonData, course_id: courseId });

      if (res.success) {
         // 2. Save Assessment if present
         if (lessonData.lessonAssignment) {
            const assRes = await upsertAssessment({
               ...lessonData.lessonAssignment,
               course_id: courseId,
               lesson_id: (res.data as any).id, // Use the new/existing lesson ID
               assessment_type: 'assignment',
               title: lessonData.lessonAssignment.title || `Tugas: ${lessonData.title}`, // Fallback title
            });
            if (!assRes.success) {
               console.error("Failed to save lesson assignment:", assRes.error);
            }
         }

         showNotification("Materi berhasil disimpan!", "success");
         setLessonModal({ isOpen: false, lesson: null, isSaving: false });

         const course = await getAdminCourseById(courseId as string);
         if (course) {
            setFormData(prev => ({ ...prev, lessons: course.lessons || [] }));
         }
      } else {
         showNotification("Gagal menyimpan materi: " + (res.error as any).message, "error");
      }
      setLessonModal(prev => ({ ...prev, isSaving: false }));
   };

   const handleDeleteLesson = async (id: string, title: string) => {
      if (!confirm(`Hapus materi "${title}"?`)) return;

      const res = await deleteLesson(id);
      if (res.success) {
         showNotification("Materi berhasil dihapus.", "success");
         setFormData(prev => ({
            ...prev,
            lessons: prev.lessons.filter(l => l.id !== id)
         }));
      } else {
         showNotification("Gagal menghapus: " + (res.error as any).message, "error");
      }
   };

   const handleGenerateAI = async () => {
      if (!lessonModal.lesson?.title) {
         showNotification("Masukkan judul materi terlebih dahulu untuk generate AI.", "error");
         return;
      }

      setIsGeneratingAI(true);
      try {
         const content = await generateAILessonContent(
            formData.title,
            lessonModal.lesson.title,
            (lessonModal.lesson?.content_type || 'video') as 'video' | 'article'
         );
         setLessonModal(prev => ({
            ...prev,
            lesson: { ...prev.lesson, description: content }
         }));
         showNotification("Materi berhasil digenerate oleh AI!", "success");
      } catch (err: any) {
         showNotification("Gagal generate AI: " + err.message, "error");
      } finally {
         setIsGeneratingAI(false);
      }
   };

   const handleGenerateAIQuestions = async (assessmentId: string, topic: string) => {
      if (!topic) {
         showNotification("Judul kuis harus ada untuk generate pertanyaan.", "error");
         return;
      }
      setIsGeneratingAI(true);
      try {
         const questions = await generateAIQuizQuestions(formData.title, topic, 5);
         for (const q of questions) {
            await upsertQuizQuestion({ ...q, assessment_id: assessmentId });
         }
         showNotification(`${questions.length} Pertanyaan kuis digenerate oleh AI!`, "success");
         const updated = await getCourseAssessments(formData.slug);
         if (updated) setAssessments(updated);
      } catch (err: any) {
         showNotification("Gagal generate kuis AI: " + err.message, "error");
      } finally {
         setIsGeneratingAI(false);
      }
   };

   const handleGenerateAIAssessment = async (type: 'assignment' | 'final_project') => {
      if (!assessmentModal.data?.title) {
         showNotification("Masukkan judul terlebih dahulu.", "error");
         return;
      }
      setIsGeneratingAI(true);
      try {
         const content = await generateAIAssessmentContent(formData.title, assessmentModal.data.title, type);
         setAssessmentModal(prev => ({
            ...prev,
            data: {
               ...prev.data,
               description: content.description || prev.data.description,
               instructions: content.instructions || prev.data.instructions,
               evaluation_criteria: content.evaluation_criteria || prev.data.evaluation_criteria,
               title: content.title || prev.data.title
            }
         }));
         showNotification("Konten asesmen digenerate oleh AI!", "success");
      } catch (err: any) {
         showNotification("Gagal generate AI: " + err.message, "error");
      } finally {
         setIsGeneratingAI(false);
      }
   };

   // Thumbnail Upload Handler
   const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const { url, error } = await uploadThumbnail(file);
      setIsUploading(false);

      if (error) {
         showNotification("Gagal mengunggah gambar: " + error.message, "error");
      } else if (url) {
         setFormData({ ...formData, thumbnail: url });
         showNotification("Gambar berhasil diunggah!", "success");
      }
   };

   // Assessment Handlers
   const handleSaveAssessment = async (data: any) => {
      if (!courseId) return;
      setAssessmentModal(prev => ({ ...prev, isSaving: true }));
      const res = await upsertAssessment({ ...data, course_id: courseId });
      setAssessmentModal(prev => ({ ...prev, isSaving: false }));

      if (res.success) {
         showNotification("Asesmen berhasil disimpan!", "success");
         setAssessmentModal({ isOpen: false, type: "quiz", data: null, isSaving: false });
         const updated = await getCourseAssessments(formData.slug);
         if (updated) setAssessments(updated);
      } else {
         showNotification("Gagal menyimpan: " + (res.error as any).message, "error");
      }
   };

   const handleDeleteAssessment = async (id: string, title: string) => {
      if (!confirm(`Hapus asesmen "${title}"?`)) return;
      const res = await deleteAssessment(id);
      if (res.success) {
         showNotification("Asesmen berhasil dihapus.", "success");
         const updated = await getCourseAssessments(formData.slug);
         if (updated) setAssessments(updated);
      }
   };

   const handleSaveQuestion = async (data: any) => {
      setQuestionModal(prev => ({ ...prev, isSaving: true }));
      const res = await upsertQuizQuestion(data);
      setQuestionModal(prev => ({ ...prev, isSaving: false }));

      if (res.success) {
         showNotification("Pertanyaan berhasil disimpan!", "success");
         setQuestionModal({ isOpen: false, assessmentId: "", data: null, isSaving: false });
         const updated = await getCourseAssessments(formData.slug);
         if (updated) setAssessments(updated);
      }
   };

   const handleDeleteQuestion = async (id: string) => {
      if (!confirm("Hapus pertanyaan ini?")) return;
      const res = await deleteQuizQuestion(id);
      if (res.success) {
         const updated = await getCourseAssessments(formData.slug);
         if (updated) setAssessments(updated);
      }
   };

   const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
      if (isReordering) return;
      const newLessons = [...formData.lessons];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newLessons.length) return;
      [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
      const updatedLessons = newLessons.map((l, i) => ({ id: l.id, order_index: i }));
      setFormData(prev => ({ ...prev, lessons: newLessons }));
      setIsReordering(true);
      const res = await updateLessonsOrder(updatedLessons);
      setIsReordering(false);
      if (!res.success) {
         showNotification("Gagal memperbarui urutan materi.", "error");
         const course = await getAdminCourseById(courseId as string);
         if (course) setFormData(prev => ({ ...prev, lessons: course.lessons || [] }));
      }
   };

   if (fetching) {
      return (
         <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid md:grid-cols-2 gap-6">
               <Skeleton className="h-64 rounded-2xl" />
               <Skeleton className="h-64 rounded-2xl" />
            </div>
         </div>
      );
   }

   return (
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">
         {notification.show && (
            <Portal>
               <div className={`fixed top-6 right-6 z-[10000] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl glass-strong animate-slide-right ${notification.type === "success" ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"
                  }`}>
                  {notification.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <p className="font-semibold">{notification.message}</p>
               </div>
            </Portal>
         )}

         {/* Header & Tab Switcher - Sticks flush to dashboard top bar */}
         <div className="flex items-center justify-between sticky top-0 z-20 py-4 glass bg-[#09090f]/95 border-b border-white/5 px-2 mb-8 backdrop-blur-xl transition-all duration-300">
            <div className="flex items-center gap-3">
               <Link href="/dashboard/admin/courses" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group">
                  <ArrowLeft size={20} className="text-white transition-transform group-hover:-translate-x-1" />
               </Link>
               <h1 className="text-2xl font-bold text-white tracking-tight">
                  {courseId ? "Edit" : "Tambah"} <span className="gradient-text">Kursus</span>
               </h1>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
                  {[
                     { id: 'basic', label: 'Dashboard', icon: Edit },
                     { id: 'curriculum', label: 'Kurikulum', icon: BookOpen },
                     { id: 'assessments', label: 'Asesmen', icon: Brain },
                  ].map(t => (
                     <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id as any)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === t.id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'
                           }`}
                     >
                        <t.icon size={14} /> {t.label}
                     </button>
                  ))}
               </div>
               <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-8 min-w-[140px]">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span className="font-bold">{courseId ? "Perbarui" : "Simpan"}</span>
               </button>
            </div>
         </div>

         {activeTab === "basic" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Info Card */}
                  <div className="card p-8 space-y-6">
                     <h2 className="text-lg font-bold text-white flex items-center gap-2">Informasi Dasar</h2>
                     <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Judul Kursus</label>
                           <input className="input w-full" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: UI/UX Masterclass" required />
                           <p className="text-[9px] text-slate-500 px-1 font-medium">Gunakan nama yang menarik dan deskriptif untuk kursus Anda.</p>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Slug Kursus</label>
                           <input className="input w-full" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="contoh judul-kursus" required />
                           <p className="text-[9px] text-slate-500 px-1 font-medium italic">URL unik kursus (hanya huruf, angka, dan tanda hubung).</p>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kategori</label>
                           <select className="input w-full" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required>
                              <option value="">Pilih Kategori</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                           <p className="text-[9px] text-slate-500 px-1 font-medium">Pilih kategori yang paling sesuai dengan topik materi.</p>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Instruktur</label>
                           <select
                              className="input w-full"
                              value={formData.instructorIdDb}
                              onChange={e => setFormData({ ...formData, instructorIdDb: e.target.value })}
                              required
                              disabled={isInstructor && !isAdmin}
                           >
                              <option value="">Pilih Instruktur</option>
                              {instructors.map(i => (
                                 <option key={i.id} value={i.id}>
                                    {i.name} {i.id === initialInstructorId ? "(Penulis Asli)" : ""}
                                 </option>
                              ))}
                           </select>
                           <p className="text-[9px] text-slate-500 px-1 font-medium italic">Profil instruktur yang akan ditampilkan sebagai pengajar.</p>
                        </div>
                     </div>
                  </div>

                  {/* Pricing Card */}
                  <div className="card p-8 space-y-6">
                     <h2 className="text-lg font-bold text-white">Harga & Level</h2>
                     <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Harga Normal</label>
                           <input type="number" className="input w-full" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="Contoh: 500000" />
                           <p className="text-[9px] text-slate-500 px-1 font-medium">Harga dasar sebelum diskon apapun diterapkan.</p>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Harga Diskon Instruktur</label>
                           <input type="number" className="input w-full" value={formData.discountPrice} onChange={e => setFormData({ ...formData, discountPrice: Number(e.target.value) })} placeholder="Contoh: 250000" />
                           <p className="text-[9px] text-slate-500 px-1 font-medium italic">Harga jual khusus yang ditawarkan oleh instruktur.</p>
                        </div>

                        {isAdmin && (
                           <div className="pt-4 border-t border-white/5 space-y-2">
                              <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest pl-1">Diskon Khusus Admin</label>
                              <input type="number" className="input w-full border-cyan-500/30 bg-cyan-500/5 focus:border-cyan-500" value={formData.adminDiscountPrice} onChange={e => setFormData({ ...formData, adminDiscountPrice: Number(e.target.value) })} placeholder="Contoh: 50000" />
                              <p className="text-[9px] text-slate-500 px-1 italic">Potongan ini akan mengurangi harga akhir secara langsung.</p>
                           </div>
                        )}

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Level Kursus</label>
                           <select className="input w-full" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value as any })}>
                              <option value="Starter">Starter</option>
                              <option value="Accelerator">Accelerator</option>
                              <option value="Mastery">Mastery</option>
                           </select>
                           <p className="text-[9px] text-slate-500 px-1 font-medium">Tingkat kesulitan materi untuk target siswa.</p>
                        </div>
                        <div className="flex gap-4">
                           <label className="flex items-center gap-2 text-white text-sm">
                              <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({ ...formData, isPublished: e.target.checked })} /> Published
                           </label>
                           <label className="flex items-center gap-2 text-white text-sm opacity-60">
                              <input
                                 type="checkbox"
                                 checked={formData.isFeatured}
                                 onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                 disabled={!isAdmin}
                              /> Featured {!isAdmin && <span className="text-[10px] ml-1">(Admin only)</span>}
                           </label>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Thumbnail Card */}
               <div className="card p-8 space-y-6">
                  <h2 className="text-lg font-bold text-white">Thumbnail</h2>
                  <div className="flex gap-4">
                     <input className="input w-full" value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })} placeholder="Thumbnail URL" />
                     <label className="btn-secondary !w-12 !p-0 flex items-center justify-center cursor-pointer">
                        {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        <input type="file" className="hidden" onChange={handleThumbnailUpload} />
                     </label>
                  </div>
                  {formData.thumbnail && <img src={formData.thumbnail} className="w-full h-48 object-cover rounded-xl border border-white/10" />}
               </div>

                {/* Preview Video URL Card */}
                <div className="card p-8 space-y-6">
                   <h2 className="text-lg font-bold text-white flex items-center gap-2"><Play size={20} className="text-purple-400" /> Preview Video</h2>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">URL Video Preview</label>
                      <input 
                         className="input w-full" 
                         value={formData.previewVideoUrl} 
                         onChange={e => setFormData({ ...formData, previewVideoUrl: e.target.value })} 
                         placeholder="https://youtube.com/watch?v=... atau URL video lainnya" 
                      />
                      <p className="text-[9px] text-slate-500 px-1 font-medium italic">Video yang ditampilkan sebagai preview gratis di halaman detail kursus. Kosongkan jika tidak ada.</p>
                   </div>
                </div>

               <div className="card p-8 space-y-6">
                  <h2 className="text-lg font-bold text-white">Konten Deskripsi</h2>
                  <div className="space-y-2">
                     <textarea className="input w-full h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi Singkat" />
                     <p className="text-[10px] text-slate-500 px-1">Ringkasan materi (maks 200 karakter) yang muncul di kartu kursus.</p>
                  </div>
                  <div className="space-y-2">
                     <textarea className="input w-full h-48 font-mono text-sm" value={formData.detailedDescription} onChange={e => setFormData({ ...formData, detailedDescription: e.target.value })} placeholder="Deskripsi Detail (Markdown)" />
                     <p className="text-[10px] text-slate-500 px-1 italic">Mendukung format Markdown untuk penulisan kurikulum dan poin-poin penting.</p>
                  </div>
               </div>
            </div>
         )}

         {activeTab === "curriculum" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="card p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <h2 className="text-xl font-bold text-white flex items-center gap-2"><Play size={20} className="text-purple-400" /> Materi Kursus</h2>
                     <button type="button" onClick={() => openLessonModal()} disabled={!courseId} className="btn-primary !py-2 !px-4 text-xs">Tambah Materi</button>
                  </div>
                  <div className="space-y-4">
                     {formData.lessons.map((lesson, i) => (
                        <div key={lesson.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                 <button type="button" onClick={() => handleMoveLesson(i, 'up')} disabled={i === 0}><ChevronUp size={14} /></button>
                                 <button type="button" onClick={() => handleMoveLesson(i, 'down')} disabled={i === formData.lessons.length - 1}><ChevronDown size={14} /></button>
                              </div>
                              <div>
                                 <h4 className="text-white font-bold text-sm">{lesson.title}</h4>
                                 <p className="text-[10px] text-slate-500 uppercase font-bold">{lesson.duration_minutes}m • {lesson.content_type}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => openLessonModal(lesson)} className="p-2 hover:bg-white/10 rounded-lg"><Edit size={16} /></button>
                              <button type="button" onClick={() => handleDeleteLesson(lesson.id, lesson.title)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                           </div>
                        </div>
                     ))}
                     {!courseId && <p className="text-center text-slate-500 italic text-sm">Simpan kursus terlebih dahulu.</p>}
                  </div>
               </div>
            </div>
         )}

         {activeTab === "assessments" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {!courseId ? (
                  <div className="card p-12 flex flex-col items-center justify-center text-center space-y-4">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Brain size={32} className="text-slate-500" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-white">Kelola Asesmen</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">Simpan data dasar kursus terlebih dahulu sebelum dapat mengelola kuis, tugas, dan projek akhir.</p>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-8">
                     {/* Statistics Overview */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                           { label: 'Total Kuis', value: assessments.quizzes.length, icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                           { label: 'Total Tugas', value: assessments.assignments.length, icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                           { label: 'Projek Akhir', value: assessments.finalProject ? 'Aktif' : 'Belum Ada', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                           { label: 'Bobot Nilai', value: '100%', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        ].map((stat, i) => (
                           <div key={i} className="card p-4 flex items-center gap-4 border-white/5 bg-white/[0.02]">
                              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                 <stat.icon size={20} />
                              </div>
                              <div>
                                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{stat.label}</p>
                                 <p className="text-lg font-bold text-white leading-tight">{stat.value}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         {/* Quizzes Column */}
                         <div className="space-y-4">
                            <div className="flex items-center justify-between px-3 py-2 bg-purple-500/5 rounded-xl border border-purple-500/10">
                               <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                     <Brain size={16} className="text-purple-400" />
                                  </div>
                                  Kuis & Ujian
                               </h3>
                               <button
                                  type="button"
                                  onClick={() => setAssessmentModal({ isOpen: true, type: 'quiz', data: { passing_score: 70, time_limit_minutes: 15, max_attempts: 0, is_required: true }, isSaving: false })}
                                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                               >
                                  <Plus size={14} /> Tambah Kuis
                               </button>
                            </div>
                            <div className="space-y-3 pl-1 border-l-2 border-purple-500/10 ml-4 py-2">
                               {assessments.quizzes.length === 0 && (
                                  <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center bg-white/[0.01] ml-[-1rem]">
                                     <HelpCircle className="mx-auto text-slate-700 mb-2" size={32} />
                                     <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Belum Ada Kuis</p>
                                     <p className="text-slate-500 text-[10px] mt-2 max-w-[200px] mx-auto font-medium">Buat kuis pilihan ganda untuk menguji pemahaman materi siswa secara otomatis.</p>
                                  </div>
                               )}
                               {assessments.quizzes.map((q: any) => (
                                  <div key={q.id} className="group relative glass-card p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-300 ml-[-1rem]">
                                     <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                           <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">Kuis</span>
                                              <h4 className="text-white font-bold">{q.title}</h4>
                                           </div>
                                           <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">
                                              <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full"><List size={10} /> {q.questions?.length || 0} Soal</span>
                                              <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full"><Timer size={10} /> {q.timeLimitMinutes || 0}m</span>
                                              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Lulus: {q.passingScore}%</span>
                                           </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                           <button type="button" onClick={() => setAssessmentModal({ isOpen: true, type: 'quiz', data: q, isSaving: false })} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors" title="Edit Pengaturan"><Edit size={14} /></button>
                                           <button type="button" onClick={() => handleDeleteAssessment(q.id, q.title)} className="w-8 h-8 flex items-center justify-center hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors" title="Hapus Kuis"><Trash2 size={14} /></button>
                                        </div>
                                     </div>
                                     <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                           <button
                                              type="button"
                                              onClick={() => setQuestionModal({ isOpen: true, assessmentId: q.id, data: { correct_answer_index: 0, options: ['', '', '', ''], points: 1 }, isSaving: false })}
                                              className="btn-secondary !text-[10px] !py-1.5 !px-4 !rounded-full border-purple-500/20 hover:border-purple-500/40"
                                           >
                                              Kelola Soal
                                           </button>
                                           <button
                                              type="button"
                                              disabled={isGeneratingAI}
                                              onClick={() => handleGenerateAIQuestions(q.id, q.title)}
                                              className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-white transition-colors px-2"
                                           >
                                              {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Generate
                                           </button>
                                        </div>
                                        {q.isRequired && (
                                           <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                              <CheckCircle size={10} className="text-purple-500" /> Wajib
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
 
                         {/* Assignments Column */}
                         <div className="space-y-4">
                            <div className="flex items-center justify-between px-3 py-2 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                               <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                     <FileText size={16} className="text-cyan-400" />
                                  </div>
                                  Tugas Praktik
                               </h3>
                               <button
                                  type="button"
                                  onClick={() => setAssessmentModal({ isOpen: true, type: 'assignment', data: { is_required: true }, isSaving: false })}
                                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors"
                               >
                                  <Plus size={14} /> Tambah Tugas
                               </button>
                            </div>
                            <div className="space-y-3 pl-1 border-l-2 border-cyan-500/10 ml-4 py-2">
                               {assessments.assignments.length === 0 && (
                                  <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center bg-white/[0.01] ml-[-1rem]">
                                     <ListOrdered className="mx-auto text-slate-700 mb-2" size={32} />
                                     <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Belum Ada Tugas</p>
                                     <p className="text-slate-500 text-[10px] mt-2 max-w-[200px] mx-auto font-medium">Berikan tantangan praktik nyata untuk mengasah skill teknis siswa.</p>
                                  </div>
                               )}
                               {assessments.assignments.map((a: any) => (
                                  <div key={a.id} className="group glass-card p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300 ml-[-1rem]">
                                     <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                           <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">Tugas</span>
                                              <h4 className="text-white font-bold">{a.title}</h4>
                                           </div>
                                           <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">{a.description || 'Tidak ada deskripsi'}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                           <button type="button" onClick={() => setAssessmentModal({ isOpen: true, type: 'assignment', data: a, isSaving: false })} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"><Edit size={14} /></button>
                                           <button type="button" onClick={() => handleDeleteAssessment(a.id, a.title)} className="w-8 h-8 flex items-center justify-center hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                     </div>
                                     <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md text-slate-400">
                                           <Target size={12} className="text-cyan-500" /> Case Study
                                        </span>
                                        {a.is_required && (
                                           <div className="flex items-center gap-1 text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                                              <CheckCircle size={10} className="text-cyan-500" /> Syarat Lulus
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               ))}
                            </div>
 
                            {/* Final Project Section */}
                            <div className="pt-8 space-y-4">
                               <div className="flex items-center gap-3 px-3 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                     <Award size={16} className="text-amber-400" />
                                  </div>
                                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Projek Akhir</h3>
                               </div>
                               <div className="pl-1 border-l-2 border-amber-500/10 ml-4 py-2">
                                  {!assessments.finalProject ? (
                                     <button
                                        type="button"
                                        onClick={() => setAssessmentModal({ isOpen: true, type: 'final_project', data: { is_required: true }, isSaving: false })}
                                        className="w-full p-6 rounded-3xl border-2 border-dashed border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-2 transition-all group ml-[-1rem]"
                                     >
                                        <Award size={24} className="text-slate-600 group-hover:text-amber-400 transition-transform group-hover:scale-110" />
                                        <span className="text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-[0.2em]">Aktifkan Projek Kelulusan</span>
                                     </button>
                                  ) : (
                                     <div className="group relative overflow-hidden glass-card p-6 rounded-3xl border border-amber-500/30 bg-amber-500/[0.02] ml-[-1rem] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                           <button type="button" onClick={() => setAssessmentModal({ isOpen: true, type: 'final_project', data: assessments.finalProject, isSaving: false })} className="w-10 h-10 flex items-center justify-center bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"><Edit size={16} /></button>
                                        </div>
                                        <div className="flex items-start gap-4">
                                           <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0 animate-pulse-slow">
                                              <Award size={28} />
                                           </div>
                                           <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                 <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black uppercase tracking-widest">Ultimate goal</span>
                                              </div>
                                              <h4 className="text-lg font-black text-white leading-tight tracking-tight uppercase">{assessments.finalProject.title}</h4>
                                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-medium">{assessments.finalProject.description}</p>
                                              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                                                 <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Status Kelulusan</span>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                                                       <CheckCircle size={10} /> WAJIB
                                                    </div>
                                                 </div>
                                                 <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                                                 <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Estimasi Kerja</span>
                                                    <span className="text-sm font-black text-white font-mono">{assessments.finalProject.estimatedHours || 0} JAM</span>
                                                 </div>
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                  </div>
               )}
            </div>
         )}

         {/* Lesson Modal (Overhauled) */}
         {lessonModal.isOpen && (
            <Portal>
               <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
                  <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0F172A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                     {/* Modal Header */}
                     <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-[#0F172A]/95 backdrop-blur-sm">
                        <div>
                           <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                              <BookOpen className="text-purple-400" /> Detail Materi Kursus
                           </h3>
                           <p className="text-slate-500 text-sm mt-1">Kelola konten pelajaran, durasi, dan jenis materi.</p>
                        </div>
                        <button type="button" onClick={() => setLessonModal({ ...lessonModal, isOpen: false })} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Judul Materi</label>
                              <input className="input-premium w-full !bg-white/5" value={lessonModal.lesson?.title || ""} onChange={e => setLessonModal({ ...lessonModal, lesson: { ...lessonModal.lesson, title: e.target.value } })} placeholder="Contoh: Pengenalan Dasar Sistem" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Durasi (Menit)</label>
                              <div className="relative flex items-center">
                                 <Clock className="absolute left-4 text-slate-500" size={16} />
                                 <input type="number" className="input-premium w-full !pl-12 !bg-white/5" value={lessonModal.lesson?.duration_minutes || 0} onChange={e => setLessonModal({ ...lessonModal, lesson: { ...lessonModal.lesson, duration_minutes: Number(e.target.value) } })} placeholder="15" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Tipe Materi</label>
                           <div className="flex gap-3">
                              {[
                                 { id: 'video', label: 'Video Pelajaran', icon: Play },
                                 { id: 'article', label: 'Artikel / Bacaan', icon: FileText },
                              ].map(type => (
                                 <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setLessonModal({ ...lessonModal, lesson: { ...lessonModal.lesson, content_type: type.id } })}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${(lessonModal.lesson?.content_type || 'video') === type.id
                                          ? 'border-purple-500 bg-purple-500/10 text-white font-bold'
                                          : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/10'
                                       }`}
                                 >
                                    <type.icon size={16} /> {type.label}
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Video URL (Only if Video) */}
                        {(lessonModal.lesson?.content_type === 'video' || !lessonModal.lesson?.content_type) && (
                           <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                              <VideoInput
                                 value={lessonModal.lesson?.video_url || ""}
                                 onChange={(url) => setLessonModal({ ...lessonModal, lesson: { ...lessonModal.lesson, video_url: url } })}
                                 label="Video Materi"
                                 placeholder="Link YouTube atau URL Video"
                              />
                           </div>
                        )}

                        {/* Content / Description with Markdown Toolbar */}
                        <div className="space-y-1.5">
                           <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">
                                 {lessonModal.lesson?.content_type === 'article' ? 'Isi Materi (Format Markdown)' : 'Deskripsi & Ringkasan'}
                              </label>
                              <span className="text-[9px] text-slate-600 italic bg-white/5 px-2 py-0.5 rounded-full">Supports Markdown</span>
                           </div>

                           {/* Toolbar */}
                           <div className="flex flex-wrap items-center gap-1 p-2 bg-white/[0.03] border border-white/5 rounded-t-2xl border-b-0">
                              {[
                                 { icon: Heading1, tag: '# ', label: 'Heading 1' },
                                 { icon: Heading2, tag: '## ', label: 'Heading 2' },
                                 { icon: Bold, tag: '**text**', label: 'Bold' },
                                 { icon: Italic, tag: '*text*', label: 'Italic' },
                                 { icon: List, tag: '- ', label: 'Bullet List' },
                                 { icon: ListOrdered, tag: '1. ', label: 'Ordered List' },
                                 { icon: Link2, tag: '[text](url)', label: 'Link' },
                                 { icon: Code, tag: '```\ncode\n```', label: 'Code' },
                              ].map((btn, idx) => (
                                 <button
                                    key={idx}
                                    type="button"
                                    title={btn.label}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                    onClick={() => {
                                       const textarea = document.getElementById('lesson-desc') as HTMLTextAreaElement;
                                       if (!textarea) return;
                                       const start = textarea.selectionStart;
                                       const end = textarea.selectionEnd;
                                       const val = lessonModal.lesson?.description || "";
                                       const newVal = val.substring(0, start) + btn.tag + val.substring(end);
                                       setLessonModal({ ...lessonModal, lesson: { ...lessonModal.lesson, description: newVal } });
                                       setTimeout(() => {
                                          textarea.focus();
                                          textarea.setSelectionRange(start + btn.tag.length, start + btn.tag.length);
                                       }, 10);
                                    }}
                                 >
                                    <btn.icon size={14} />
                                 </button>
                              ))}

                              {/* AI Generate Button */}
                              <div className="h-6 w-px bg-white/10 mx-1"></div>
                              <button
                                 type="button"
                                 disabled={isGeneratingAI}
                                 onClick={handleGenerateAI}
                                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isGeneratingAI
                                       ? 'bg-purple-500/20 text-purple-400 animate-pulse'
                                       : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white shadow-lg shadow-indigo-500/10'
                                    }`}
                              >
                                 {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                 {isGeneratingAI ? "Generating..." : "AI Generate"}
                              </button>
                           </div>
                           <textarea
                              id="lesson-desc"
                              className="input-premium w-full h-64 !bg-white/5 !rounded-t-none font-mono text-xs leading-relaxed custom-scrollbar"
                              value={lessonModal.lesson?.description || ""}
                              onChange={e => setLessonModal({ ...lessonModal, lesson: { ...lessonModal.lesson, description: e.target.value } })}
                              placeholder={lessonModal.lesson?.content_type === 'article' ? "# Judul Artikel\n\nTulis konten materi Anda di sini..." : "Berikan informasi singkat mengenai materi ini."}
                           />
                           <div className="flex items-center gap-4 px-2 mt-2">
                              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                                 <Info size={10} /> Tip: Gunakan toolbar untuk format **Bold**, # Bab, dan ## Sub-bab.
                              </div>
                           </div>
                        </div>

                        {/* Tugas Praktik Section (NEW) */}
                        <div className="pt-6 border-t border-white/5 space-y-4">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Tugas Praktik (Opsional)</label>
                              <button
                                 type="button"
                                 onClick={() => {
                                    const currentAss = lessonModal.lesson?.lessonAssignment;
                                    setLessonModal({
                                       ...lessonModal,
                                       lesson: {
                                          ...lessonModal.lesson,
                                          lessonAssignment: currentAss ? null : {
                                             title: lessonModal.lesson?.title ? `Tugas: ${lessonModal.lesson.title}` : "",
                                             instructions: "",
                                             is_required: true,
                                             assessment_type: 'assignment'
                                          }
                                       }
                                    });
                                 }}
                                 className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${lessonModal.lesson?.lessonAssignment
                                       ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                       : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                                    }`}
                              >
                                 {lessonModal.lesson?.lessonAssignment ? "Hapus Tugas" : "+ Aktifkan Tugas"}
                              </button>
                           </div>

                           {lessonModal.lesson?.lessonAssignment && (
                              <div className="space-y-4 p-6 rounded-3xl bg-cyan-500/[0.03] border border-cyan-500/20 animate-in slide-in-from-top-4 duration-300">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-cyan-500/50 tracking-widest px-1">Judul Tugas</label>
                                    <input
                                       className="input-premium w-full !bg-white/5 !border-cyan-500/10 focus:!border-cyan-500/30"
                                       value={lessonModal.lesson.lessonAssignment.title || ""}
                                       onChange={e => setLessonModal({
                                          ...lessonModal,
                                          lesson: {
                                             ...lessonModal.lesson,
                                             lessonAssignment: { ...lessonModal.lesson.lessonAssignment, title: e.target.value }
                                          }
                                       })}
                                       placeholder="Judul tugas praktik..."
                                    />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-cyan-500/50 tracking-widest px-1">Instruksi Pengerjaan</label>
                                    <textarea
                                       className="input-premium w-full h-32 !bg-white/5 !border-cyan-500/10 focus:!border-cyan-500/30"
                                       value={lessonModal.lesson.lessonAssignment.instructions || ""}
                                       onChange={e => setLessonModal({
                                          ...lessonModal,
                                          lesson: {
                                             ...lessonModal.lesson,
                                             lessonAssignment: { ...lessonModal.lesson.lessonAssignment, instructions: e.target.value }
                                          }
                                       })}
                                       placeholder="Apa yang harus dikerjakan siswa? Gunakan Markdown jika perlu."
                                    />
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                       <input
                                          type="checkbox"
                                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                                          checked={lessonModal.lesson.lessonAssignment.is_required !== false}
                                          onChange={e => setLessonModal({
                                             ...lessonModal,
                                             lesson: {
                                                ...lessonModal.lesson,
                                                lessonAssignment: { ...lessonModal.lesson.lessonAssignment, is_required: e.target.checked }
                                             }
                                          })}
                                       />
                                       <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Wajib Selesai Sebelum Lanjut</span>
                                    </label>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Free Preview Toggle */}
                        <label className="flex items-center gap-3 w-max p-4 rounded-2xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                           <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                              checked={lessonModal.lesson?.is_free_preview || false}
                              onChange={e => setLessonModal({ ...lessonModal, lesson: { ...lessonModal.lesson, is_free_preview: e.target.checked } })}
                           />
                           <div>
                              <span className="text-sm font-bold text-white block">Akses Pratinjau Gratis</span>
                              <span className="text-[10px] text-slate-500">Siswa dapat melihat materi ini tanpa mendaftar.</span>
                           </div>
                        </label>
                     </div>
                     {/* Modal Footer */}
                     <div className="p-6 md:p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                        <button type="button" onClick={() => setLessonModal({ ...lessonModal, isOpen: false })} className="btn-secondary !rounded-2xl px-6">Batal</button>
                        <button
                           type="button"
                           disabled={lessonModal.isSaving}
                           onClick={() => handleSaveLesson(lessonModal.lesson)}
                           className="btn-primary !rounded-2xl px-8 flex items-center gap-2 group"
                        >
                           {lessonModal.isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                           Simpan Materi
                        </button>
                     </div>
                  </div>
               </div>
            </Portal>
         )}

         {/* Assessment Modal (Overhauled) */}
         {assessmentModal.isOpen && (
            <Portal>
               <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
                  <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0F172A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                     {/* Modal Header */}
                     <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex-1">
                           <h3 className="text-xl md:text-2xl font-bold text-white capitalize">
                              {assessmentModal.data?.id ? 'Edit' : 'Tambah'} {assessmentModal.type.replace('_', ' ')}
                           </h3>
                           <p className="text-slate-500 text-xs mt-1">Konfigurasi parameter asesmen kursus Anda.</p>
                        </div>

                        <div className="flex items-center gap-3">
                           <button
                              type="button"
                              disabled={isGeneratingAI}
                              onClick={() => handleGenerateAIAssessment(assessmentModal.type as any)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isGeneratingAI
                                    ? 'bg-purple-500/20 text-purple-400 animate-pulse'
                                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 shadow-lg'
                                 }`}
                           >
                              {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                              {isGeneratingAI ? "Generating..." : "AI Generate"}
                           </button>

                           <div className="w-px h-8 bg-white/5 mx-1" />

                           <button type="button" onClick={() => setAssessmentModal({ ...assessmentModal, isOpen: false })} className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                              <X size={20} />
                           </button>
                        </div>
                     </div>

                     {/* Modal Tabs */}
                     <div className="flex px-8 border-b border-white/5 bg-white/[0.01]">
                        {[
                           { id: 'config', label: 'Konfigurasi Dasar', icon: Settings },
                           { id: 'content', label: assessmentModal.type === 'quiz' ? 'Parameter Nilai' : 'Instruksi & Kriteria', icon: List },
                        ].map(tab => (
                           <button
                              key={tab.id}
                              type="button"
                              onClick={() => setModalTab(tab.id as any)}
                              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${modalTab === tab.id ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-500 hover:text-white'
                                 }`}
                           >
                              <tab.icon size={14} /> {tab.label}
                           </button>
                        ))}
                     </div>

                     {/* Modal Body */}
                     <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                        {modalTab === 'config' ? (
                           <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                              <div className="space-y-4">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Judul Asesmen</label>
                                    <input className="input-premium w-full !bg-white/5" defaultValue={assessmentModal.data?.title} onChange={e => assessmentModal.data = { ...assessmentModal.data, title: e.target.value }} placeholder="Contoh: Kuis Fondasi UI/UX" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Deskripsi Singkat</label>
                                    <textarea className="input-premium w-full h-24 !bg-white/5" defaultValue={assessmentModal.data?.description} onChange={e => assessmentModal.data = { ...assessmentModal.data, description: e.target.value }} placeholder="Berikan informasi singkat mengenai apa yang akan diuji." />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 text-slate-500">Tipe</label>
                                       <div className="input-premium w-full !bg-white/10 text-slate-400 flex items-center gap-2 capitalize">
                                          <Brain size={14} /> {assessmentModal.type.replace('_', ' ')}
                                       </div>
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 text-slate-500">Materi Terkait</label>
                                       <select
                                          className="input-premium w-full !bg-white/5 text-sm"
                                          defaultValue={assessmentModal.data?.lesson_id || ""}
                                          onChange={e => assessmentModal.data = { ...assessmentModal.data, lesson_id: e.target.value || null }}
                                       >
                                          <option value="">-- Akhir Pembelajaran --</option>
                                          {formData.lessons.map(l => (
                                             <option key={l.id} value={l.id}>{l.title}</option>
                                          ))}
                                       </select>
                                    </div>
                                 </div>
                                 <div className="space-y-1.5 pt-2">
                                    <label className="flex items-center gap-3 w-full p-4 rounded-2xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                                       <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${assessmentModal.data?.is_required !== false ? 'bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/20' : 'border-white/20 group-hover:border-white/40'}`}>
                                          <input type="checkbox" className="hidden" defaultChecked={assessmentModal.data?.is_required !== false} onChange={e => assessmentModal.data = { ...assessmentModal.data, is_required: e.target.checked }} />
                                          {assessmentModal.data?.is_required !== false && <Check size={12} className="text-white" strokeWidth={4} />}
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-sm font-bold text-white">Wajib Dikerjakan</span>
                                          <span className="text-[10px] text-slate-500 font-medium">Siswa harus menyelesaikan ini untuk lulus kursus.</span>
                                       </div>
                                    </label>
                                 </div>

                              </div>
                           </div>
                        ) : (
                           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              {assessmentModal.type === 'quiz' ? (
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 flex items-center gap-2"><Target size={12} /> Passing Score (%)</label>
                                       <input type="number" className="input-premium w-full !bg-white/5" defaultValue={assessmentModal.data?.passing_score || 70} onChange={e => assessmentModal.data = { ...assessmentModal.data, passing_score: Number(e.target.value) }} />
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 flex items-center gap-2"><Timer size={12} /> Waktu (Menit)</label>
                                       <input type="number" className="input-premium w-full !bg-white/5" defaultValue={assessmentModal.data?.time_limit_minutes || 15} onChange={e => assessmentModal.data = { ...assessmentModal.data, time_limit_minutes: Number(e.target.value) }} />
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Batas Percobaan</label>
                                       <input type="number" className="input-premium w-full !bg-white/5" defaultValue={assessmentModal.data?.max_attempts || 0} onChange={e => assessmentModal.data = { ...assessmentModal.data, max_attempts: Number(e.target.value) }} />
                                    </div>
                                 </div>
                              ) : (
                                 <div className="space-y-6">
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Instruksi Pengerjaan</label>
                                       <textarea className="input-premium w-full h-32 !bg-white/5" defaultValue={assessmentModal.data?.instructions} onChange={e => assessmentModal.data = { ...assessmentModal.data, instructions: e.target.value }} placeholder="Sebutkan langkah-langkah yang harus dilakukan siswa." />
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Kriteria Penilaian</label>
                                       <textarea className="input-premium w-full h-32 !bg-white/5 font-mono text-xs" defaultValue={assessmentModal.data?.evaluation_criteria} onChange={e => assessmentModal.data = { ...assessmentModal.data, evaluation_criteria: e.target.value }} placeholder="- Kebersihan Kode: 30%&#10;- fungsionalitas: 70%" />
                                    </div>
                                    {assessmentModal.type === 'final_project' && (
                                       <div className="space-y-1.5">
                                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Estimasi Pengerjaan (Jam)</label>
                                          <input type="number" className="input-premium w-full !bg-white/5" defaultValue={assessmentModal.data?.estimated_hours || 0} onChange={e => assessmentModal.data = { ...assessmentModal.data, estimated_hours: Number(e.target.value) }} />
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>

                     {/* Modal Footer */}
                     <div className="p-6 md:p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                        <button type="button" onClick={() => setAssessmentModal({ ...assessmentModal, isOpen: false })} className="btn-secondary !rounded-2xl px-6">Batal</button>
                        <button
                           type="button"
                           disabled={assessmentModal.isSaving}
                           onClick={() => handleSaveAssessment({ ...assessmentModal.data, assessment_type: assessmentModal.type })}
                           className="btn-primary !rounded-2xl px-8 flex items-center gap-2"
                        >
                           {assessmentModal.isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                           Simpan Perubahan
                        </button>
                     </div>
                  </div>
               </div>
            </Portal>
         )}

         {/* Question Modal (Overhauled) */}
         {questionModal.isOpen && (
            <Portal>
               <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
                  <div className="relative w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                     <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                           <Brain size={24} className="text-purple-400" /> Detail Pertanyaan
                        </h3>
                        <button type="button" onClick={() => setQuestionModal({ ...questionModal, isOpen: false })} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 font-bold">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Teks Pertanyaan</label>
                           <textarea className="input-premium w-full h-24 !bg-white/5" defaultValue={questionModal.data?.question_text} onChange={e => questionModal.data = { ...questionModal.data, question_text: e.target.value }} placeholder="Tuliskan pertanyaan Anda di sini..." />
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center justify-between px-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Opsi Jawaban</label>
                              <span className="text-[10px] text-slate-500 italic">Pilih card untuk menandai jawaban benar</span>
                           </div>
                           <div className="grid grid-cols-1 gap-3">
                              {[0, 1, 2, 3].map(i => (
                                 <div 
                                    key={i} 
                                    onClick={() => setQuestionModal(prev => ({ 
                                       ...prev, 
                                       data: { ...prev.data, correct_answer_index: i } 
                                    }))}
                                    className={`group/opt flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                       Number(questionModal.data?.correct_answer_index) === i 
                                          ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                          : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                                    }`}
                                 >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                       Number(questionModal.data?.correct_answer_index) === i 
                                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                                          : 'border-white/10 text-transparent group-hover/opt:border-white/30'
                                    }`}>
                                       <Check size={12} strokeWidth={4} />
                                    </div>
                                    
                                    <input
                                       className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-slate-600 font-medium"
                                       placeholder={`Tuliskan opsi jawaban ${i + 1}...`}
                                       defaultValue={questionModal.data?.options?.[i]}
                                       onClick={(e) => e.stopPropagation()}
                                       onChange={e => {
                                          const opts = [...(questionModal.data?.options || ['', '', '', ''])];
                                          opts[i] = e.target.value;
                                          // Note: Directly modifying questionModal.data here instead of setQuestionModal for responsiveness if handled elsewhere, 
                                          // but for consistency with others:
                                          setQuestionModal(prev => ({
                                             ...prev,
                                             data: { ...prev.data, options: opts }
                                          }));
                                       }}
                                    />
                                    
                                    {Number(questionModal.data?.correct_answer_index) === i && (
                                       <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Benar</span>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 flex items-center gap-2">Penjelasan (Opsional)</label>
                              <textarea className="input-premium w-full h-20 !bg-white/5 text-xs" defaultValue={questionModal.data?.explanation} onChange={e => questionModal.data = { ...questionModal.data, explanation: e.target.value }} placeholder="Mengapa jawaban ini benar?" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 flex items-center gap-2">Petunjuk / Hint</label>
                              <textarea className="input-premium w-full h-20 !bg-white/5 text-xs" defaultValue={questionModal.data?.hint} onChange={e => questionModal.data = { ...questionModal.data, hint: e.target.value }} placeholder="Berikan petunjuk kecil jika siswa kesulitan." />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Bobot Poin</label>
                           <input type="number" className="input-premium w-1/3 !bg-white/5" defaultValue={questionModal.data?.points || 1} onChange={e => questionModal.data = { ...questionModal.data, points: Number(e.target.value) }} />
                        </div>
                     </div>

                     <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setQuestionModal({ ...questionModal, isOpen: false })} className="btn-secondary !rounded-2xl px-6 font-bold">Batal</button>
                        <button
                           type="button"
                           disabled={questionModal.isSaving}
                           onClick={() => handleSaveQuestion({ ...questionModal.data, assessment_id: questionModal.assessmentId })}
                           className="btn-primary !rounded-2xl px-8 flex items-center gap-2 font-bold"
                        >
                           {questionModal.isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                           Simpan Pertanyaan
                        </button>
                     </div>
                  </div>
               </div>
            </Portal>
         )}
      </form>
   );
}
