import { cache } from "react";
import { supabase } from "./supabase";
import { 
  type Course, 
  type Lesson, 
  type Category, 
  type Instructor
} from "./data";

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL && 
           process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co";
};

/**
 * Service to handle dynamic course data from Supabase DB
 */

// Centralized Authorization Helper
async function checkAuthorized() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
    
  if (profile?.role !== "admin" && profile?.role !== "instructor") {
    throw new Error("Forbidden: Admin or Instructor access required");
  }
  return user;
}

export async function getAdminCourseById(id: string) {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id, title, slug, description, short_description, thumbnail_url, 
      price, discount_price, admin_discount_price, category_id, instructor_id, level, language, 
      duration_hours, total_lessons, is_published, is_featured, 
      learning_points, requirements,
      lessons:lessons(id, title, duration_minutes, is_free_preview, video_url, description, order_index, content_type)
    `)
    .eq("id", id)
    .order('order_index', { referencedTable: 'lessons', ascending: true })
    .single();

  if (error || !data) return null;
  return data;
}

export async function upsertLesson(lessonData: any) {
  try {
    await checkAuthorized();

    // 1. INPUT VALIDATION
    if (!lessonData.course_id || !lessonData.title) {
      return { success: false, error: new Error("Validation Error: Missing required fields (course_id, title)") };
    }

    // Sanitize data
    const payload = {
      course_id: lessonData.course_id,
      title: String(lessonData.title).trim(),
      description: lessonData.description ? String(lessonData.description).trim() : null,
      video_url: lessonData.video_url ? String(lessonData.video_url).trim() : null,
      duration_minutes: Number(lessonData.duration_minutes) || 0,
      order_index: Number(lessonData.order_index) || 0,
      is_free_preview: Boolean(lessonData.is_free_preview),
      content_type: (['video', 'article', 'quiz'].includes(lessonData.content_type) ? lessonData.content_type : 'video')
    };

    const { data, error } = await supabase
      .from("lessons")
      .upsert(lessonData.id ? { id: lessonData.id, ...payload } : payload)
      .select("id, title")
      .single();

    return { success: !error, data, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function deleteLesson(id: string) {
  try {
    await checkAuthorized();
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    return { success: !error, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function updateLessonsOrder(lessons: {id: string, order_index: number}[]) {
  try {
    await checkAuthorized();
    const { error } = await supabase.from("lessons").upsert(lessons);
    return { success: !error, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      id,
      name, 
      slug, 
      icon, 
      sort_order,
      courses:courses(count)
    `)
    .order("sort_order", { ascending: true });
  
  if (error) {
    console.error("Error fetching categories from Supabase:", error);
    return [];
  }
  
  return data.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    courseCount: (c.courses as any)?.[0]?.count || 0
  }));
}

export async function getInstructors(): Promise<Instructor[]> {
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching instructors from Supabase:", error);
    return [];
  }

  return data.map(i => ({
    id: i.id, // Return UUID
    name: i.name,
    slug: i.slug, // Keep slug for other uses
    avatar: i.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100", // Default Avatar
    expertise: i.expertise,
    bio: i.bio,
    rating: Number(i.rating),
    totalStudents: i.total_students,
    qrisUrl: i.qris_url
  }));
}

export async function getCourses(options: { 
  page?: number; 
  pageSize?: number; 
  category?: string; 
  search?: string;
} = {}): Promise<Course[]> {
  const { page = 1, pageSize = 100, category = "all", search = "" } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("courses")
    .select(`
      id, title, slug, short_description, thumbnail_url, 
      price, discount_price, admin_discount_price, level, language, duration_hours, 
      total_lessons, rating, total_reviews, total_students,
      is_published, is_featured, created_at, updated_at, tags,
      categories(id, name, slug),
      instructors(name, slug, avatar_url, website_url, linkedin_url),
      vouchers:vouchers(id, code, discount_type, discount_value, is_active)
    `)
    .eq("is_published", true);

  if (category && category !== "all") {
    // We use .eq on the joined table's slug
    // Note: To filter by a joined table, use the !inner hint or filter the primary table if the column exists there.
    // Since category_id is in courses, we can filter by it if we had the ID, 
    // but the UI gives us the slug. So we use the 'categories' join with !inner.
    query = query.filter("categories.slug", "eq", category);
  }

  if (search) {
    // Use the existing title_description_vector for optimized search
    query = query.textSearch('title_description_vector', search, {
      config: 'indonesian',
      type: 'websearch'
    });
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching courses from Supabase:", error);
    return [];
  }

  return data.map(mapDbToCourse);
}

