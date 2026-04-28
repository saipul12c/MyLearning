"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Loader2, Award, ShieldCheck, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface CertificateGeneratorProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  certificateNumber: string;
  onComplete?: () => void;
}

export default function CertificateGenerator({
  userName,
  eventTitle,
  eventDate,
  certificateNumber,
  onComplete
}: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    if (!certificateRef.current) return;
    setGenerating(true);

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#09090f"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificate-${certificateNumber}.pdf`);
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Certificate generation error:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hidden Certificate Template (Will be captured) */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={certificateRef}
          className="w-[1123px] h-[794px] bg-[#09090f] text-white p-20 relative overflow-hidden flex flex-col items-center justify-between border-[20px] border-[#1a1a2e]"
          style={{ fontFamily: 'sans-serif' }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 border-[2px] border-white/5 m-4 pointer-events-none" />
          
          {/* Header */}
          <div className="text-center relative z-10">
            <div className="flex justify-center mb-6">
               <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl">
                  <Award size={48} className="text-white" />
               </div>
            </div>
            <h1 className="text-5xl font-black tracking-[0.2em] uppercase text-white mb-2">Certificate</h1>
            <p className="text-cyan-400 font-bold tracking-[0.5em] uppercase text-sm">Of Achievement</p>
          </div>

          {/* Body */}
          <div className="text-center relative z-10 w-full max-w-3xl">
            <p className="text-slate-400 italic text-lg mb-8">This is to certify that</p>
            <h2 className="text-6xl font-black text-white mb-4 tracking-tight border-b-2 border-white/10 pb-4 inline-block px-12">
              {userName}
            </h2>
            <p className="text-slate-400 text-lg mt-8 mb-4 leading-relaxed">
              has successfully participated in and completed the event
            </p>
            <h3 className="text-3xl font-bold text-purple-400 mb-2">
              {eventTitle}
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              Held on {eventDate}
            </p>
          </div>

          {/* Footer */}
          <div className="w-full flex items-end justify-between relative z-10 border-t border-white/5 pt-12">
            <div className="space-y-4">
              <div className="w-48 h-px bg-white/20" />
              <p className="text-white font-bold text-sm uppercase tracking-widest">MyLearning Academy</p>
              <p className="text-slate-500 text-[10px] font-medium">Authorized Platform Representative</p>
            </div>

            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Verify at mylearning.id</p>
                  <p className="text-white font-mono text-xs">{certificateNumber}</p>
               </div>
               <div className="p-2 bg-white rounded-lg">
                  <QRCodeSVG value={`https://mylearning.id/verify/${certificateNumber}`} size={64} />
               </div>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={generatePDF}
        disabled={generating}
        className="btn-primary !h-12 !px-8 flex items-center gap-3 group shadow-2xl shadow-purple-500/20"
      >
        {generating ? (
          <><Loader2 size={20} className="animate-spin" /> Generating PDF...</>
        ) : (
          <><Download size={20} className="group-hover:translate-y-1 transition-transform" /> Download Certificate (PDF)</>
        )}
      </button>
      
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] flex items-center gap-2">
        <ShieldCheck size={12} className="text-emerald-500" /> Digital Verified Document
      </p>
    </div>
  );
}
