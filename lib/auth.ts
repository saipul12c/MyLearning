// ============================================
// MyLearning - Authentication System (Supabase)
// ============================================

import { supabase } from "./supabase";

export type UserRole = "admin" | "instructor" | "user";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  bio: string;
  role: UserRole;
  createdAt: string;
  // Professional Metadata (for Admins/Instructors)
  specialization?: string;
  experience?: string;
  website?: string;
  linkedin?: string;
  avatarUrl?: string;
}

export type SafeUser = User;

// ---------- Auth Functions ----------

export async function register(
  fullName: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
  try {
    // 1. Supabase Auth Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Terjadi kesalahan saat mendaftar.");

    // 2. Create User Profile in public.user_profiles
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        role: "user",
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // We don't throw here to avoid failing registration if profile creation fails
    }

    return { 
      success: true, 
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        fullName,
        phone: "",
        bio: "",
        role: "user",
        createdAt: authData.user.created_at,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Email atau password salah.");

    // Fetch Profile
    const user = await fetchUserProfile(authData.user.id, authData.user.email!, authData.user.created_at);

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  return await fetchUserProfile(session.user.id, session.user.email!, session.user.created_at);
}

async function fetchUserProfile(userId: string, email: string, createdAt: string): Promise<User> {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    return {
      id: userId,
      email,
      fullName: "",
      phone: "",
      bio: "",
      role: "user",
      createdAt,
    };
  }

  return {
    id: userId,
    email,
    fullName: profile.full_name,
    phone: profile.phone || "",
    bio: profile.bio || "",
    role: profile.role as UserRole,
    createdAt: profile.created_at || createdAt,
    avatarUrl: profile.avatar_url,
  };
}

export async function getPublicUser(userId: string): Promise<SafeUser | null> {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !profile) return null;

  return {
    id: userId,
    email: "user@hidden.com",
    fullName: profile.full_name,
    phone: "",
    bio: profile.bio || "",
    role: profile.role as UserRole,
    createdAt: profile.created_at,
    avatarUrl: profile.avatar_url,
  };
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<User, "fullName" | "phone" | "bio" | "avatarUrl">>
): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    const { data: { user: authUser } } = await supabase.auth.getUser();

    return { 
      success: true, 
      user: {
        id: userId,
        email: authUser?.email || "",
        fullName: data.full_name,
        phone: data.phone || "",
        bio: data.bio || "",
        role: data.role as UserRole,
        createdAt: data.created_at,
        avatarUrl: data.avatar_url,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function changePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ---------- Admin Functions ----------

export async function getAllRegisteredUsers(): Promise<SafeUser[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "instructor") return [];

    const { data: profiles, error } = await supabase
      .from("user_profiles")
      .select("*");

    if (error || !profiles) return [];
    
    return profiles.map(p => ({
      id: p.user_id,
      email: "user@hidden.com", // Hidden for privacy/admin logic
      fullName: p.full_name,
      phone: p.phone || "",
      bio: p.bio || "",
      role: p.role as UserRole,
      createdAt: p.created_at,
      avatarUrl: p.avatar_url,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") throw new Error("Forbidden: Admin only");

    const { error } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") throw new Error("Forbidden: Admin only");

    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