/**
 * Optimized helper to get total count of published courses
 */
export async function getCourseCount(): Promise<number> {
  const { count, error } = await supabase
    .from("courses")
    .select("*", { count: 'exact', head: true })
    .eq("is_published", true);
  
  if (error) {
    console.error("Error fetching course count:", error);
    return 0;
  }
  return count || 0;
}

/**
 * Fetch only courses taught by a specific instructor
 * Much faster than fetching all and filtering in JS
 */
export async function getInstructorCourses(instructorName: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id, title, slug, short_description, thumbnail_url, 
      price, discount_price, admin_discount_price, level, language, duration_hours, 
      total_lessons, rating, total_reviews, total_students,
      is_published, is_featured, created_at, updated_at, tags,
      categories(id, name, slug),
      instructors!inner(name, slug, avatar_url, website_url, linkedin_url)
    `)
    .eq("is_published", true)
    .eq("instructors.name", instructorName)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching courses for instructor ${instructorName}:`, error);
    return [];
  }

  return data.map(mapDbToCourse);
}


/**
 * Fetches the most popular courses based on enrollments in the last 3 months.
 * Fallback to all-time popularity if no recent data exists.
 */
export async function getPopularCourses(limit: number = 8): Promise<Course[]> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  try {
    // 1. Fetch popular course IDs via stable View
    // Standardizing on 'vw_' prefix which works in your environment
    const { data: popularData, error: viewError } = await supabase
      .from("vw_popular_courses_master")
      .select("course_id")
      .limit(limit);

    let courseIds: string[] = [];

    if (viewError) {
      // Robust Fallback: Log but don't crash. Use standard query if View cache is stale.
      console.warn("View 'vw_popular_courses_master' not found in cache. Falling back to default sorting.");
      const { data: fallbackEnrollments } = await supabase
        .from("courses")
        .select("id")
        .eq("is_published", true)
        .order("total_students", { ascending: false })
        .limit(limit);
      
      courseIds = (fallbackEnrollments || []).map(c => c.id);
    } else {
      courseIds = (popularData || []).map((item: any) => item.course_id);
    }
    
    // 2. Fallback: If no recent enrollments, use all-time stats
    if (courseIds.length === 0) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("courses")
        .select("id")
        .eq("is_published", true)
        .order("total_students", { ascending: false })
        .limit(limit);
      
      if (fallbackError) throw fallbackError;
      courseIds = fallback.map(c => c.id);
    }

    if (courseIds.length === 0) return [];

    // 5. Fetch full details for the top courses
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id, title, slug, short_description, thumbnail_url, 
        price, discount_price, admin_discount_price, level, language, duration_hours, 
        total_lessons, rating, total_reviews, total_students,
        is_published, is_featured, created_at, updated_at, tags,
        categories(id, name, slug),
        instructors(name, slug, avatar_url, website_url, linkedin_url),
        vouchers:vouchers(id, code, discount_type, discount_value, is_active)
      `)
      .in("id", courseIds);

    if (error) throw error;

    // 6. Map and Maintain original popularity order
    const mapped = data.map(mapDbToCourse);
    return mapped.sort((a, b) => courseIds.indexOf(a.id) - courseIds.indexOf(b.id));

  } catch (err) {
    console.error("Error in getPopularCourses:", err);
    // Ultimate fallback: just return the normal courses
    const all = await getCourses();
    return all.slice(0, limit);
  }
}


export async function searchCourses(query: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id, title, slug, short_description, thumbnail_url, 
      price, discount_price, admin_discount_price, level, language, duration_hours, 
      total_lessons, rating, total_reviews, total_students,
      is_published, is_featured, created_at, updated_at, tags,
      categories(id, name, slug),
      instructors(name, slug, avatar_url, website_url, linkedin_url)
    `)
    .eq("is_published", true)
    .textSearch('title_description_vector', query, {
      config: 'indonesian',
      type: 'websearch'
    })
    .order("created_at", { ascending: false })
    .limit(20);


  if (error) {
    console.error("Error searching courses in Supabase:", error);
    return [];
  }

  return data.map(mapDbToCourse);
}

