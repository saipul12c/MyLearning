"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { SafeUser, UserRole } from "@/lib/auth";
import {
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getCurrentUser,
  updateProfile as authUpdateProfile,
  changePassword as authChangePassword,
  updateOnlineStatus,
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
  const isMigrationRunning = useRef(false);
  const initialCheckDone = useRef(false);


  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser && !isMigrationRunning.current) {
        // Trigger migration if user is logged in
        isMigrationRunning.current = true;
        await migrateLocalStorageToSupabase(currentUser.id);
      }

    } catch (error) {
      console.error("Error refreshing user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for auth state changes which also handles the initial session check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // To prevent race conditions during INITIAL_SESSION event
      // if refreshUser was already called by initial mount
      if (initialCheckDone.current && event === 'INITIAL_SESSION') return;
      
      if (session?.user) {
        await refreshUser();
        initialCheckDone.current = true;
      } else {
        setUser(null);
        setLoading(false);
        initialCheckDone.current = true;
      }
    });

    // Fallback: If onAuthStateChange hasn't triggered within a reasonable time, 
    // run initial check manually (some older browsers or race conditions)
    const timeout = setTimeout(() => {
        if (!initialCheckDone.current) {
            refreshUser();
        }
    }, 1500);


    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };

  }, [refreshUser]);

  // Heartbeat for online status & Real-time Profile Listener
  useEffect(() => {
    if (!user) return;

    // 1. Online Status Heartbeat
    updateOnlineStatus(user.id, true);
    const statusInterval = setInterval(() => {
      updateOnlineStatus(user.id, true);
    }, 60000); 

    // 2. Real-time Profile Refresh
    // This ensures that updates (like avatar changed) from other tabs/devices
    // reflect immediately without a manual refresh
    const profileChannel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("Real-time profile update received:", payload);
          await refreshUser();
        }
      )
      .subscribe();

    // 3. Real-time Enrollment Listener
    // This ensures that if an Admin approves a payment or updates progress
    // the dashboard updates instantly
    const enrollmentChannel = supabase
      .channel(`enrollments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("Real-time enrollment update received:", payload);
          // If we are in a dashboard page, the page state might need a refresh
          // or we can trigger a global refresh here too
          await refreshUser();
        }
      )
      .subscribe();

    const handleOffline = () => {
      updateOnlineStatus(user.id, false);
    };

    window.addEventListener("beforeunload", handleOffline);
    
    return () => {
      clearInterval(statusInterval);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(enrollmentChannel);
      handleOffline();
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [user, refreshUser]);

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
        isAdmin: user?.role?.toLowerCase() === "admin",
        isInstructor: user?.role?.toLowerCase() === "instructor",
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
