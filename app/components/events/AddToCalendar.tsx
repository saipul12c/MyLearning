"use client";

import { Calendar, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AddToCalendarProps {
  event: {
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate?: string;
  };
}

export default function AddToCalendar({ event }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toISOString().replace(/-|:|\.\d+/g, "");
  };

  const googleUrl = () => {
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description.substring(0, 500));
    const location = encodeURIComponent(event.location);
    const start = formatDate(event.startDate);
    const end = event.endDate ? formatDate(event.endDate) : formatDate(new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString());
    
    return `${base}&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
  };

  const outlookUrl = () => {
    const base = "https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent";
    const subject = encodeURIComponent(event.title);
    const body = encodeURIComponent(event.description.substring(0, 500));
    const location = encodeURIComponent(event.location);
    const start = new Date(event.startDate).toISOString();
    const end = event.endDate ? new Date(event.endDate).toISOString() : new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString();
    
    return `${base}&subject=${subject}&body=${body}&location=${location}&startdt=${start}&enddt=${end}`;
  };

  // iCal / Apple Calendar uses a blob
  const handleICalDownload = () => {
    const start = formatDate(event.startDate);
    const end = event.endDate ? formatDate(event.endDate) : formatDate(new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString());
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.substring(0, 500)}`,
      `LOCATION:${event.location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${event.title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all group"
      >
        <Calendar size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
        Tambahkan ke Kalender
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-56 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1">
            <a
              href={googleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-bold"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Google Calendar
            </a>
            <a
              href={outlookUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-bold"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-2 h-2 rounded-full bg-blue-600" /> Outlook
            </a>
            <button
              onClick={() => {
                handleICalDownload();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-bold text-left"
            >
              <div className="w-2 h-2 rounded-full bg-slate-500" /> iCal / Apple Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
