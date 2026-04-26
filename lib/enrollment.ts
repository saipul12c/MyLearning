// ============================================
// MyLearning - Course Enrollment System (Supabase)
// ============================================

import { supabase } from "./supabase";
import { createNotification, notifyAdmins } from "./notifications";
import { incrementVoucherUsage, validateVoucher, Voucher } from "./vouchers";

export type EnrollmentStatus = "pending" | "waiting_verification" | "active" | "paid" | "completed" | "expired" | "rejected" | "failed" | "refunded";

export const REJECTION_REASONS = [
  "Bukti transfer tidak terbaca (kabur atau resolusi rendah).",
  "Jumlah nominal tidak sesuai dengan harga kursus.",
  "Nama pengirim tidak sesuai dengan data akun MyLearning.",
  "Bukti transfer terindikasi hasil editan atau palsu.",
  "Transaksi tidak ditemukan dalam mutasi rekening kami.",
  "Bukti transfer sudah pernah digunakan sebelumnya (duplikat).",
  "Tanggal transfer sudah kadaluarsa (lebih dari 48 jam).",
  "Gambar yang diunggah bukan bukti transfer QRIS/Bank yang sah.",
  "Metode pembayaran tidak sesuai dengan instruksi.",
  "Akun bank tujuan salah/bukan milik MyLearning.",
  "Struk terpotong (informasi Waktu/ID Transaksi tidak ada).",
  "Status transaksi di struk masih 'Pending' atau 'Gagal'.",
  "Transfer dilakukan menggunakan sistem yang sedang maintenance.",
  "Rekening pengirim terindikasi melakukan aktivitas mencurigakan.",
  "File yang diunggah bukan merupakan bukti pembayaran.",
];

export interface AssignmentSubmission {
  id: string; // assignment_id
  passed: boolean;
  score: number;
  submissionUrl?: string;
  submissionNotes?: string;
  adminFeedback?: string;
}

export interface QuizSubmission {
  quizId: number;
  score: number;
  answers: number[];
  passed: boolean;
  submittedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseSlug: string;
  courseTitle: string;
  enrolledAt: string;
  status: EnrollmentStatus;
  completedAt?: string;
  expiredAt?: string;
  completedLessons: string[]; // lesson IDs (Stored locally as array, mapped to lesson_progress table)
  completedQuizzes: QuizSubmission[];
  completedAssignments: number[]; // legacy compatibility
  assignmentSubmissions?: AssignmentSubmission[]; // Detailed submissions
  finalProjectCompleted: boolean;
  finalProjectUrl?: string;
  finalProjectNotes?: string;
  finalProjectFeedback?: string;
  progress: number; // 0-100
  totalLessons: number;
  courseId: string;
  instructorId?: string;
  totalItems: number; // lessons + quizzes + assignments + 1 (final project)
  expiryDays: number;
  thumbnailUrl?: string;
  level?: string;
  certificateValidUntil?: string;
  certificateId?: string;
  certificateUrl?: string;
  paymentProofUrl?: string;
  rejectionReason?: string;
  paymentRetryCount: number;
  paymentAmount: number;
  voucherId?: string;
  discountAmount?: number;
  // Admin-only fields (joined from user_profiles)
  userName?: string;
  userAvatarUrl?: string;
  // Revision fields
  certificateRevisionStatus?: "pending" | "approved" | "rejected";
  certificateRevisionCount?: number;
  certificateRevisionNotes?: string;
  certificateIssuedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  createdAt: string;
  adminNotes?: string;
}

// ---------- Helpers ----------

export function getExpiryDays(level: string): number {
  switch (level) {
    case "Starter": return 30;
    case "Accelerator": return 45;
    case "Mastery": return 60;
    default: return 30;
  }
}

export function getLevelLabel(level: string): string {
  switch (level) {
    case "Starter": return "🌱 Starter";
    case "Accelerator": return "⚡ Accelerator";
    case "Mastery": return "🚀 Mastery";
    default: return level;
  }
}

