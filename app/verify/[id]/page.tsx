import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, Award, Calendar, User, ShieldCheck, ArrowRight, ExternalLink, AlertCircle } from "lucide-react";
import { getCertificateByNumber } from "@/lib/certificates";

export const metadata: Metadata = {
  title: "Verifikasi Sertifikat | MyLearning",
  description: "Verifikasi keaslian sertifikat kursus MyLearning Anda.",
};

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { id } = await params;
  const cert = await getCertificateByNumber(id);

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sertifikat Tidak Ditemukan</h1>
          <p className="text-slate-400 mb-8">Maaf, nomor sertifikat yang Anda masukkan tidak valid atau tidak terdaftar dalam sistem kami.</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            Kembali ke Beranda <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0c0c14] relative overflow-hidden flex flex-col items-center py-20 px-6">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full" />

      <div className="max-w-3xl w-full relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6 animate-pulse">
            <ShieldCheck size={16} /> Terverifikasi Secara Digital
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Validasi <span className="gradient-text">Sertifikat</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Dokumen ini diakui secara sah oleh MyLearning sebagai bukti penyelesaian kursus yang kompeten.
          </p>
        </div>

        {/* Certificate Card */}
        <div className="card p-1 bg-gradient-to-br from-white/10 to-white/5 rounded-[40px] shadow-2xl">
          <div className="bg-[#11111a] rounded-[38px] p-8 md:p-12 relative overflow-hidden">
            {/* Watermark Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <Award size={400} />
            </div>

            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              {/* Left Column: Achievement */}
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Penerima Sertifikat</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-lg">
                      <User size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white leading-tight">{cert.userName}</h2>
                      <p className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                        <CheckCircle size={14} /> Identitas Terverifikasi
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Detail Kursus</label>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-start gap-3">
                      <Award className="text-purple-400 shrink-0 mt-1" size={20} />
                      <div>
                        <h3 className="text-white font-bold leading-snug">{cert.courseTitle}</h3>
                        <p className="text-slate-400 text-xs mt-1">Selesai dengan hasil memuaskan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="text-cyan-400 shrink-0" size={20} />
                      <div>
                        <p className="text-white text-sm font-medium">{issuedDate}</p>
                        <p className="text-slate-400 text-xs mt-0.5">Tanggal Penerbitan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Meta Info */}
              <div className="flex flex-col justify-between space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block text-right md:text-left">Nomor Sertifikat</label>
                    <div className="text-right md:text-left">
                      <code className="bg-white/5 text-purple-300 px-4 py-2 rounded-xl text-lg font-mono border border-white/5">
                        {cert.certificateNumber}
                      </code>
                    </div>
                  </div>

                  <div className="flex flex-col items-end md:items-start gap-4">
                     <div className="text-right md:text-left">
                        <p className="text-white font-bold">{cert.instructorName}</p>
                        <p className="text-slate-500 text-xs">Instruktur Kursus</p>
                     </div>
                     <div className="text-right md:text-left">
                        <p className="text-white font-bold">Muhammad Syaiful Mukmin</p>
                        <p className="text-slate-500 text-xs">Direktur MyLearning</p>
                     </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <div className={`p-4 rounded-2xl flex items-center gap-3 ${cert.isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {cert.isValid ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                    <div className="flex-1">
                      <p className="text-sm font-black uppercase tracking-widest leading-none mb-1">Status: {cert.isValid ? 'Valid' : 'Kadaluarsa'}</p>
                      <p className="text-[10px] opacity-70">Aksi verifikasi ini bersifat final dan terenkripsi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
            <Link 
              href={`/courses/${cert.courseSlug}`}
              className="text-slate-400 hover:text-white transition-all text-sm font-medium flex items-center justify-center gap-2 group"
            >
              Lihat kurikulum kursus ini <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="mt-12 opacity-30 flex items-center justify-center gap-8 md:gap-16 grayscale">
                <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
            </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto pt-20 text-slate-600 text-xs font-medium tracking-widest uppercase">
        © {new Date().getFullYear()} MyLearning Digital Credential System
      </footer>
    </div>
  );
}
