"use client";

import { useState } from "react";
import CertificateGenerator from "@/app/components/CertificateGenerator";
import Logo from "@/app/components/Logo";

/**
 * Halaman Demo Sertifikat (Stand Alone)
 * Digunakan untuk pratinjau desain tanpa harus menyelesaikan kursus asli.
 */
export default function TestCertificatePage() {
  const [showCert, setShowCert] = useState(false);

  // Data Mock untuk Testing
  const mockData = {
    userName: "Siswa Masterpiece MyLearning",
    courseTitle: "Expertise in Premium Web Application Design",
    startDate: "01 Januari 2026",
    endDate: "12 April 2026",
    instructor: "Alex Chandra, M.Kom",
    certificateId: "ML-2026-PREVIEW-MODE",
    instructorSignatureId: "mock-instructor-sig-123",
    adminSignatureId: "mock-admin-sig-456",
    isExpired: false,
  };

  return (
    <div className="min-h-screen bg-[#0c0c14] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl">
        <Logo size="xl" className="mx-auto mb-8" />
        
        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
          Preview Sistem <span className="gradient-text">Verifikasi Sertifikat</span>
        </h1>
        
        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          Gunakan tombol di bawah untuk melihat desain sertifikat terbaru yang dilengkapi dengan **QR Code** dan **ID Unik** untuk sistem pelacakan otomatis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setShowCert(true)}
            className="btn-primary !px-10 !py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-purple-500/20"
          >
            Buka Pratinjau Sertifikat
          </button>
          
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-500 font-medium italic">
            *Data ini hanya bersifat simulasi dan tidak tersimpan di database.
          </div>
        </div>
      </div>

      {showCert && (
        <CertificateGenerator 
          userName={mockData.userName}
          courseTitle={mockData.courseTitle}
          startDate={mockData.startDate}
          endDate={mockData.endDate}
          instructor={mockData.instructor}
          certificateId={mockData.certificateId}
          instructorSignatureId={mockData.instructorSignatureId}
          adminSignatureId={mockData.adminSignatureId}
          isExpired={mockData.isExpired}
          isSample={true}
          onClose={() => setShowCert(false)}
        />
      )}

      {/* Backdrop Decorative */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[150px] rounded-full" />
      </div>
    </div>
  );
}
