"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, MessageSquare, AlertCircle, CheckCircle2, User, Send } from "lucide-react";
import { Review, getCourseReviews, addReview } from "@/lib/reviews";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "@/app/components/AuthContext";
import { getUserEnrollments } from "@/lib/enrollment";

interface ReviewSectionProps {
  courseSlug: string;
  courseTitle: string;
}

export default function ReviewSection({ courseSlug, courseTitle }: ReviewSectionProps) {
  const { user, isLoggedIn } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load reviews
    getCourseReviews(courseSlug).then(setReviews);

    // Check if user has completed this course
    if (user) {
      getUserEnrollments(user.id).then((enrollments) => {
        const isCompleted = enrollments.some(
          (e) => e.courseSlug === courseSlug && e.status === "completed"
        );
        setCanReview(isCompleted);
      });
    }
  }, [courseSlug, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = await addReview({
      courseSlug,
      userId: user.id,
      userName: user.fullName,
      rating,
      comment,
    });

    if (result.success) {
      setSubmitted(true);
      const updatedReviews = await getCourseReviews(courseSlug);
      setReviews(updatedReviews);
      setShowForm(false);
    }
  };

  return (
    <div className="mt-16 border-t border-white/5 pt-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Ulasan Siswa</h2>
          <p className="text-slate-400 text-sm">Apa kata mereka yang telah menyelesaikan kursus ini?</p>
        </div>

        {isLoggedIn && canReview && !submitted && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"
          >
            <Star size={16} /> {showForm ? "Batal Menilai" : "Berikan Penilaian"}
          </button>
        )}
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <div className="card p-6 mb-10 border border-purple-500/20 bg-purple-500/5 animate-in slide-in-from-top duration-300">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            Terima kasih telah menyelesaikan kursus! Bagaimana pengalaman Anda?
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-bold">Rating Anda</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 transition-all ${rating >= star ? "text-yellow-400" : "text-slate-600 hover:text-slate-400"}`}
                  >
                    <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-bold">Komentar / Masukan</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tuliskan pengalaman belajar Anda di sini..."
                className="input-field min-h-[100px] resize-none"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <Send size={18} /> Kirim Ulasan
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <div className="card p-4 mb-10 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 size={20} /> Ulasan Anda telah berhasil dikirim! Terima kasih atas partisipasinya.
        </div>
      )}

      {!isLoggedIn && (
        <div className="card p-4 mb-10 border border-white/5 bg-white/5 text-slate-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} /> Silakan login untuk melihat status penilaian Anda.
        </div>
      )}

      {isLoggedIn && !canReview && !submitted && (
        <div className="card p-4 mb-10 border border-blue-500/20 bg-blue-500/5 text-blue-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} /> Hanya siswa yang telah **menyelesaikan kursus (100% progress)** yang dapat memberikan ulasan.
        </div>
      )}

      {/* Reviews List */}
      <div className="grid md:grid-cols-2 gap-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="card p-6 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <Link href={`/profile/${review.userId}`} className="text-white font-bold text-sm hover:text-purple-400 transition-colors flex items-center gap-1">
                      {review.userName}
                      {(review.userRole === 'admin' || review.userRole === 'instructor') && <VerifiedBadge size={12} />}
                    </Link>
                    <p className="text-[10px] text-slate-500">{new Date(review.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-400 text-sm italic leading-relaxed">
                &quot;{review.comment}&quot;
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center card border-dashed border-white/10">
            <MessageSquare size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm italic">Belum ada ulasan untuk kursus ini. Jadilah yang pertama memberikan ulasan!</p>
          </div>
        )}
      </div>
    </div>
  );
}