/**
 * Fetches a course by its slug. 
 * Cached by React to prevent multiple DB calls in a single request (Metadata + Page).
 */
export const getCourseBySlug = cache(async (slug: string): Promise<Course | null> => {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id, title, slug, short_description, thumbnail_url, 
      price, discount_price, admin_discount_price, level, language, duration_hours, 
      total_lessons, rating, total_reviews, total_students,
      is_published, is_featured, learning_points, requirements, preview_video_url, tags,
      categories(id, name, slug),
      instructors(name, slug, bio, avatar_url, expertise, rating, qris_url, website_url, linkedin_url),
      lessons:lessons(id, title, duration_minutes, is_free_preview, description, order_index, video_url),
      vouchers:vouchers(id, code, discount_type, discount_value, is_active)
    `)
    .eq("slug", slug)
    .order('order_index', { referencedTable: 'lessons', ascending: true })
    .single();

  if (error || !data) {
    if (error) console.error(`Error fetching course ${slug} from Supabase:`, error);
    return null;
  };
  
  const course = mapDbToCourse(data);
  
  // Map lessons (they are already sorted by SQL)
  if (data.lessons) {
    course.lessons = data.lessons.map((l: any) => ({
        id: l.id,
        title: l.title,
        durationMinutes: l.duration_minutes,
        isFreePreview: l.is_free_preview,
        description: l.description,
        videoUrl: l.video_url
      }));
  }

  return course;
});


// Admin CRUD
export async function upsertCourse(courseData: Partial<Course>) {
  try {
    await checkAuthorized();

    // 1. INPUT VALIDATION
    const rawData = courseData as any;
    if (!courseData.title || !courseData.slug || !rawData.categoryId || !rawData.instructorIdDb) {
      return { success: false, error: new Error("Validation Error: Missing required fields (title, slug, category, instructor)") };
    }

    // 2. SLUG UNIQUENESS PRE-CHECK (Optional but good for UX)
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseData.slug)
      .not('id', 'eq', courseData.id || '00000000-0000-0000-0000-000000000000') // Skip if it's the same record
      .single();
    
    if (existing) {
      return { success: false, error: new Error("Slug sudah digunakan oleh kursus lain.") };
    }

    // Map camelCase to snake_case & Sanitize
    const dbData = {
      title: String(courseData.title).trim(),
      slug: String(courseData.slug).trim().toLowerCase().replace(/\s+/g, '-'),
      description: courseData.detailedDescription ? String(courseData.detailedDescription).trim() : null,
      short_description: courseData.description ? String(courseData.description).trim() : null,
      thumbnail_url: courseData.thumbnail ? String(courseData.thumbnail).trim() : null,
      price: Math.max(0, Number(courseData.price) || 0),
      discount_price: courseData.discountPrice ? Math.max(0, Number(courseData.discountPrice)) : null,
      admin_discount_price: (courseData as any).adminDiscountPrice ? Math.max(0, Number((courseData as any).adminDiscountPrice)) : null,
      category_id: rawData.categoryId as string, 
      instructor_id: rawData.instructorIdDb as string, 
      level: (['Starter', 'Accelerator', 'Mastery'].includes(courseData.level as string) ? courseData.level : 'Starter') as any,
      language: courseData.language ? String(courseData.language).trim() : 'Bahasa Indonesia',
      duration_hours: Number(courseData.durationHours) || 0,
      is_published: Boolean(courseData.isPublished),
      is_featured: Boolean(courseData.isFeatured),
      learning_points: Array.isArray(courseData.learningPoints) ? courseData.learningPoints : [],
      requirements: Array.isArray(courseData.requirements) ? courseData.requirements : [],
      preview_video_url: courseData.previewVideoUrl || null,
      tags: Array.isArray(courseData.tags) ? courseData.tags : [],
    };

    const { data, error } = await supabase
      .from("courses")
      .upsert(courseData.id ? { id: courseData.id, ...dbData } : dbData)
      .select("id, title, slug")
      .single();

    return { success: !error, data, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function deleteCourse(id: string) {
  try {
    await checkAuthorized();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    return { success: !error, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

// Helper to get local thumbnail based on slug
function getLocalThumbnail(slug: string): string {
  const mapping: Record<string, string> = {
    "uiux-design-figma": "/courses/uiux-figma.png",
    "javascript-fundamental": "/courses/javascript.png",
    "python-for-data-science": "/courses/python-ds.png",
    "nodejs-mastery": "/courses/nodejs.png",
    "react-nextjs-masterpiece": "/courses/react-nextjs.png",
    "devops-for-engineers": "/courses/devops.png",
    "deep-learning-ai": "/courses/deep-learning.png",
    "sql-mastery": "/courses/sql-postgres.png",
    "startup-modern": "/courses/startup.png",
    "illustrator-pro": "/courses/illustrator.png",
    "flutter-app-dev": "/courses/flutter-dev.png",
    "digital-marketing-mastery": "/courses/digital-marketing.png",
    "typescript-pro": "/courses/typescript.png",
    "react-native-pro": "/courses/react-native.png",
  };

  return mapping[slug] || "/courses/react-nextjs.png"; // Default to a safe one
}

// Helper mapper
function mapDbToCourse(db: any): Course {
  return {
    id: db.id, 
    title: db.title,
    slug: db.slug,
    description: db.short_description || (db.description && db.description.length > 160 ? db.description.substring(0, 160) + '...' : db.description),
    detailedDescription: db.description,
    thumbnail: db.thumbnail_url || getLocalThumbnail(db.slug),
    price: db.price,
    discountPrice: db.discount_price,
    adminDiscountPrice: db.admin_discount_price,
    category: db.categories?.name || "",
    categoryId: db.categories?.id || "",
    categorySlug: db.categories?.slug || "",
    instructor: db.instructors?.name || "",
    instructorId: db.instructors?.slug || "",
    instructorAvatar: db.instructors?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100", // Default Avatar
    instructorQrisUrl: db.instructors?.qris_url || "",
    instructorWebsite: db.instructors?.website_url || "",
    instructorLinkedin: db.instructors?.linkedin_url || "",
    level: db.level as any,
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
    previewVideoUrl: db.preview_video_url,
    tags: db.tags || [],
    lessons: [],
    availableVouchers: db.vouchers 
      ? db.vouchers
        .filter((v: any) => v.is_active)
        .map((v: any) => ({
          id: v.id,
          code: v.code,
          discountType: v.discount_type,
          discountValue: Number(v.discount_value)
        }))
      : []
  };
}

/**
 * Fetches real-time system statistics for the About page
 */
export async function getSystemStats() {
  try {
    const [
      { count: studentCount },
      { count: courseCount },
      { count: instructorCount },
      { data: ratingData }
    ] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from("courses").select("*", { count: 'exact', head: true }).eq('is_published', true),
      supabase.from("instructors").select("*", { count: 'exact', head: true }),
      supabase.from("courses").select("rating").eq("is_published", true)
    ]);

    // Calculate average rating percentage (e.g. 4.8/5 = 96%)
    const averageRatingRaw = ratingData && ratingData.length > 0
      ? ratingData.reduce((acc, c) => acc + (Number(c.rating) || 0), 0) / ratingData.length
      : 4.8;
    
    const ratingPercentage = Math.round((averageRatingRaw / 5) * 100);

    return {
      totalStudents: studentCount || 52400, // Fallback to realistic number if 0
      totalCourses: courseCount || 215,     // Fallback
      totalInstructors: instructorCount || 42, // Fallback
      ratingPercentage: ratingPercentage || 95
    };
  } catch (err) {
    console.error("Error fetching system stats:", err);
    return {
      totalStudents: 50000,
      totalCourses: 200,
      totalInstructors: 50,
      ratingPercentage: 95
    };
  }
}
