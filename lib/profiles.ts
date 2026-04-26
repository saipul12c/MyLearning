import { SafeUser, getPublicUser } from "./auth";
import { type Course } from "./data";
import { getCourses, getInstructorCourses } from "./courses";
import { supabase } from "./supabase";

export interface PublicProfile extends SafeUser {
  coursesTaught?: Course[];
  enrolledCount?: number;
}
export async function getPublicProfile(idOrSlug: string): Promise<PublicProfile | null> {
  let userId = idOrSlug;
  
  // 1. Coba cari di tabel instructors berdasarkan SLUG atau ID Instruktur (Primary Key)
  // Ini menangani kasus di mana link menggunakan slug (alex) atau ID internal instruktur.
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
  
  let query = supabase.from("instructors").select("user_id");
  
  if (isUUID) {
    query = query.or(`id.eq.${idOrSlug},user_id.eq.${idOrSlug}`);
  } else {
    query = query.ilike("slug", idOrSlug);
  }

  const { data: instructor, error: resolveError } = await query.maybeSingle();

  if (resolveError) {
    console.error(`Error resolving identifier ${idOrSlug}:`, resolveError);
  }

  if (instructor?.user_id) {
    userId = instructor.user_id;
  } else if (!isUUID) {
    // Jika bukan UUID dan tidak ditemukan di tabel instructors, berarti beneran tidak ada
    console.warn(`Identifier ${idOrSlug} bukan UUID dan tidak ditemukan di tabel instructors.`);
    return null;
  }

  // 2. Fetch the base user profile from user_profiles
  const user = await getPublicUser(userId);
  
  if (!user) {
    console.error(`Public user profile not found for userId: ${userId}`);
    return null;
  }

  const profile: PublicProfile = { ...user };

  // 3. If instructor/admin, fetch their professional data from instructors table
  if (user.role === "instructor" || user.role === "admin") {
    const { data: instructorData, error: instError } = await supabase
      .from("instructors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (instError) {
      console.error(`Error fetching professional data for ${userId}:`, instError);
    }

    if (instructorData) {
      // Prioritize data from instructors table for professional display
      profile.specialization = instructorData.expertise;
      profile.bio = instructorData.bio || profile.bio;
      profile.website = instructorData.website_url;
      profile.linkedin = instructorData.linkedin_url;
      profile.avatarUrl = instructorData.avatar_url || profile.avatarUrl;
    }

    // Fetch courses taught by this instructor
    profile.coursesTaught = await getInstructorCourses(user.fullName);
    profile.enrolledCount = profile.coursesTaught?.reduce((acc, c) => acc + (c.totalStudents || 0), 0) || 0;
  }

  return profile;
}

export async function getInstructorByFullName(fullName: string): Promise<PublicProfile | null> {
  // Query instructors table directly instead of relying on user_profiles
  const { data: instructor } = await supabase
    .from("instructors")
    .select("user_id")
    .eq("name", fullName)
    .single();
  
  if (!instructor) return null;
  return await getPublicProfile(instructor.user_id);
}

export async function getAllInstructors() {
  const { data, error } = await supabase
    .from("instructors")
    .select("*, user_profiles(full_name, avatar_url, bio, role)")
    .eq("is_verified", true)
    .order("total_students", { ascending: false });

  if (error) {
    console.error("Error fetching all instructors:", error);
    return [];
  }
  return data || [];
}

export async function getInstructorReviews(instructorId: string) {
  // Mengambil ulasan (reviews) yang terkait dengan kursus dari instruktur ini
  // Kita harus melakukan inner join manual atau menggunakan postgrest syntax
  
  // 1. Get courses of instructor
  const { data: courses } = await supabase.from('courses').select('id, title').eq('instructor_id', instructorId);
  if (!courses || courses.length === 0) return [];
  
  const courseIds = courses.map(c => c.id);
  
  // 2. Get reviews for these courses
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, user_profiles(full_name, avatar_url)')
    .in('course_id', courseIds)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Error fetching instructor reviews:", error);
    return [];
  }
  return data || [];
}

export async function getUserPublicHistory(userId: string) {
  const { data: enrollments, error: enrError } = await supabase
    .from('enrollments')
    .select('id, course_title, course_slug, progress_percentage, enrolled_at, completed_at')
    .eq('user_id', userId)
    .in('payment_status', ['paid', 'completed'])
    .order('enrolled_at', { ascending: false });
    
  if (enrError) console.error("Error fetching user history:", enrError);
  
  const { data: certificates, error: certError } = await supabase
    .from('certificates')
    .select('id, certificate_number, issued_at, course_title, instructor_name, certificate_url')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });
    
  if (certError) console.error("Error fetching user certificates:", certError);
  
  return {
    enrollments: enrollments || [],
    certificates: certificates || []
  };
}
