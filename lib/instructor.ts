import { cache } from "react";
import { supabase } from "./supabase";
import { type Course } from "./data";
import { getCourses } from "./courses";

/**
 * Service to handle instructor-specific dashboard logic
 * Cached to prevent double database calls when fetching courses and stats in the same cycle.
 */
export const getInstructorProfile = cache(async (userId: string) => {
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      // No rows found - this is normal if the user is an admin but not (yet) an instructor
      return null;
    }
    console.error("Error fetching instructor profile:", error);
    return null;
  }
  return data;
});

export async function ensureInstructorProfile(userId: string, fullName: string) {
  const profile = await getInstructorProfile(userId);
  if (profile) return profile;

  // Generate a safe slug
  const baseSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;

  const { data, error } = await supabase
    .from("instructors")
    .insert({
      user_id: userId,
      name: fullName,
      slug: slug,
      bio: "Administrator & Instructor"
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating instructor profile:", error);
    return null;
  }

  return data;
}

export async function getInstructorCourses(userId: string): Promise<Course[]> {
  // 1. Get the Instructor ID first
  const profile = await getInstructorProfile(userId);
  if (!profile) return [];

  // 2. Wrap getCourses logic but filter by instructor_id
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id, title, slug, short_description, description, thumbnail_url, 
      price, discount_price, level, language, duration_hours, 
      total_lessons, rating, total_reviews, total_students,
      is_published, is_featured, created_at, updated_at,
      learning_points, requirements,
      categories(id, name, slug),
      instructors(name, slug, avatar_url, website_url, linkedin_url)
    `)
    .eq("instructor_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching instructor courses:", error);
    return [];
  }

  // We reuse a mapping logic if possible or manually map here
  return data.map((db: any) => ({
    id: db.id,
    title: db.title,
    slug: db.slug,
    description: db.short_description,
    detailedDescription: db.description,
    thumbnail: db.thumbnail_url,
    price: db.price,
    discountPrice: db.discount_price,
    category: db.categories?.name || "",
    categoryId: db.categories?.id || "",
    categorySlug: db.categories?.slug || "",
    instructor: db.instructors?.name || "",
    instructorId: db.instructors?.slug || "",
    instructorAvatar: db.instructors?.avatar_url || "",
    instructorWebsite: db.instructors?.website_url || "",
    instructorLinkedin: db.instructors?.linkedin_url || "",
    level: db.level,
    language: db.language,
    durationHours: Number(db.duration_hours),
    totalLessons: db.total_lessons,
    rating: Number(db.rating),
    totalReviews: db.total_reviews,
    totalStudents: db.total_students,
    isPublished: db.is_published,
    isFeatured: db.is_featured,
    updatedAt: db.updated_at,
    learningPoints: db.learning_points || [],
    requirements: db.requirements || [],
    lessons: []
  }));
}

export async function getInstructorStats(userId: string) {
  const profile = await getInstructorProfile(userId);
  if (!profile) return { totalStudents: 0, totalCourses: 0, rating: 0 };

  return {
    totalStudents: profile.total_students || 0,
    totalCourses: profile.total_courses || 0,
    rating: Number(profile.rating) || 0
  };
}
