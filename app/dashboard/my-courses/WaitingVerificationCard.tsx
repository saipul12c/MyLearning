"use client";

import { Clock, CreditCard, Loader2 } from "lucide-react";
import type { Enrollment } from "@/lib/enrollment";

export default function WaitingVerificationCard({ waiting }: { waiting: Enrollment[] }) {
  if (waiting.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-white flex items-center gap-3">
        <Clock size={20} className="text-cyan-400" /> MENUNGGU VERIFIKASI 
        <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full">{waiting.length}</span>
      </h2>
      <div className="grid gap-4">
        {waiting.map((enr) => (
          <div key={enr.id} className="card p-6 border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{enr.courseTitle}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium">Pembayaran Anda sedang diverifikasi secara manual oleh administrator.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[.2em] bg-cyan-500/10 px-4 py-2 rounded-full animate-pulse border border-cyan-500/20">
                <Loader2 size={14} className="animate-spin" /> Verifying
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
