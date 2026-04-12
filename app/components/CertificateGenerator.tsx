"use client";

import { useRef, useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface CertificateProps {
  userName: string;
  courseTitle: string;
  startDate: string;
  endDate: string;
  instructor: string;
  certificateId: string;
  instructorSignatureId?: string | null;
  adminSignatureId?: string | null;
  adminName?: string;
  isExpired?: boolean;
  isSample?: boolean;
  onClose: () => void;
}

export default function CertificateGenerator(props: CertificateProps) {
  const { 
    userName, 
    courseTitle, 
    startDate, 
    endDate, 
    instructor, 
    certificateId, 
    instructorSignatureId,
    adminSignatureId,
    adminName,
    isExpired, 
    isSample, 
    onClose 
  } = props;

  const certRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => setFontsLoaded(true), 1000);
    return () => { try { document.head.removeChild(link); } catch(e) {} };
  }, []);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(certRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        width: 800,
        height: 560,
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [800, 560] });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 800, 560);
      pdf.save(`Sertifikat_${userName.replace(/\s+/g, "_")}_${courseTitle.replace(/\s+/g, "_").substring(0, 30)}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
    setGenerating(false);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mylearning.id';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => (e.target as HTMLElement).id === "cert-overlay" && onClose()}>
      <div id="cert-overlay" className="absolute inset-0" />
      <div className="bg-[#0c0c14] rounded-3xl border border-white/10 max-w-[900px] w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-3xl">
        {/* Modern Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/2">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Pratinjau Sertifikat Digital</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Verified Achievement System</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              disabled={generating || !fontsLoaded}
              className="btn-primary text-xs !py-3 !px-6 flex items-center gap-2 font-bold shadow-lg shadow-purple-500/20"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {generating ? "MEMPROSES..." : "UNDUH SERTIFIKAT PDF"}
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Container */}
        <div className="flex-1 overflow-auto p-4 bg-black/40 flex items-center justify-center">
          <div
            ref={certRef}
            id="certificate-content"
            style={{
              width: "800px",
              height: "560px",
              background: "#FFFFFF",
              position: "relative",
              fontFamily: "'Inter', sans-serif",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* Minimalist Background Ornaments */}
            <div style={{ position: "absolute", inset: 0, border: "20px solid #FFFFFF", zIndex: 5 }} />
            <div style={{ position: "absolute", inset: "20px", border: "1px solid #E3D9C6", zIndex: 5 }} />
            <div style={{ position: "absolute", top: 0, left: 0, width: "150px", height: "150px", background: "radial-gradient(circle at 0 0, #FDFCF9 0%, transparent 70%)", zIndex: 1 }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(circle at 100% 100%, #FDFCF9 0%, transparent 70%)", zIndex: 1 }} />

            {/* Content Logic: Use flex to distribute space and prevent bottom overlap */}
            <div style={{ 
              position: "relative", 
              zIndex: 10, 
              height: "100%", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              padding: "35px 50px"
            }}>
              {/* Header Section */}
              <div style={{ marginBottom: "10px" }}>
                 <p style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "4px", color: "#8B7D6B", textTransform: "uppercase" }}>Certificate of Excellence</p>
                 <div style={{ height: "1px", width: "40px", background: "#C0B283", margin: "6px auto" }} />
              </div>

              <h1 style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: "36px", 
                fontWeight: "900", 
                color: "#1B2A4A", 
                margin: "0", 
                textTransform: "uppercase",
                letterSpacing: "-0.5px"
              }}>
                Sertifikat Kelulusan
              </h1>
              <p style={{ fontSize: "11px", color: "#8B7D6B", marginBottom: "15px" }}>Nomor Seri: {certificateId}</p>

              {/* Recipient Section */}
              <div style={{ marginBottom: "15px" }}>
                <p style={{ fontSize: "13px", fontStyle: "italic", color: "#666", marginBottom: "6px" }}>Dengan bangga diberikan kepada:</p>
                <h2 style={{ 
                  fontFamily: "'Great Vibes', cursive",
                  fontSize: "40px", 
                  color: "#1B2A4A", 
                  margin: "0 0 5px 0"
                }}>
                  {userName}
                </h2>
                <div style={{ height: "1px", width: "200px", background: "linear-gradient(90deg, transparent, #E3D9C6, transparent)", margin: "0 auto" }} />
              </div>

              {/* Description Section */}
              <div style={{ marginBottom: "15px", maxWidth: "480px" }}>
                <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px", lineHeight: "1.4" }}>
                  Telah berhasil menyelesaikan kompetensi pada program kursus intensif:
                </p>
                <h3 style={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "20px", 
                  fontWeight: "800", 
                  color: "#C0B283", 
                  margin: "0 0 10px 0",
                  lineHeight: "1.1"
                }}>
                  &ldquo;{courseTitle}&rdquo;
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <p style={{ fontSize: "11px", color: "#222" }}>
                    Dibimbing oleh: <span style={{ fontWeight: 700 }}>{instructor}</span>
                  </p>
                  <p style={{ fontSize: "10px", color: "#8B7D6B" }}>
                    Diselenggarakan pada {startDate} &mdash; {endDate}
                  </p>
                </div>
              </div>

              {/* Signatures Section - Pushed down but with fixed space */}
              <div style={{ 
                marginTop: "auto", 
                marginBottom: "45px", 
                display: "flex", 
                justifyContent: "center", 
                gap: "120px",
                width: "100%"
              }}>
                {[{ name: instructor, title: "Instruktur Kursus", id: instructorSignatureId },
                  { name: adminName || "Muhammad Syaiful Mukmin", title: "Direktur MyLearning", id: adminSignatureId }
                ].map((sig, idx) => (
                  <div key={idx} style={{ textAlign: "center", width: "140px" }}>
                    <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px" }}>
                       {sig.id ? (
                         <div style={{ padding: "4px", background: "white", borderRadius: "4px", border: "1px solid #F0EBE0" }}>
                           <QRCodeCanvas value={`${origin}/verify-signature/${sig.id}`} size={52} level="H" />
                         </div>
                       ) : (
                         <div style={{ borderBottom: "1px solid #EEE", width: "100px", height: "1px" }} />
                       )}
                    </div>
                    <p style={{ fontSize: "10px", fontWeight: "700", color: "#1B2A4A", margin: "0" }}>{sig.name}</p>
                    <p style={{ fontSize: "8px", color: "#8B7D6B", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "1px" }}>{sig.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Absolute Footer Bar - Reduced height and moved lower */}
            <div style={{ 
              position: "absolute", 
              bottom: "30px", 
              left: "60px", 
              right: "60px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-end",
              zIndex: 20,
              paddingTop: "10px",
              borderTop: "1px solid #F9F7F2"
            }}>
               <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "8px", color: "#1B2A4A", fontWeight: "600" }}>Verified by MyLearning Tracking System</p>
                  <p style={{ fontSize: "7px", color: "#8B7D6B" }}>Platform Authentication v2.0</p>
               </div>
               
               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ textAlign: "right" }}>
                     <p style={{ fontSize: "7px", color: "#8B7D6B", fontWeight: "700", textTransform: "uppercase" }}>Authenticity Check</p>
                     <p style={{ fontSize: "8px", color: "#1B2A4A", fontWeight: "800" }}>ID: {certificateId}</p>
                  </div>
                  <div style={{ padding: "3px", background: "white", borderRadius: "4px", border: "1px solid #E3D9C6" }}>
                    <QRCodeCanvas value={`${origin}/verify/${certificateId}`} size={42} level="H" />
                  </div>
               </div>
            </div>

            {/* Overlays */}
            {isExpired && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, pointerEvents: "none" }}>
                <div style={{ transform: "rotate(-25deg)", border: "6px solid rgba(220, 38, 38, 0.2)", borderRadius: "10px", padding: "10px 50px" }}>
                  <p style={{ fontSize: "50px", fontWeight: "900", color: "rgba(220, 38, 38, 0.2)", margin: 0, textTransform: "uppercase" }}>EXPIRED</p>
                </div>
              </div>
            )}

            {isSample && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0, opacity: 0.05, pointerEvents: "none", transform: "rotate(-35deg)" }}>
                <p style={{ fontSize: "100px", fontWeight: "900", whiteSpace: "nowrap" }}>PREVIEW ONLY</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
