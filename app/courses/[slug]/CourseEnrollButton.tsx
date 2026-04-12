"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { Enrollment, enrollCourse, getActiveEnrollment, getUserEnrollments } from "@/lib/enrollment";
import { getCourseAssessments } from "@/lib/assessments";
import { ArrowRight, AlertCircle, CheckCircle, LogIn, Clock, CreditCard } from "lucide-react";
import Link from "next/link";
import PaymentModal from "@/app/components/PaymentModal";

interface Props {
  courseId: string | number;
  courseSlug: string;
  courseTitle: string;
  totalLessons: number;
  level: string;
  price: number;
  instructorId: string;
  instructorQrisUrl?: string;
}

export default function CourseEnrollButton({ 
  courseId, courseSlug, courseTitle, totalLessons, level, price, instructorId, instructorQrisUrl 
}: Props) {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeEnr, setActiveEnr] = useState<Enrollment | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const data = await getUserEnrollments(user.id);
      setEnrollments(data);
      setLoading(false);
    };
    fetchEnrollments();
  }, [user]);

  const currentEnr = enrollments.find(e => e.courseSlug === courseSlug);
  const anyActive = enrollments.find(e => e.status === "active");

  const isFree = price === 0;
  // Instructor info is now passed via props from the dynamic course data

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <Link href="/login" className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2">
          <LogIn size={18} /> Masuk untuk Mendaftar
        </Link>
        <Link href="/register" className="btn-secondary w-full !py-3 text-sm text-center block">
          Belum punya akun? Daftar
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="btn-secondary w-full !py-3.5 animate-pulse">Menyiapkan...</div>;
  }

  if (currentEnr?.status === "active") {
    return (
      <Link href="/dashboard/my-courses" className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2">
        Lanjutkan Belajar <ArrowRight size={18} />
      </Link>
    );
  }

  if (currentEnr?.status === "waiting_verification") {
    return (
      <div className="card !bg-cyan-500/10 border-cyan-500/20 p-4 text-center">
        <Clock size={24} className="text-cyan-400 mx-auto mb-2" />
        <p className="text-white text-sm font-bold mb-1">Menunggu Verifikasi</p>
        <p className="text-slate-400 text-[10px]">Bukti pembayaran Anda sedang dicek oleh Admin.</p>
      </div>
    );
  }

  if (currentEnr?.status === "rejected" || currentEnr?.status === "pending") {
    return (
      <>
        {currentEnr.status === "rejected" && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <span className="font-bold block mb-1">Pembayaran Ditolak:</span>
            {currentEnr.rejectionReason}
          </div>
        )}
        <button
          onClick={() => setShowPaymentModal(true)}
          className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2"
        >
          <CreditCard size={18} /> {currentEnr.status === "rejected" ? "Upload Ulang Bukti" : "Bayar & Daftar"}
        </button>
        {showPaymentModal && (
          <PaymentModal 
            enrollment={currentEnr}
            courseTitle={courseTitle}
            qrisUrl={instructorQrisUrl || ""}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              setShowPaymentModal(false);
              setMessage({ type: "success", text: "Bukti berhasil dikirim! Menunggu verifikasi admin." });
            }}
          />
        )}
      </>
    );
  }

  const handleEnroll = async () => {
    if (!user) return;
    const assessments = await getCourseAssessments(courseSlug);
    const totalAssessmentItems = assessments ? assessments.quizzes.length + assessments.assignments.length + (assessments.finalProject ? 1 : 0) : 0;
    
    const result = await enrollCourse(user.id, courseSlug, courseTitle, totalLessons, level, totalAssessmentItems, isFree);
    
    if (result.success) {
      if (isFree) {
        setMessage({ type: "success", text: "Berhasil mendaftar! Mengarahkan ke kursus..." });
        setTimeout(() => router.push("/dashboard/my-courses"), 1500);
      } else {
        setActiveEnr(result.enrollment!);
        setShowPaymentModal(true);
      }
    } else {
      setMessage({ type: "error", text: result.error || "Gagal mendaftar." });
    }
  };

  return (
    <div className="space-y-3">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
          message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}
      <button
        onClick={handleEnroll}
        disabled={!!anyActive}
        className={`w-full !py-3.5 text-base flex items-center justify-center gap-2 ${anyActive ? "btn-secondary opacity-50 cursor-not-allowed" : "btn-primary"}`}
      >
        {anyActive ? (
          <>Selesaikan Kursus Aktif Dulu</>
        ) : (
          <>{isFree ? "Daftar Gratis Sekarang" : "Beli Kursus Sekarang"}</>
        )}
      </button>

      {anyActive && (
        <p className="text-xs text-amber-400 text-center">
          Kursus aktif anda: {anyActive.courseTitle}
        </p>
      )}

      {showPaymentModal && activeEnr && (
        <PaymentModal 
          enrollment={activeEnr}
          courseTitle={courseTitle}
          qrisUrl={instructorQrisUrl || ""}
          onClose={() => {
            setShowPaymentModal(false);
            window.location.reload(); // Reload to show waiting status
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setMessage({ type: "success", text: "Bukti berhasil dikirim! Menunggu verifikasi admin." });
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
