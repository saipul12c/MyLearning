"use client";

import { useRef, useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PLATFORM_DIRECTOR } from "@/lib/utils";

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
  isAutoDownload?: boolean;
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
    isAutoDownload,
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

  useEffect(() => {
    if (isAutoDownload && fontsLoaded && !generating) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        handleDownload();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAutoDownload, fontsLoaded]);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(certRef.current, {
        scale: 3, // Increased scale for better readability
        useCORS: true,
        backgroundColor: "#FFFFFF",
        width: 800,
        height: 560,
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [800, 560] });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 800, 560);
      pdf.save(`Sertifikat_${userName.replace(/\s+/g, "_")}_${courseTitle.replace(/\s+/g, "_").substring(0, 30)}.pdf`);
      
      // Auto close if in auto-download mode
      if (isAutoDownload) {
        onClose();
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      if (isAutoDownload) onClose();
    }
    setGenerating(false);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mylearning.id';

  return (
    <div className={isAutoDownload ? "fixed left-[-9999px] top-[-9999px] pointer-events-none opacity-0" : "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"} onClick={(e) => (e.target as HTMLElement).id === "cert-overlay" && onClose()}>
      {!isAutoDownload && <div id="cert-overlay" className="absolute inset-0" />}
      
      <div className={isAutoDownload ? "" : "bg-[#0c0c14] rounded-3xl border border-white/10 max-w-[900px] w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-3xl"}>
        {/* Modern Header - Only show in preview mode */}
        {!isAutoDownload && (
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
        )}

        {/* Certificate Container */}
        <div className={isAutoDownload ? "" : "flex-1 overflow-auto p-4 bg-black/40 flex items-center justify-center"}>
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
              boxShadow: isAutoDownload ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
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
              padding: "25px 50px 15px 50px"
            }}>
              {/* Logo Section */}
              <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)"
                }}>
                  <img src="/logo.png" alt="Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                </div>
              </div>

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
              <div style={{ marginBottom: "10px" }}>
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
              <div style={{ marginBottom: "10px", maxWidth: "480px" }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  <p style={{ fontSize: "11px", color: "#222" }}>
                    Dibimbing oleh: <span style={{ fontWeight: 700 }}>{instructor}</span>
                  </p>
                  <p style={{ fontSize: "10px", color: "#8B7D6B" }}>
                    Diselenggarakan pada {startDate} &mdash; {endDate}
                  </p>
                </div>
              </div>

              {/* Signatures Section - Fixed positioning to ensure visibility and prevent clipping */}
              <div style={{ 
                marginTop: "5px", // Tightened even more to prevent clipping
                display: "flex", 
                justifyContent: "center", 
                gap: "100px",
                width: "100%",
                padding: "0 40px"
              }}>
                {[
                  { name: instructor, title: "Instruktur Kursus", id: instructorSignatureId },
                  { name: adminName || PLATFORM_DIRECTOR, title: "Direktur MyLearning", id: adminSignatureId }
                ].map((sig, idx) => (
                  <div key={idx} style={{ textAlign: "center", width: "160px", position: "relative" }}>
                    <div style={{ height: "55px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" }}>
                       {/* Priority: Use sig.id if available, fallback to adminSignatureId for instructor IF needed */}
                       {(() => {
                         const displayId = sig.id || (idx === 0 ? adminSignatureId : null);
                         if (displayId) {
                           return (
                             <div style={{ 
                               padding: "5px", 
                               background: "white", 
                               borderRadius: "8px", 
                               border: "1px solid #F0EBE0",
                               boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                             }}>
                               <QRCodeSVG value={`${origin}/verify-signature/${displayId}`} size={44} level="H" includeMargin={true} />
                             </div>
                           );
                         }
                         return <div style={{ borderBottom: "1.5px solid #E3D9C6", width: "100px", height: "1px", marginBottom: "8px" }} />;
                       })()}
                    </div>
                    <p style={{ fontSize: "11px", fontWeight: "800", color: "#1B2A4A", margin: "0", lineHeight: "1.2", whiteSpace: "pre-wrap", letterSpacing: "0.2px" }}>{sig.name}</p>
                    <p style={{ fontSize: "7.5px", color: "#8B7D6B", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px", fontWeight: "600" }}>{sig.title}</p>
                    
                    {/* Fallback Label */}
                    {idx === 0 && !sig.id && adminSignatureId && (
                      <p style={{ fontSize: "6.5px", color: "#C0B283", fontStyle: "italic", marginTop: "2px", position: "absolute", width: "100%", textAlign: "center" }}>
                        (Authorized by Director)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Right Header Info - Clean & Integrated Verification */}
            <div style={{ 
              position: "absolute", 
              top: "35px", 
              right: "35px", 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              gap: "5px",
              zIndex: 35
            }}>
                <div style={{ 
                  padding: "4px", 
                  background: "white", 
                  borderRadius: "6px", 
                  border: "1px solid #E3D9C6",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
                }}>
                  <QRCodeSVG value={`${origin}/verify/${certificateId}`} size={48} level="H" includeMargin={true} />
                </div>
                <div style={{ textAlign: "center" }}>
                   <p style={{ fontSize: "8px", color: "#1B2A4A", fontWeight: "900", fontFamily: "monospace", margin: 0 }}>{certificateId}</p>
                   <p style={{ fontSize: "6.5px", color: "#8B7D6B", fontWeight: "600", marginTop: "1px" }}>mylearning.id/verify</p>
                </div>
            </div>

            {/* Absolute Footer Bar - Minimalist Line Decoration */}
            <div style={{ 
              position: "absolute", 
              bottom: "15px", 
              left: "60px", 
              right: "60px", 
              zIndex: 30,
              borderTop: "1px solid #F4F1EA"
            }} />

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
