"use client";

import { useState, useEffect } from "react";
import { Timer, Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = null;

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeft;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl animate-pulse">
        <Clock size={16} />
        <span>Event Sedang Berlangsung / Selesai</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-400 tracking-[0.2em] ml-1">
        <Timer size={14} /> Tersisa Menuju Acara
      </div>
      <div className="flex gap-2 sm:gap-4">
        {[
          { label: "Hari", value: timeLeft.days },
          { label: "Jam", value: timeLeft.hours },
          { label: "Menit", value: timeLeft.minutes },
          { label: "Detik", value: timeLeft.seconds },
        ].map((unit, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-all hover:border-purple-500/30 group">
              <span className="text-xl sm:text-3xl font-black text-white group-hover:scale-110 transition-transform">
                {unit.value.toString().padStart(2, "0")}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
