import { SafeUser, getAllRegisteredUsers } from "./auth";
import { type Course } from "./data";
import { getCourses } from "./courses";
import { supabase } from "./supabase";

export interface PublicProfile extends SafeUser {
  coursesTaught?: Course[];
  enrolledCount?: number;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const users = await getAllRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  
  if (!user) return null;

  const profile: PublicProfile = { ...user };

  // If instructor, fetch their courses dynamically from Supabase
  if (user.role === "instructor" || user.role === "admin") {
    const allCourses = await getCourses();
    profile.coursesTaught = allCourses.filter((c) => c.instructor === user.fullName);
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
