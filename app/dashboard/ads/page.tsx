"use client";

import AdsHistory from "./AdsHistory";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function InstructorAdsPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
           <ArrowLeft size={18} />
        </Link>
        <div>
           <h1 className="text-2xl font-black text-white tracking-tight">Iklan & Promosi Saya</h1>
           <p className="text-slate-500 text-xs">Kelola kampanye iklan kursus Anda</p>
        </div>
      </div>

      <AdsHistory />
    </div>
  );
}
