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
