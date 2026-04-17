// ============================================
// MyLearning - Course Reviews System (Supabase)
// ============================================

import { supabase } from "./supabase";

export interface Review {
  id: string;
  courseSlug: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  userRole?: string;
}

export async function getAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id,
      courses ( slug ),
      user_profiles ( full_name, role )
    `)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    courseSlug: r.courses?.slug || "",
    userId: r.user_id,
    userName: r.user_profiles?.full_name || "Unknown User",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    userRole: (r.user_profiles as any)?.role,
  }));
}

export interface Testimonial extends Review {
  userBio: string;
  courseTitle: string;
}

/**
 * Fetches the latest approved reviews formatted as testimonials for the landing page.
 */
export async function getLatestTestimonials(limit: number = 15): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id,
      courses ( title, slug ),
      user_profiles ( full_name, bio, role )
    `)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("Error fetching testimonials:", error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    courseSlug: r.courses?.slug || "",
    courseTitle: r.courses?.title || "",
    userId: r.user_id,
    userName: (r.user_profiles as any)?.full_name || "Siswa MyLearning",
    userBio: (r.user_profiles as any)?.bio || "Siswa Berprestasi",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    userRole: (r.user_profiles as any)?.role,
  }));
}

export async function getCourseReviews(courseSlug: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id,
      courses!inner ( slug ),
      user_profiles ( full_name, role )
    `)
    .eq("is_approved", true)
    .eq("courses.slug", courseSlug)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    courseSlug: r.courses?.slug || "",
    userId: r.user_id,
    userName: r.user_profiles?.full_name || "Unknown User",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    userRole: (r.user_profiles as any)?.role,
  }));
}

export async function getCourseStats(courseSlug: string) {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("rating, total_reviews")
      .eq("slug", courseSlug)
      .single();
    
    if (error || !data) return { average: 0, count: 0 };
    
    return { 
      average: Number(data.rating || 0), 
      count: Number(data.total_reviews || 0) 
    };
  } catch (err) {
    console.error("Error fetching course stats:", err);
    return { average: 0, count: 0 };
  }
}

export async function addReview({ courseSlug, userId, userName, rating, comment }: Omit<Review, "id" | "createdAt">): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch course_id first
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();

    if (courseError || !courseData) {
      return { success: false, error: "Course tidak ditemukan di database." };
    }

    // 2. Insert to reviews table
    const { error } = await supabase
      .from("reviews")
      .insert({
        course_id: courseData.id,
        user_id: userId,
        rating,
        comment,
      });

    if (error) throw error;

    // Trigger Notification for Instructor
    try {
        const { data: instData } = await supabase
            .from("courses")
            .select("title, instructor:instructors(user_id)")
            .eq("id", courseData.id)
            .single();
        
        const instructorUserId = (instData as any)?.instructor?.user_id;
        if (instructorUserId) {
            const { createNotification } = await import("./notifications");
            await createNotification({
                userId: instructorUserId,
                title: "Ulasan Kursus Baru ⭐",
                message: `${userName} memberikan rating ${rating}/5 pada kursus "${instData?.title}".`,
                type: 'success',
                linkUrl: `/dashboard/admin/courses`
            });
        }
    } catch (ignore) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add review" };
  }
}

export function initReviewsSeed() {
  // Migration from local storage could be added here, 
  // but relies on Supabase seed scripts for initial data.
}
