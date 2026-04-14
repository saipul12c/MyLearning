import type { Metadata } from "next";
import {
  Target,
  Eye,
  Heart,
  Users,
  BookOpen,
  Award,
  Globe,
  ArrowRight,
  Lightbulb,
  Rocket,
  Shield,
  Star,
} from "lucide-react";
import Link from "next/link";
import { getInstructors, getSystemStats } from "@/lib/courses";
import { formatNumber } from "@/lib/utils";
import InstructorCarousel from "../components/InstructorCarousel";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tentang MyLearning - Platform belajar online terbaik di Indonesia. Misi kami adalah demokratisasi pendidikan berkualitas untuk semua orang.",
};

export default async function AboutPage() {
  const [allInstructors, stats] = await Promise.all([
    getInstructors(),
    getSystemStats()
  ]);
  
  return (
    <>
      {/* Hero */}
      <section className="hero-bg grid-pattern py-20 sm:py-28">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="badge badge-primary mb-4 inline-block">
            Tentang Kami
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
            Membuat Pendidikan Berkualitas{" "}
            <span className="gradient-text">Terjangkau untuk Semua</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            MyLearning lahir dari keyakinan bahwa setiap orang berhak mendapat
            akses ke pendidikan berkualitas tinggi, tanpa batasan lokasi atau
            biaya.
          </p>
        </div>
      </section>

      {/* Misi & Visi */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card p-8 sm:p-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-6">
                <Target size={28} className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Misi Kami</h2>
              <p className="text-slate-400 leading-relaxed">
                Menyediakan platform pendidikan digital yang inklusif dan
                berkualitas tinggi. Kami berkomitmen untuk membantu setiap
                individu mengembangkan skill digital yang relevan dengan
                kebutuhan industri saat ini, melalui konten kurikulum yang
                terstruktur dan instruktur berpengalaman.
              </p>
            </div>
            <div className="card p-8 sm:p-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-6">
                <Eye size={28} className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Visi Kami</h2>
              <p className="text-slate-400 leading-relaxed">
                Menjadi platform edukasi teknologi terdepan di Asia Tenggara
                yang memberdayakan jutaan orang untuk meningkatkan kualitas
                hidup mereka melalui skill digital. Kami bermimpi tentang dunia
                di mana setiap orang bisa belajar dan berkembang tanpa batas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nilai-Nilai */}
      <section className="py-20 grid-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">
              Nilai-Nilai <span className="gradient-text">Kami</span>
            </h2>
            <p className="section-subtitle mx-auto text-center">
              Prinsip yang menjadi fondasi setiap keputusan kami
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: "Kualitas",
                desc: "Setiap kursus melalui review ketat untuk memastikan standar konten tertinggi.",
                color: "text-rose-400",
                bg: "from-rose-500/20 to-rose-500/5",
              },
              {
                icon: Lightbulb,
                title: "Inovasi",
                desc: "Terus berinovasi dalam metode pengajaran dan teknologi platform.",
                color: "text-amber-400",
                bg: "from-amber-500/20 to-amber-500/5",
              },
              {
                icon: Globe,
                title: "Inklusivitas",
                desc: "Pendidikan yang dapat diakses oleh siapapun, dari manapun.",
                color: "text-emerald-400",
                bg: "from-emerald-500/20 to-emerald-500/5",
              },
              {
                icon: Shield,
                title: "Integritas",
                desc: "Transparansi dan kejujuran dalam setiap aspek layanan kami.",
                color: "text-blue-400",
                bg: "from-blue-500/20 to-blue-500/5",
              },
            ].map((value) => (
              <div key={value.title} className="card p-6 text-center group">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${value.bg} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}
                >
                  <value.icon size={24} className={value.color} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instruktur */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="badge badge-accent mb-4 inline-block">
              Tim Instruktur
            </span>
            <h2 className="section-title">
              Belajar dari{" "}
              <span className="gradient-text">Praktisi Terbaik</span>
            </h2>
            <p className="section-subtitle mx-auto text-center">
              Instruktur kami adalah para profesional aktif yang membagikan
              pengalaman nyata dari industri
            </p>
          </div>

          <InstructorCarousel instructors={allInstructors} />
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 grid-pattern">
        <div className="max-w-5xl mx-auto px-4">
          <div className="card p-10 sm:p-14">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                {
                  value: `${formatNumber(stats.totalStudents)}+`,
                  label: "Siswa Terdaftar",
                  icon: Users,
                },
                { value: `${stats.totalCourses}+`, label: "Kursus Tersedia", icon: BookOpen },
                { value: `${stats.totalInstructors}+`, label: "Instruktur Ahli", icon: Award },
                { value: `${stats.ratingPercentage}%`, label: "Rating Kepuasan", icon: Star },
              ].map((stat) => (
                <div key={stat.label}>
                  <stat.icon
                    size={24}
                    className="text-purple-400 mx-auto mb-3"
                  />
                  <div className="text-3xl font-extrabold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title">
              Perjalanan <span className="gradient-text">Kami</span>
            </h2>
          </div>

          <div className="space-y-8 relative">
            {/* Line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-cyan-500/30 to-transparent hidden sm:block" />

            {[
              {
                year: "2023",
                title: "MyLearning Didirikan",
                desc: "Platform diluncurkan dengan 10 kursus pertama dan 500 siswa awal.",
              },
              {
                year: "2024",
                title: "10,000 Siswa",
                desc: "Melampaui 10,000 siswa aktif dan 50 kursus. Mendapatkan pendanaan seed round.",
              },
              {
                year: "2025",
                title: "Ekspansi Besar",
                desc: "Peluncuran aplikasi mobile, fitur sertifikasi, dan kemitraan dengan 20+ perusahaan teknologi.",
              },
              {
                year: "2026",
                title: "50,000+ Siswa",
                desc: "Menjadi salah satu platform edukasi terbesar di Indonesia dengan 200+ kursus.",
              },
            ].map((milestone, idx) => (
              <div key={idx} className="flex gap-6 relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center flex-shrink-0 z-10">
                  <Rocket size={18} className="text-white" />
                </div>
                <div className="card p-5 flex-1">
                  <span className="badge badge-primary text-xs mb-2">
                    {milestone.year}
                  </span>
                  <h3 className="text-white font-semibold mb-1">
                    {milestone.title}
                  </h3>
                  <p className="text-slate-400 text-sm">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="card p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20" />
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold mb-4">
                Bergabung dengan{" "}
                <span className="gradient-text">{formatNumber(stats.totalStudents)}+</span> Siswa Lainnya
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                Mulai perjalanan belajar Anda hari ini dan raih karir impian
                bersama MyLearning.
              </p>
              <Link
                href="/courses"
                className="btn-primary text-base !py-3.5 !px-10"
              >
                Jelajahi Kursus
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
