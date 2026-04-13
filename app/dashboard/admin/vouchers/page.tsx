"use client";

import { useAuth } from "@/app/components/AuthContext";
import VoucherManagement from "@/app/components/admin/VoucherManagement";
import { Loader2 } from "lucide-react";

export default function VouchersPage() {
  const { user, isAdmin, isInstructor, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (!isAdmin && !isInstructor) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Akses Dibatasi</h2>
        <p className="text-slate-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <VoucherManagement role={isAdmin ? "admin" : "instructor"} />
    </div>
  );
}