export function getLevelBg(level: string): string {
  switch (level) {
    case "Starter": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Accelerator": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Mastery": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

// ---------- Enrollment Functions ----------

export async function enrollCourse(
  userId: string,
  courseSlug: string,
  courseTitle: string,
  totalLessons: number,
  level: string,
  totalAssessmentItems: number = 0,
  isFree?: boolean,
  paymentAmount: number = 0,
  voucherId?: string,
  discountAmount: number = 0
): Promise<{ success: boolean; enrollment?: Enrollment; error?: string }> {
  try {
    // 1. Check for existing enrollment
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_slug", courseSlug)
      .in("payment_status", ["paid", "waiting_verification", "pending"])
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Anda sudah memiliki pendaftaran aktif atau menunggu untuk kursus ini." };
    }

    // 2. Check for any active enrollment (Limit 1 active)
    const { data: active } = await supabase
      .from("enrollments")
      .select("id, course_title, course_slug")
      .eq("user_id", userId)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (active) {
      return { 
        success: false, 
        error: `Anda masih memiliki kursus aktif "${active.course_title || active.course_slug}". Selesaikan dulu.` 
      };
    }

    // 3. Fetch course data and validate price/vouchers server-side
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id, price, instructor_id")
      .eq("slug", courseSlug)
      .maybeSingle();

    if (courseError || !courseData) {
      return { success: false, error: "Kursus tidak ditemukan di sistem." };
    }

    let finalPaymentAmount = courseData.price;
    let finalDiscountAmount = 0;
    let validatedVoucher: Voucher | undefined;

    // Server-side voucher validation
    if (voucherId) {
      // We need the voucher code first
      const { data: vData } = await supabase.from("vouchers").select("code").eq("id", voucherId).single();
      if (vData) {
        const valRes = await validateVoucher(
          vData.code, 
          courseData.id, 
          courseData.instructor_id, 
          courseData.price, 
          userId
        );
        
        if (!valRes.success) {
          return { success: false, error: `Voucher tidak valid: ${valRes.error}` };
        }
        
        finalDiscountAmount = valRes.discountAmount || 0;
        finalPaymentAmount = courseData.price - finalDiscountAmount;
        validatedVoucher = valRes.voucher;
      }
    }

    // Ensure price is never negative
    if (finalPaymentAmount < 0) finalPaymentAmount = 0;
    
    // Check if free (either base price is 0 or discount makes it 0)
    const isActuallyFree = finalPaymentAmount === 0;

    // 4. Create New Enrollment
    const totalItems = totalLessons + totalAssessmentItems;
    const expiryDays = getExpiryDays(level);

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        user_id: userId,
        course_id: courseData.id,
        course_slug: courseSlug,
        course_title: courseTitle,
        payment_status: isActuallyFree ? "paid" : "pending",
        progress_percentage: 0,
        expiry_days: expiryDays,
        total_lessons: totalLessons,
        total_items: totalItems,
        final_project_completed: false,
        payment_amount: finalPaymentAmount,
        voucher_id: validatedVoucher?.id,
        discount_amount: finalDiscountAmount,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger Notification for Student
    await createNotification({
        userId,
        title: "Pendaftaran Berhasil! 📝",
        message: isActuallyFree 
            ? `Anda telah terdaftar di kursus "${courseTitle}". Silakan mulai belajar!`
            : `Pendaftaran kursus "${courseTitle}" diterima. Silakan selesaikan pembayaran sebesar Rp ${finalPaymentAmount.toLocaleString()} untuk mulai belajar.`,
        type: 'info',
        linkUrl: isActuallyFree ? `/dashboard/my-courses` : `/dashboard/enrollments`
    });

    if (validatedVoucher) {
       await createNotification({
          userId,
          title: "Voucher Berhasil! 🎫",
          message: `Potongan harga sebesar Rp ${finalDiscountAmount.toLocaleString()} telah diterapkan menggunakan voucher "${validatedVoucher.code}".`,
          type: 'success'
       });
    }

    // Increment voucher usage immediately if free
    if (isActuallyFree && validatedVoucher && data) {
      await incrementVoucherUsage(validatedVoucher.id, userId, data.id);
    }

    return { success: true, enrollment: mapDbToEnrollment(data) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadPaymentProof(
  enrollmentId: string,
  proofUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("enrollments")
      .update({
        payment_status: "waiting_verification",
        payment_proof_url: proofUrl,
        rejection_reason: null,
      })
      .eq("id", enrollmentId);

    if (error) throw error;

    // Trigger Notification for Admin
    // 1. Fetch course title to make notification meaningful
    const { data: enr } = await supabase.from("enrollments").select("course_title").eq("id", enrollmentId).single();
    const courseTitle = enr?.course_title || "Kursus";

    await notifyAdmins(
        "Bukti Pembayaran Baru",
        `Siswa mengunggah bukti pembayaran untuk kursus "${courseTitle}". Segera verifikasi agar siswa bisa mulai belajar.`,
        `/dashboard/admin/enrollments?id=${enrollmentId}`
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEnrollmentPrice(
  enrollmentId: string,
  paymentAmount: number,
  voucherId: string | null,
  discountAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("enrollments")
      .update({
        payment_amount: paymentAmount,
        voucher_id: voucherId,
        discount_amount: discountAmount
      })
      .eq("id", enrollmentId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Removes applied voucher from enrollment and restores original price
 */
export async function removeVoucherFromEnrollment(
  enrollmentId: string,
  originalPrice: number
): Promise<{ success: boolean; error?: string }> {
  return updateEnrollmentPrice(enrollmentId, originalPrice, null, 0);
}

export async function verifyPayment(
  enrollmentId: string,
  approve: boolean,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify Admin Role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "instructor") throw new Error("Forbidden: Unauthorized access");

    const { data: enr, error: fetchError } = await supabase
      .from("enrollments")
      .select("id, payment_retry_count, voucher_id, course_id, payment_amount, discount_amount, user_id, course_title")
      .eq("id", enrollmentId)
      .single();

    if (fetchError) throw fetchError;

    const updates: any = {};
    if (approve) {
      updates.payment_status = "paid";
      updates.enrolled_at = new Date().toISOString();
    } else {
      const newRetryCount = (enr.payment_retry_count || 0) + 1;
      updates.payment_retry_count = newRetryCount;
      updates.rejection_reason = rejectionReason;
      updates.payment_status = newRetryCount >= 3 ? "failed" : "rejected";
    }

    const { error: updateError } = await supabase
      .from("enrollments")
      .update(updates)
      .eq("id", enrollmentId);

    if (updateError) throw updateError;

    // Increment voucher usage if applicable
    if (approve && enr.voucher_id) {
        // RE-VALIDATE: Ensure voucher hasn't expired or hit limit while waiting
        const { data: vData } = await supabase.from("vouchers").select("code").eq("id", enr.voucher_id).single();
        if (vData) {
          const { data: course } = await supabase.from("courses").select("instructor_id").eq("id", enr.course_id).single();
          const val = await validateVoucher(vData.code, enr.course_id, course?.instructor_id, enr.payment_amount + enr.discount_amount, enr.user_id);
          
          if (!val.success) {
            // If validation fails now, we still consider payment approved but log the error
            console.warn(`Voucher ${vData.code} no longer valid during verification: ${val.error}`);
            // Optionally: notify admin or revert discount (though reverting is complex after payment)
          } else {
            const res = await incrementVoucherUsage(enr.voucher_id, enr.user_id, enrollmentId);
            if (!res.success) {
              console.error(`Failed to increment voucher usage: ${res.error}`);
            }
          }
        }
    }

    // Trigger Notification for Student
    await createNotification({
        userId: enr.user_id,
        title: approve ? "Pembayaran Terverifikasi!" : "Pembayaran Ditolak",
        message: approve 
            ? `Selamat! Pembayaran Anda untuk "${enr.course_title}" telah diverifikasi. Selamat belajar!`
            : `Maaf, pembayaran Anda untuk "${enr.course_title}" ditolak. Alasan: ${rejectionReason}`,
        type: approve ? 'success' : 'warning',
        linkUrl: approve ? `/dashboard/my-courses` : `/dashboard/enrollments`
    });

    // Notify Instructor if approved
    if (approve) {
      const { data: courseData } = await supabase.from("courses").select("instructor_id, title").eq("id", enr.course_id).single();
      if (courseData?.instructor_id) {
         await createNotification({
            userId: courseData.instructor_id,
            title: "Siswa Baru Terdaftar! 🎓",
            message: `Siswa baru telah resmi terdaftar di kursus "${courseData.title}".`,
            type: 'info',
            linkUrl: `/dashboard/admin/enrollments`
         });
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  try {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          level,
          instructor_id
        ),
        certificates (
          id,
          revision_status,
          revision_count,
          admin_notes,
          issued_at
        )
      `)
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    if (error) throw error;
    if (!enrollments || enrollments.length === 0) return [];

    const enrollmentIds = enrollments.map(e => e.id);

    // Batch fetch all progress in parallel
    const [lessonData, quizData, assignmentData] = await Promise.all([
      supabase.from("lesson_progress").select("enrollment_id, lesson_id").in("enrollment_id", enrollmentIds).eq("is_completed", true),
      supabase.from("quiz_progress").select("enrollment_id, quiz_id, score, answers, passed, submitted_at").in("enrollment_id", enrollmentIds),
      supabase.from("assignment_progress").select("enrollment_id, assignment_id, passed, score, submission_url, submission_notes, admin_feedback").in("enrollment_id", enrollmentIds)
    ]);

    const lessonProgressMap = (lessonData.data || []).reduce((acc: any, curr) => {
      if (!acc[curr.enrollment_id]) acc[curr.enrollment_id] = [];
      acc[curr.enrollment_id].push(curr.lesson_id);
      return acc;
    }, {});

    const quizProgressMap = (quizData.data || []).reduce((acc: any, curr) => {
      if (!acc[curr.enrollment_id]) acc[curr.enrollment_id] = [];
      acc[curr.enrollment_id].push({
        quizId: Number(curr.quiz_id),
        score: curr.score,
        answers: curr.answers,
        passed: curr.passed,
        submittedAt: curr.submitted_at
      });
      return acc;
    }, {});

    const assignmentProgressMap = (assignmentData.data || []).reduce((acc: any, curr) => {
      if (!acc[curr.enrollment_id]) {
        acc[curr.enrollment_id] = { ids: [], subs: [] };
      }
      acc[curr.enrollment_id].ids.push(Number(curr.assignment_id));
      acc[curr.enrollment_id].subs.push({
        id: curr.assignment_id,
        passed: curr.passed,
        score: curr.score || 0,
        submissionUrl: curr.submission_url,
        submissionNotes: curr.submission_notes,
        adminFeedback: curr.admin_feedback
      });
      return acc;
    }, {});

    return enrollments.map(enr => {
      const lessons = lessonProgressMap[enr.id] || [];
      const quizzes = quizProgressMap[enr.id] || [];
      const assignments = assignmentProgressMap[enr.id] || { ids: [], subs: [] };
      
      return mapDbToEnrollment(
        { 
          ...enr, 
          instructor_id: (enr as any).courses?.instructor_id,
          certificate_revision_status: (enr as any).certificates?.revision_status,
          certificate_revision_count: (enr as any).certificates?.revision_count,
          certificate_revision_notes: (enr as any).certificates?.admin_notes,
          certificate_issued_at: (enr as any).certificates?.issued_at,
          course_data: (enr as any).courses
        }, 
        lessons, 
        quizzes, 
        assignments.ids, 
        assignments.subs
      );
    });
  } catch (error: any) {
    console.error("Error fetching user enrollments:", JSON.stringify(error, null, 2));
    // Return empty but log detail; wrapping in a result object would require many UI changes, 
    // so we'll at least ensure we don't swallow critical errors without trace.
    return [];
  }
}

export async function getActiveEnrollment(userId: string): Promise<Enrollment | null> {
  const all = await getUserEnrollments(userId);
  return all.find(e => e.status === "active") || null;
}

export async function getAllEnrollmentsAdmin(
  page: number = 1, 
  pageSize: number = 20, 
  status: string = "all",
  instructorId?: string
): Promise<{ data: Enrollment[]; totalCount: number; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Unauthorized");
    const user = session.user;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "instructor") throw new Error("Forbidden");

    // 1. Build Query
    let query;
    const select = `
        *,
        voucher:vouchers(code),
        user:user_profiles (full_name, avatar_url),
        courses!inner(instructor_id)
      `;

    query = supabase
      .from("enrollments")
      .select(select, { count: 'exact' });

    // 2. Apply Instructor Filter
    if (instructorId) {
      query = query.eq("courses.instructor_id", instructorId);
    }

    // 2. Apply Filters
    if (status !== "all") {
      // Map UI status back to DB status if needed
      // "active" status in UI maps to "paid" in DB
      const dbStatus = status === "active" ? "paid" : status;
      query = query.eq("payment_status", dbStatus);
    }

    // 3. Apply Pagination & Sort
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order("enrolled_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return { 
      data: (data || []).map(enr => ({
        ...mapDbToEnrollment(enr),
        userName: enr.user?.full_name || "Siswa",
        userAvatarUrl: enr.user?.avatar_url
      })), 
      totalCount: count || 0 
    };
  } catch (error: any) {
    console.error("Admin Enrollment Fetch Error:", error);
    return { data: [], totalCount: 0, error: error.message };
  }
}

// ---------- Progress Functions ----------

export async function completeLesson(
  enrollmentId: string,
  userId: string,
  lessonId: number | string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 0. Security Check
    const { data: enrStatus } = await supabase.from("enrollments").select("payment_status").eq("id", enrollmentId).single();
    const status = enrStatus?.payment_status;
    if (status !== 'paid' && status !== 'active' && status !== 'completed') {
        throw new Error("Akses ditolak. Silakan selesaikan pembayaran terlebih dahulu.");
    }

    const { error: progressError } = await supabase
      .from("lesson_progress")
      .upsert({
        enrollment_id: enrollmentId,
        user_id: userId,
        lesson_id: String(lessonId),
        is_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'enrollment_id,lesson_id' });

    if (progressError) throw progressError;
    await updateEnrollmentProgress(enrollmentId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uncompleteLesson(
  enrollmentId: string,
  lessonId: number | string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("enrollment_id", enrollmentId)
      .eq("lesson_id", String(lessonId));

    if (error) throw error;
    await updateEnrollmentProgress(enrollmentId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitQuiz(
  enrollmentId: string,
  quizId: string | number,
  answers: number[],
  correctAnswers: number[],
  passingScore: number
): Promise<{ success: boolean; score: number; passed: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let correct = 0;
    answers.forEach((a, i) => { if (a === correctAnswers[i]) correct++; });
    const score = Math.round((correct / correctAnswers.length) * 100);
    const passed = score >= passingScore;

    // 0. Security Check
    const { data: enrStatus } = await supabase.from("enrollments").select("payment_status").eq("id", enrollmentId).single();
    const status = enrStatus?.payment_status;
    if (status !== 'paid' && status !== 'active' && status !== 'completed') {
        throw new Error("Akses ditolak. Silakan selesaikan pembayaran terlebih dahulu.");
    }

    const { error } = await supabase
      .from("quiz_progress")
      .upsert({
        enrollment_id: enrollmentId,
        user_id: user.id,
        quiz_id: String(quizId),
        score,
        passed,
        answers,
        submitted_at: new Date().toISOString()
      }, { onConflict: 'enrollment_id,quiz_id' });

    if (error) throw error;
    await updateEnrollmentProgress(enrollmentId);
    return { success: true, score, passed };
  } catch (error: any) {
    return { success: false, score: 0, passed: false, error: error.message };
  }
}

export async function submitAssignment(
  enrollmentId: string,
  assignmentId: string | number,
  userAnswers: string[],
  correctAnswers: string[]
): Promise<{ success: boolean; score: number; passed: boolean; results: boolean[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 0. Security Check: Only allow if paid or completed
    const { data: enrStatus } = await supabase.from("enrollments").select("payment_status").eq("id", enrollmentId).single();
    const status = enrStatus?.payment_status;
    if (status !== 'paid' && status !== 'active' && status !== 'completed') {
        throw new Error("Akses ditolak. Silakan selesaikan pembayaran terlebih dahulu.");
    }

    const results = userAnswers.map((a, i) => a.toLowerCase().trim() === correctAnswers[i].toLowerCase().trim());
    const correct = results.filter(Boolean).length;
    const score = Math.round((correct / correctAnswers.length) * 100);
    const passed = score >= 70;

    const { error } = await supabase
      .from("assignment_progress")
      .upsert({
        enrollment_id: enrollmentId,
        user_id: user.id,
        assignment_id: String(assignmentId),
        score,
        results,
        passed,
        submitted_at: new Date().toISOString()
      }, { onConflict: 'enrollment_id,assignment_id' });

    if (error) throw error;
    await updateEnrollmentProgress(enrollmentId);
    return { success: true, score, passed, results };
  } catch (error: any) {
    return { success: false, score: 0, passed: false, results: [], error: error.message };
  }
}

export async function submitFinalProject(
  enrollmentId: string, 
  projectUrl: string, 
  remarks: string = ""
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("enrollments")
      .update({ 
        final_project_completed: true,
        final_project_url: projectUrl,
        final_project_notes: remarks
      })
      .eq("id", enrollmentId);

    if (error) throw error;
    await updateEnrollmentProgress(enrollmentId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeFinalProject(enrollmentId: string): Promise<{ success: boolean; error?: string }> {
  // Legacy support for direct completion
  return submitFinalProject(enrollmentId, "Manual Completion", "No notes provided");
}

// Internal helper to update progress percentage
// NOTE: Progress percentage calculation is primarily handled by SQL Triggers in 02_logic.sql.
// This function fetches the updated value to handle side-effects like certificate generation.
async function updateEnrollmentProgress(enrollmentId: string) {
  // Fetch fresh data from Supabase. 
  // The progress_percentage column is automatically calculated by PostgreSQL triggers 
  // (trigger_update_progress_*) whenever lesson_progress, quiz_progress, or assignment_progress changes.
  // The certificate generation and status upgrade to 'completed' is also handled by 
  // the DB trigger 'trg_auto_generate_certificate' in 11_certificates_fixed.sql.
  
  const { data: enr, error: fetchError } = await supabase
    .from("enrollments")
    .select("*, user:user_profiles(full_name), course:courses(instructors(name, signature_id))")
    .eq("id", enrollmentId)
    .single();
  
  if (fetchError || !enr) return;
  
  const percentage = Number(enr.progress_percentage || 0);
  
  // Handle Side Effects: Notifications
  // We check if it's now 'completed' (which was set by the DB trigger)
  // and if we haven't sent the notification yet.
  if (percentage >= 100 && enr.payment_status === 'completed') {
    // Cleanup old certificates for this course/user (Max 3, Max 6 years)
    await cleanupExpiredCertificates(enr.user_id, enr.course_id);

    // Trigger Notification for Student
    await createNotification({
        userId: enr.user_id,
        title: "Kursus Selesai! 🎉",
        message: `Selamat! Anda telah menyelesaikan kursus "${enr.course_title}". Sertifikat Anda sudah tersedia.`,
        type: 'success',
        linkUrl: `/dashboard/my-courses`
    });
  }
}

/**
 * Resets an enrollment to 0% for retaking the course (if expired)
 */
export async function resetEnrollmentForRetake(enrollmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Clear lesson progress
    await supabase.from("lesson_progress").delete().eq("enrollment_id", enrollmentId);
    await supabase.from("quiz_progress").delete().eq("enrollment_id", enrollmentId);
    await supabase.from("assignment_progress").delete().eq("enrollment_id", enrollmentId);

    // 2. Reset enrollment status to 'paid' (ready to start again)
    const { error } = await supabase
      .from("enrollments")
      .update({
        progress_percentage: 0,
        completed_at: null,
        payment_status: "paid", // Move back from 'completed' to 'paid'
        final_project_completed: false,
        certificate_id: null, // Clear active certificate ID (old ones are in certificates table)
      })
      .eq("id", enrollmentId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cleanup policy: Max 3 expired certificates OR max 6 years old
 */
async function cleanupExpiredCertificates(userId: string, courseId: string) {
  try {
    const { data: certs, error } = await supabase
      .from("certificates")
      .select("id, issued_at")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .order("issued_at", { ascending: false });

    if (error || !certs) return;

    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

    const toDelete: string[] = [];

    certs.forEach((cert, index) => {
      const issuedDate = new Date(cert.issued_at);
      // Policy: Keep top 3 newest, delete others
      if (index >= 3) {
        toDelete.push(cert.id);
      } 
      // Policy: Delete if older than 6 years (even if it's less than 3)
      else if (issuedDate < sixYearsAgo) {
        toDelete.push(cert.id);
      }
    });

    if (toDelete.length > 0) {
      await supabase.from("certificates").delete().in("id", toDelete);
    }
  } catch (err) {
    console.error("Error during certificate cleanup:", err);
  }
}

// ---------- Messaging ----------

export async function saveContactMessage(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, subject, message, status: "unread" });
    
    return { success: !error };
  } catch {
    return { success: false };
  }
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const { data } = await supabase.from("contact_messages").select("id, name, email, subject, message, status, created_at, admin_notes").order("created_at", { ascending: false });
  return (data || []).map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    status: m.status,
    createdAt: m.created_at,
    adminNotes: m.admin_notes
  }));
}

/**
 * Returns statistics for contact messages (Total and Unread).
 * Optimized count queries.
 */
export async function getContactMessageStats(): Promise<{ total: number; unread: number }> {
  try {
    const [totalRes, unreadRes] = await Promise.all([
      supabase.from("contact_messages").select("id", { count: 'exact', head: true }),
      supabase.from("contact_messages").select("id", { count: 'exact', head: true }).eq("status", "unread")
    ]);

    return {
      total: totalRes.count || 0,
      unread: unreadRes.count || 0
    };
  } catch (err) {
    return { total: 0, unread: 0 };
  }
}

export async function updateMessageStatus(
  messageId: string,
  status: ContactMessage["status"],
  adminNotes?: string
): Promise<{ success: boolean }> {
  try {
    const updates: any = { status };
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    
    const { error } = await supabase
      .from("contact_messages")
      .update(updates)
      .eq("id", messageId);
      
    return { success: !error };
  } catch {
    return { success: false };
  }
}

// ---------- Mapping ----------

function mapDbToEnrollment(
  db: any, 
  completedLessonIds: any[] = [], 
  completedQuizzes: QuizSubmission[] = [],
  completedAssignmentIds: number[] = [],
  assignmentSubmissions: AssignmentSubmission[] = []
): Enrollment {
  return {
    id: db.id,
    userId: db.user_id,
    courseId: db.course_id,
    instructorId: db.instructor_id,
    courseSlug: db.course_data?.slug || db.course_slug,
    courseTitle: db.course_data?.title || db.course_title || db.course_slug,
    thumbnailUrl: db.course_data?.thumbnail_url,
    level: db.course_data?.level,
    enrolledAt: db.enrolled_at,
    status: mapDbStatusToEnrollmentStatus(db.payment_status),
    completedAt: db.completed_at,
    expiredAt: db.expired_at,
    completedLessons: completedLessonIds,
    completedQuizzes: completedQuizzes,
    completedAssignments: completedAssignmentIds,
    assignmentSubmissions: assignmentSubmissions,
    finalProjectCompleted: db.final_project_completed || false,
    finalProjectUrl: db.final_project_url,
    finalProjectNotes: db.final_project_notes,
    finalProjectFeedback: db.final_project_feedback,
    progress: Math.round(db.progress_percentage) || 0,
    totalLessons: db.total_lessons || 0,
    totalItems: db.total_items || 0,
    expiryDays: db.expiry_days || 30,
    certificateId: db.certificate_id,
    certificateUrl: db.certificate_url,
    certificateValidUntil: db.certificate_valid_until,
    paymentProofUrl: db.payment_proof_url,
    rejectionReason: db.rejection_reason,
    paymentRetryCount: db.payment_retry_count || 0,
    paymentAmount: db.payment_amount || 0,
    voucherId: db.voucher_id,
    discountAmount: db.discount_amount || 0,
    userName: db.user?.full_name,
    userAvatarUrl: db.user?.avatar_url,
    certificateRevisionStatus: db.certificate_revision_status,
    certificateRevisionCount: db.certificate_revision_count,
    certificateRevisionNotes: db.certificate_revision_notes || db.admin_notes, // Fallback to either name
    certificateIssuedAt: db.certificate_issued_at,
  };
}

function mapDbStatusToEnrollmentStatus(dbStatus: string): EnrollmentStatus {
  switch (dbStatus) {
    case 'pending': return 'pending';
    case 'paid': return 'active'; // Maps DB 'paid' to UI 'active'
    case 'waiting_verification': return 'waiting_verification';
    case 'rejected': return 'rejected';
    case 'failed': return 'failed';
    case 'completed': return 'completed';
    case 'expired': return 'expired';
    case 'refunded': return 'refunded';
    default: return 'pending';
  }
}

export async function forceExpireEnrollment(enrollmentId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from("enrollments")
      .update({ payment_status: "expired", expired_at: new Date().toISOString() })
      .eq("id", enrollmentId);
    return { success: !error };
  } catch { return { success: false }; }
}

export async function completeCourseAdmin(enrollmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: enr, error: fetchError } = await supabase
        .from("enrollments")
        .select("*, user:user_profiles(full_name), course:courses(instructors(name))")
        .eq("id", enrollmentId)
        .single();
    if (fetchError || !enr) throw new Error("Pendaftaran tidak ditemukan.");

    const year = new Date().getFullYear();
    const shortId = enrollmentId.split('-')[0].toUpperCase();
    const randomHex = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    const certId = `ML-${year}-${shortId}-${randomHex()}`;
    const completedAt = new Date().toISOString();
    
    // validUntil = 2 years
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 2);

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ 
        payment_status: "completed", 
        completed_at: completedAt,
        progress_percentage: 100,
        certificate_id: certId,
        certificate_valid_until: validUntil.toISOString()
      })
      .eq("id", enrollmentId);
      
    if (updateError) throw updateError;

    // Write to certificates table (Allow History)
    const userData: any = enr.user;
    const courseData: any = enr.course;
    await supabase.from("certificates").insert({
        enrollment_id: enrollmentId,
        user_id: enr.user_id,
        course_id: enr.course_id,
        certificate_number: certId,
        course_title: enr.course_title || enr.course_slug,
        issued_at: completedAt,
        instructor_name: courseData?.instructors?.name || "Instruktur MyLearning",
        user_name: userData?.full_name || "Siswa MyLearning"
    });

    // Cleanup policy: Max 3 expired, Max 6 years
    await cleanupExpiredCertificates(enr.user_id, enr.course_id);

    return { success: true };
  } catch (error: any) { 
    return { success: false, error: error.message }; 
  }
}

// ---------- Deadline Helpers ----------

export function getEnrollmentDeadline(enrollment: Enrollment): Date {
  const enrolledDate = new Date(enrollment.enrolledAt);
  return new Date(enrolledDate.getTime() + enrollment.expiryDays * 24 * 60 * 60 * 1000);
}

export function getRemainingDays(enrollment: Enrollment): number {
  if (enrollment.status !== "active" && enrollment.status !== "paid") return 0;
  const deadline = getEnrollmentDeadline(enrollment);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isCertificateExpired(enrollment: Enrollment): boolean {
  if (!enrollment.certificateValidUntil) return false;
  return new Date() > new Date(enrollment.certificateValidUntil);
}

// ---------- One-Time Migration ----------

export async function migrateLocalStorageToSupabase(userId: string) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("mylearning_enrollments");
  if (!raw) return;

  try {
    const localEnrollments: any[] = JSON.parse(raw);
    for (const local of localEnrollments) {
      if (local.userId === userId) {
        // Attempt to insert if not exists (upsert based on course_id/slug + user_id)
        // Mencari course_id dari DB
        const { data: courseData } = await supabase
          .from("courses")
          .select("id")
          .eq("slug", local.courseSlug)
          .maybeSingle();

        if (courseData) {
          const { data: enrollment, error: enrollError } = await supabase.from("enrollments").upsert({
            user_id: userId,
            course_id: courseData.id,
            course_slug: local.courseSlug,
            course_title: local.courseTitle,
            payment_status: local.status === 'active' ? 'paid' : (local.status === 'pending_payment' ? 'pending' : local.status),
            progress_percentage: local.progress,
            enrolled_at: local.enrolledAt,
            completed_at: local.completedAt,
            payment_proof_url: local.paymentProofUrl,
            rejection_reason: local.rejectionReason,
            payment_retry_count: local.paymentRetryCount,
            certificate_id: local.certificateId,
            total_lessons: local.totalLessons,
            total_items: local.totalItems,
            expiry_days: local.expiryDays,
            final_project_completed: local.finalProjectCompleted,
          }, { onConflict: 'user_id,course_slug' }).select("id").single();

          if (enrollment && local.completedQuizzes?.length > 0) {
            // Also migrate quizzes to the new table
            const quizPayloads = local.completedQuizzes.map((q: any) => ({
              enrollment_id: enrollment.id,
              user_id: userId,
              quiz_id: String(q.quizId),
              score: q.score,
              passed: q.passed,
              answers: q.answers,
              submitted_at: q.submittedAt || new Date().toISOString()
            }));
            await supabase.from("quiz_progress").upsert(quizPayloads, { onConflict: 'enrollment_id,quiz_id' });
          }
        }
      }
    }
    // Clear after migration to avoid duplicates
    localStorage.removeItem("mylearning_enrollments");
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed", err);
  }
}
