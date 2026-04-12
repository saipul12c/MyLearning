"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import {
  BookOpen, LayoutDashboard, Library, BookMarked, User, LogOut,
  Users, GraduationCap, MessageSquare, Settings, Shield, Menu, X, ChevronLeft,
} from "lucide-react";

const userMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Jelajahi Kursus", icon: Library },
  { href: "/dashboard/my-courses", label: "Kursus Saya", icon: BookMarked },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

const adminMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/analytics", label: "Analitik & Penjualan", icon: Shield },
  { href: "/dashboard/admin/users", label: "Kelola Pengguna", icon: Users },
  { href: "/dashboard/admin/courses", label: "Kelola Kursus", icon: GraduationCap },
  { href: "/dashboard/admin/enrollments", label: "Kelola Enrollment", icon: BookMarked },
  { href: "/dashboard/admin/messages", label: "Pesan Kontak", icon: MessageSquare },
  { href: "/dashboard/admin/settings", label: "Pengaturan", icon: Settings },
];

const instructorMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/analytics", label: "Analitik Saya", icon: Shield },
  { href: "/dashboard/admin/courses", label: "Kelola Kursus", icon: GraduationCap },
  { href: "/dashboard/admin/enrollments", label: "Kelola Enrollment", icon: BookMarked },
  { href: "/dashboard/admin/users", label: "Daftar Siswa", icon: Users },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, isAdmin, isInstructor, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090f]">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = isAdmin ? adminMenuItems : (isInstructor ? instructorMenuItems : userMenuItems);
  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#09090f] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-white/5 bg-[#0c0c14] transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">My</span>
              <span className="text-white">Learning</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.fullName}</p>
              <div className="flex items-center gap-1.5">
                {isAdmin && <Shield size={10} className="text-amber-400" />}
                {isInstructor && <GraduationCap size={10} className="text-purple-400" />}
                <p className="text-xs text-slate-500">{isAdmin ? "Administrator" : (isInstructor ? "Instructor" : "Learner")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {isAdmin && (
            <p className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin Panel</p>
          )}
          {isInstructor && (
            <p className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Instructor Panel</p>
          )}
          {menuItems.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500/15 to-cyan-500/10 text-white border border-purple-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-purple-400" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to site + Logout */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={18} /> Kembali ke Situs
          </Link>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-[#09090f]/80 backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
