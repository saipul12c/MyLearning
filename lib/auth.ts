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
  isOnline: boolean;
  lastSeenAt: string;
  // Ban status
  isBanned?: boolean;
  banReason?: string;
  enrollmentCount?: number;
}

export const BAN_REASONS = [
  "Pelanggaran Syarat & Ketentuan (TOS)",
  "Aktivitas Spam atau Iklan Tidak Sah",
  "Perkataan Kasar atau Pelecehan (Harassment)",
  "Penggunaan Akun Bersama (Account Sharing)",
  "Manipulasi Data atau Percobaan Hacking",
  "Penipuan Pembayaran atau Chargeback",
  "Penyebaran Konten Tidak Pantas",
  "Pelanggaran Hak Cipta Materi Kursus",
  "Perilaku Toxic di Komunitas/Chat",
  "Pencurian Identitas atau Akun Palsu",
  "Penyalahgunaan Fitur Referral/Voucher",
  "Pembatalan Transaksi Berulang yang Mencurigakan",
  "Ancaman Terhadap Keamanan Platform",
  "Permintaan Penutupan Akun oleh Pemilik",
  "Aktivitas Mencurigakan Lainnya"
];

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
        email: authData.user.email, // Store email for easier admin access
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
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
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

    // Check if user is banned
    if (user.isBanned) {
      await logout(); // Ensure session is cleared if they somehow got in
      throw new Error(`Akun Anda telah di-ban. Alasan: ${user.banReason || "Tidak ditentukan"}`);
    }

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
      isOnline: false,
      lastSeenAt: createdAt,
    };
  }

  return {
    id: userId,
    email: profile.email || email, // Prefer email from profile if available
    fullName: profile.full_name,
    phone: profile.phone || "",
    bio: profile.bio || "",
    role: profile.role as UserRole,
    createdAt: profile.created_at || createdAt,
    avatarUrl: profile.avatar_url,
    isOnline: profile.is_online || false,
    lastSeenAt: profile.last_seen_at || profile.created_at || createdAt,
    isBanned: profile.is_banned || false,
    banReason: profile.ban_reason || "",
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
    email: profile.email || "user@hidden.com",
    fullName: profile.full_name,
    phone: "",
    bio: profile.bio || "",
    role: profile.role as UserRole,
    createdAt: profile.created_at,
    avatarUrl: profile.avatar_url,
    isOnline: profile.is_online || false,
    lastSeenAt: profile.last_seen_at || profile.created_at,
    isBanned: profile.is_banned || false,
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
        isOnline: data.is_online || false,
        lastSeenAt: data.last_seen_at || data.created_at,
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
      email: p.email || "user@hidden.com", // Showing actual email if stored in user_profiles
      fullName: p.full_name,
      phone: p.phone || "",
      bio: p.bio || "",
      role: p.role as UserRole,
      createdAt: p.created_at,
      avatarUrl: p.avatar_url,
      isOnline: p.is_online || false,
      lastSeenAt: p.last_seen_at || p.created_at,
      isBanned: p.is_banned || false,
      banReason: p.ban_reason || "",
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Returns the total count of registered users.
 * Optimized using a count query instead of data retrieval.
 */
export async function getUserCount(): Promise<number> {
  const { count, error } = await supabase
    .from("user_profiles")
    .select("id", { count: 'exact', head: true });
  
  if (error) return 0;
  return count || 0;
}

export async function getUsersPaginatedAdmin(options: {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<{ data: SafeUser[]; totalCount: number }> {
  try {
    const { page, pageSize, search, role, status } = options;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "instructor") throw new Error("Forbidden");

    // 1. Build Query
    let query = supabase
      .from("user_profiles")
      .select("*, enrollmentCount:enrollments(count)", { count: 'exact' });

    // 2. Apply Filters
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    if (status && status !== "all") {
      query = query.eq("is_banned", status === "banned");
    }

    if (search) {
      // High Performance Search: Using the generated fts column
      query = query.textSearch('fts', search, {
        config: 'simple',
        type: 'websearch'
      });
    }

    // 3. Apply Pagination & Sort
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: profiles, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    const formattedData = (profiles || []).map(p => ({
      id: p.user_id,
      email: p.email || "user@hidden.com",
      fullName: p.full_name,
      phone: p.phone || "",
      bio: p.bio || "",
      role: p.role as UserRole,
      createdAt: p.created_at,
      avatarUrl: p.avatar_url,
      isOnline: p.is_online || false,
      lastSeenAt: p.last_seen_at || p.created_at,
      isBanned: p.is_banned || false,
      banReason: p.ban_reason || "",
      enrollmentCount: (p as any).enrollmentCount?.[0]?.count || 0
    }));

    return { 
      data: formattedData, 
      totalCount: count || 0 
    };
  } catch (error) {
    console.error(error);
    return { data: [], totalCount: 0 };
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

export async function toggleUserBan(userId: string, isBanned: boolean, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", currentUser.id)
      .single();

    if (profile?.role !== "admin") throw new Error("Forbidden: Admin only");

    const { error } = await supabase
      .from("user_profiles")
      .update({ 
        is_banned: isBanned,
        ban_reason: isBanned ? reason : null
      })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  try {
    await supabase
      .from("user_profiles")
      .update({ 
        is_online: isOnline, 
        last_seen_at: new Date().toISOString() 
      })
      .eq("user_id", userId);
  } catch (error) {
    console.error("Error updating online status:", error);
  }
}
