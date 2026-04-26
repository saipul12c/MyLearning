"use client";

import { QRCodeSVG } from "qrcode.react";
import { 
  Calendar, MapPin, Clock, User, Hash, Download, 
  MapPinIcon, CheckCircle2, Ticket
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useEffect } from "react";

interface TicketCardProps {
  registration: {
    id: string;
    status: string;
    createdAt: string;
    event: {
      title: string;
      eventDate: string;
      location: string;
      shortDescription: string;
    };
    userProfile: {
      fullName: string;
    };
  };
}

export default function TicketCard({ registration }: TicketCardProps) {
  const [qrData, setQrData] = useState("");

  useEffect(() => {
    // ✅ Only access window on client-side to prevent SSR hydration mismatch
    const data = JSON.stringify({
      registrationId: registration.id,
      eventId: registration.event.title,
      userName: registration.userProfile.fullName,
      verifyUrl: `${window.location.origin}/verify-ticket/${registration.id}`
    });
    setQrData(data);
  }, [registration.id, registration.event.title, registration.userProfile.fullName]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto print:shadow-none bg-[#09090f] p-1 shadow-2xl rounded-[3rem] border border-white/10 overflow-hidden group">
      <div className="bg-[#0c0c14] rounded-[2.8rem] overflow-hidden flex flex-col relative">
        {/* Top Section - Event Info */}
        <div className="p-8 pb-6 bg-gradient-to-br from-purple-500/20 to-transparent border-b border-dashed border-white/10 relative">
          <div className="flex items-center justify-between mb-6">
             <div className="px-4 py-1.5 rounded-full bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 flex items-center gap-2">
                <Ticket size={12} /> E-Ticket
             </div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Hash size={12} className="text-purple-500" /> {registration.id.substring(0, 8).toUpperCase()}
             </span>
          </div>
          
          <h3 className="text-2xl font-black text-white leading-tight mb-4 group-hover:text-purple-400 transition-colors">
            {registration.event.title}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tanggal</p>
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                   <Calendar size={14} className="text-purple-500" />
                   {format(new Date(registration.event.eventDate), "d MMM yyyy", { locale: id })}
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Waktu</p>
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                   <Clock size={14} className="text-purple-500" />
                   {format(new Date(registration.event.eventDate), "HH:mm")} WIB
                </div>
             </div>
          </div>
        </div>

        {/* Middle Section - Participant & QR */}
        <div className="p-8 pt-6 flex flex-col items-center gap-8 relative">
           {/* Decorative punches for ticket effect */}
           <div className="absolute top-0 -left-4 w-8 h-8 rounded-full bg-[#09090f] -translate-y-1/2" />
           <div className="absolute top-0 -right-4 w-8 h-8 rounded-full bg-[#09090f] -translate-y-1/2" />
           
           <div className="w-full space-y-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <User size={24} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Pemegang Tiket</p>
                    <p className="text-white font-black uppercase tracking-tight">{registration.userProfile.fullName}</p>
                 </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <MapPinIcon size={24} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Lokasi</p>
                    <p className="text-white font-bold text-xs">{registration.event.location}</p>
                 </div>
              </div>
           </div>

           <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-purple-500/20 group-hover:scale-105 transition-transform duration-500 border-4 border-purple-500/30">
              <QRCodeSVG 
                value={qrData}
                size={160}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/logo.png", // Fallback if exists
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
           </div>

           <div className="text-center space-y-1">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Scan QR Code pada saat</p>
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                 <CheckCircle2 size={14} /> Proses Check-in Event
              </p>
           </div>
        </div>

        {/* Footer Section */}
        <div className="px-8 py-6 bg-white/[0.03] border-t border-white/5 flex gap-4 print:hidden">
           <button 
             onClick={handlePrint}
             className="flex-1 btn-secondary !py-3 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
           >
              <Download size={14} /> Simpan / Cetak
           </button>
        </div>
      </div>
    </div>
  );
}
