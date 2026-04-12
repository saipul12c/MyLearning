"use client";

import { useRef, useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";

interface CertificateProps {
  userName: string;
  courseTitle: string;
  startDate: string;
  endDate: string;
  instructor: string;
  isExpired?: boolean;
  onClose: () => void;
}

export default function CertificateGenerator({ userName, courseTitle, startDate, endDate, instructor, isExpired, onClose }: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Montserrat:wght@400;500;600&family=Great+Vibes&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => setFontsLoaded(true), 1000);
    return () => { document.head.removeChild(link); };
  }, []);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        width: 1122,
        height: 793,
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1122, 793] });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 1122, 793);
      pdf.save(`Sertifikat_${userName.replace(/\s+/g, "_")}_${courseTitle.replace(/\s+/g, "_").substring(0, 30)}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c14] rounded-2xl border border-white/10 max-w-[1200px] w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Preview Sertifikat</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={generating || !fontsLoaded}
              className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {generating ? "Generating..." : "Download PDF"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="p-6 flex justify-center overflow-auto">
          <div
            ref={certRef}
            style={{
              width: "1122px",
              height: "793px",
              background: "linear-gradient(135deg, #FFFDF5 0%, #FFF8E8 100%)",
              position: "relative",
              fontFamily: "'Montserrat', sans-serif",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Outer Border */}
            <div style={{
              position: "absolute", inset: "20px",
              border: "2px solid #1B2A4A",
              borderRadius: "4px",
            }} />
            {/* Inner Border */}
            <div style={{
              position: "absolute", inset: "26px",
              border: "1px solid #C9A84C",
              borderRadius: "2px",
            }} />

            {/* Corner Ornaments */}
            {[
              { top: "30px", left: "30px" }, { top: "30px", right: "30px" },
              { bottom: "30px", left: "30px" }, { bottom: "30px", right: "30px" },
            ].map((pos, i) => (
              <div key={i} style={{
                position: "absolute", ...pos, width: "50px", height: "50px",
                borderTop: i < 2 ? "3px solid #C9A84C" : "none",
                borderBottom: i >= 2 ? "3px solid #C9A84C" : "none",
                borderLeft: i % 2 === 0 ? "3px solid #C9A84C" : "none",
                borderRight: i % 2 === 1 ? "3px solid #C9A84C" : "none",
              }} />
            ))}

            {/* Gold top line */}
            <div style={{
              position: "absolute", top: "55px", left: "100px", right: "100px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
            }} />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingTop: "75px" }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: "bold", fontSize: "16px",
                }}>M</div>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "18px", color: "#1B2A4A" }}>
                  MyLearning
                </span>
              </div>

              {/* Subtitle */}
              <p style={{ fontSize: "10px", color: "#8B7D6B", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "25px" }}>
                Minimalist Certificate of Completion
              </p>

              {/* Title */}
              <h1 style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 800,
                fontSize: "38px", color: "#1B2A4A", letterSpacing: "4px",
                textTransform: "uppercase", marginBottom: "4px",
              }}>
                SERTIFIKAT PENYELESAIAN
              </h1>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#8B7D6B", fontStyle: "italic", marginBottom: "30px" }}>
                Certificate of Completion
              </p>

              {/* Given to */}
              <p style={{ fontSize: "13px", color: "#5A5A5A", marginBottom: "10px" }}>
                Dengan bangga diberikan kepada:
              </p>

              {/* Name */}
              <h2 style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: "52px", color: "#1B2A4A",
                marginBottom: "5px", lineHeight: 1.2,
              }}>
                {userName}
              </h2>

              {/* Name underline */}
              <div style={{
                width: "300px", height: "2px", margin: "0 auto 20px",
                background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
              }} />

              {/* Course info */}
              <p style={{ fontSize: "13px", color: "#5A5A5A", marginBottom: "8px", maxWidth: "600px", margin: "0 auto 8px" }}>
                Atas dedikasi dan keberhasilannya dalam menyelesaikan kursus:
              </p>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 700,
                fontSize: "20px", color: "#1B2A4A",
                marginBottom: "15px", maxWidth: "700px", margin: "0 auto 15px",
                lineHeight: 1.4,
              }}>
                &ldquo;{courseTitle}&rdquo;
              </h3>

              <p style={{ fontSize: "12px", color: "#8B7D6B", marginBottom: "30px" }}>
                Yang diselenggarakan pada tanggal {startDate} hingga {endDate}
              </p>

              {/* Date + City */}
              <p style={{ fontSize: "12px", color: "#5A5A5A", marginBottom: "30px" }}>
                Jakarta, {today}
              </p>

              {/* Signatures */}
              <div style={{ display: "flex", justifyContent: "center", gap: "120px", marginTop: "10px" }}>
                {[
                  { name: instructor, title: "Instruktur Kursus" },
                  { name: "Muhammad Syaiful Mukmin", title: "Direktur MyLearning" },
                ].map((sig) => (
                  <div key={sig.name} style={{ textAlign: "center" }}>
                    <div style={{
                      fontFamily: "'Great Vibes', cursive", fontSize: "24px",
                      color: "#1B2A4A", marginBottom: "5px",
                    }}>
                      {sig.name}
                    </div>
                    <div style={{ width: "180px", height: "1px", background: "#1B2A4A", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#1B2A4A" }}>{sig.name}</p>
                    <p style={{ fontSize: "10px", color: "#8B7D6B" }}>{sig.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom gold line */}
            <div style={{
              position: "absolute", bottom: "55px", left: "100px", right: "100px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
            }} />

            {/* EXPIRED Watermark */}
            {isExpired && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 10,
              }}>
                <div style={{
                  transform: "rotate(-30deg)",
                  border: "6px solid rgba(220, 38, 38, 0.6)",
                  borderRadius: "12px",
                  padding: "15px 60px",
                }}>
                  <p style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "48px",
                    fontWeight: 800,
                    color: "rgba(220, 38, 38, 0.6)",
                    letterSpacing: "8px",
                    textTransform: "uppercase",
                    lineHeight: 1.3,
                    textAlign: "center",
                  }}>
                    EXPIRED<br/>
                    <span style={{ fontSize: "20px", letterSpacing: "3px" }}>TIDAK BERLAKU</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
