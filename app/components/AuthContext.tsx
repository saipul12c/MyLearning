"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { SafeUser, UserRole } from "@/lib/auth";
import {
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getCurrentUser,
  updateProfile as authUpdateProfile,
  changePassword as authChangePassword,
} from "@/lib/auth";
import { migrateLocalStorageToSupabase } from "@/lib/enrollment";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: SafeUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<SafeUser, "fullName" | "phone" | "bio" | "avatarUrl">>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        // Trigger migration if user is logged in
        await migrateLocalStorageToSupabase(currentUser.id);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial user check
    refreshUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await refreshUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const result = await authLogin(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    setLoading(false);
    return { success: result.success, error: result.error };
  };

  const register = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    const result = await authRegister(fullName, email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    setLoading(false);
    return { success: result.success, error: result.error };
  };

  const logout = async () => {
    setLoading(true);
    await authLogout();
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Pick<SafeUser, "fullName" | "phone" | "bio" | "avatarUrl">>) => {
    if (!user) return { success: false, error: "Tidak ada user yang login." };
    setLoading(true);
    const result = await authUpdateProfile(user.id, updates);
    if (result.success && result.user) {
      setUser(result.user);
    }
    setLoading(false);
    return { success: result.success, error: result.error };
  };

  const changePassword = async (newPassword: string) => {
    setLoading(true);
    const result = await authChangePassword(newPassword);
    setLoading(false);
    return { success: result.success, error: result.error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === "admin",
        isInstructor: user?.role === "instructor",
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
