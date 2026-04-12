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
      user_profiles ( full_name )
    `)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    courseSlug: r.courses?.slug || "",
    userId: r.user_id,
    userName: r.user_profiles?.full_name || "Unknown User",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
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
      user_profiles ( full_name )
    `)
    .eq("is_approved", true)
    .eq("courses.slug", courseSlug)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    courseSlug: r.courses?.slug || "",
    userId: r.user_id,
    userName: r.user_profiles?.full_name || "Unknown User",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
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
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add review" };
  }
}

export function initReviewsSeed() {
  // Migration from local storage could be added here, 
  // but relies on Supabase seed scripts for initial data.
}
