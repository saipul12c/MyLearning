"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "./AuthContext";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import ConfirmationModal from "./ConfirmationModal";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Kursus" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Kontak" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, isAdmin, isInstructor, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  return (
    <header
      id="main-navbar"
      className={`sticky top-0 left-0 right-0 z-[90] transition-all duration-300 ${
        scrolled ? "glass-strong py-2 shadow-lg shadow-black/20" : "py-4 bg-[#0c0c14]/50 backdrop-blur-sm"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Logo 
          href="/" 
          withText={true} 
          id="navbar-logo"
        />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                id={`nav-link-${link.label.toLowerCase()}`}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  id="user-menu-button"
                >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-white/10">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <span className="text-sm text-slate-300 max-w-[120px] truncate">{user?.fullName}</span>
                {isAdmin && <Shield size={14} className="text-amber-400" />}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl overflow-hidden shadow-2xl shadow-black/40 animate-fade-in">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm text-white font-medium truncate">{user?.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">
                        <Shield size={10} /> Admin
                      </span>
                    )}
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <User size={16} /> Profil
                    </Link>
                  </div>
                  <div className="border-t border-white/5 py-1">
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                    >
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm !py-2 !px-4 flex items-center gap-1.5">
                <LogIn size={15} /> Masuk
              </Link>
              <Link href="/register" className="btn-primary text-sm !py-2 !px-4 flex items-center gap-1.5">
                <UserPlus size={15} /> Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 pt-2 glass-strong mt-2 mx-4 rounded-2xl">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "text-white bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 px-4 py-4 mb-2 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden border border-white/10">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{user?.fullName}</p>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                      {isAdmin ? "Administrator" : isInstructor ? "Instruktur" : "Siswa"}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard" className="btn-primary w-full text-sm !py-2.5 flex items-center justify-center gap-2">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(true);
                  }} 
                  className="btn-secondary w-full text-sm !py-2.5 flex items-center justify-center gap-2 text-red-400"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary w-full text-sm !py-2.5">Masuk</Link>
                <Link href="/register" className="btn-primary w-full text-sm !py-2.5">Daftar</Link>
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal 
        isOpen={showLogoutConfirm}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun MyLearning Anda?"
        confirmLabel="Ya, Keluar"
        onConfirm={async () => {
          await logout();
          setShowLogoutConfirm(false);
          setDropdownOpen(false);
          setMobileOpen(false);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}
