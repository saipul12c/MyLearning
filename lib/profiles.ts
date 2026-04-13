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

  // 1. Try to find if the identifier is an instructor slug
  const { data: instructor } = await supabase
    .from("instructors")
    .select("user_id")
    .eq("slug", idOrSlug)
    .single();

  if (instructor) {
    userId = instructor.user_id;
  }

  // 2. Fetch the base user profile (now accessible to everyone)
  const user = await getPublicUser(userId);
  
  if (!user) return null;

  const profile: PublicProfile = { ...user };

  // 3. If instructor/admin, fetch their courses dynamically
  if (user.role === "instructor" || user.role === "admin") {
    // Also fetch professional data from instructors table if not already in profile
    const { data: instructorData } = await supabase
      .from("instructors")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (instructorData) {
      profile.specialization = instructorData.expertise;
      profile.bio = instructorData.bio;
      // You could add more fields here if needed
    }

    profile.coursesTaught = await getInstructorCourses(user.fullName);
    profile.enrolledCount = profile.coursesTaught.reduce((acc, c) => acc + c.totalStudents, 0);
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
