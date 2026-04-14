"use client";

import { Download, Share2, Check } from "lucide-react";
import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateActionsProps {
  certificateId: string;
  userName: string;
  courseTitle: string;
  courseSlug: string;
}

export default function CertificateActions({ certificateId, userName, courseTitle, courseSlug }: CertificateActionsProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    const element = document.getElementById("certificate-card-content");
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#11111a",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Sertifikat_${userName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
      alert("Maaf, terjadi kesalahan saat membuat PDF. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (platform: "linkedin" | "twitter") => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Saya baru saja menyelesaikan kursus "${courseTitle}" di MyLearning! Lihat sertifikat saya di sini:`);
    
    let shareUrl = "";
    if (platform === "linkedin") {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    } else {
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    }
    
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* Main Action: Download */}
      <button 
        onClick={handleDownload}
        disabled={loading}
        className="btn-primary flex items-center gap-2 shadow-xl shadow-purple-500/20"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Download size={18} />
        )}
        {loading ? "Menyiapkan PDF..." : "Unduh Sertifikat PDF"}
      </button>

      {/* Social Sharing */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => handleShare("linkedin")}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 hover:bg-[#0077b5] hover:text-white transition-all shadow-lg"
          title="Bagikan ke LinkedIn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </button>
        <button 
          onClick={() => handleShare("twitter")}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-lg"
          title="Bagikan ke X (Twitter)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
        <button 
          onClick={copyToClipboard}
          className={`w-11 h-11 flex items-center justify-center rounded-2xl border transition-all shadow-lg ${copied ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
          title="Salin Link Verifikasi"
        >
          {copied ? <Check size={20} /> : <Share2 size={20} />}
        </button>
      </div>
    </div>
  );
}
