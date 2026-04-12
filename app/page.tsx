import Link from "next/link";
import {
  BookOpen,
  Users,
  Award,
  PlayCircle,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { formatPrice, formatNumber } from "@/lib/utils";
import { getCourses } from "@/lib/courses";

export default async function HomePage() {
  const allCourses = await getCourses();
  const featured = allCourses.filter(c => c.isFeatured).slice(0, 14);

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="hero-bg grid-pattern relative min-h-[90vh] flex items-center">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-sm font-medium mb-6 animate-fade-in-up">
              <Sparkles size={14} />
              Platform Belajar #1 Indonesia
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-in-up delay-100">
              Tingkatkan{" "}
              <span className="gradient-text">Skill Digital</span> Anda
              Bersama Mentor Terbaik
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mb-8 animate-fade-in-up delay-200">
              Akses 200+ kursus berkualitas dari instruktur berpengalaman.
              Belajar kapan saja, di mana saja, dengan kurikulum yang selalu
              up-to-date.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up delay-300">
              <Link
                href="/courses"
                className="btn-primary text-base !py-3.5 !px-8"
                id="hero-cta-explore"
              >
                Jelajahi Kursus
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/about"
                className="btn-secondary text-base !py-3.5 !px-8"
                id="hero-cta-learn"
              >
                <PlayCircle size={18} />
                Pelajari Lebih Lanjut
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 animate-fade-in-up delay-400">
              {[
                { icon: Users, value: "50,000+", label: "Siswa Aktif" },
                { icon: BookOpen, value: "200+", label: "Kursus" },
                { icon: Award, value: "50+", label: "Instruktur Ahli" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <stat.icon size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">
                      {stat.value}
                    </div>
                    <div className="text-slate-500 text-xs">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED COURSES ===== */}
      <section className="py-20 relative" id="featured-courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="badge badge-primary mb-4 inline-block">
              Kursus Populer
            </span>
            <h2 className="section-title text-center">
              Kursus <span className="gradient-text">Unggulan</span> Kami
            </h2>
            <p className="section-subtitle mx-auto text-center">
              Dipilih berdasarkan rating tertinggi dan jumlah siswa terbanyak
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((course, i) => (
              <Link
                href={`/courses/${course.slug}`}
                key={course.id}
                className="card group overflow-hidden"
                id={`featured-course-${course.slug}`}
              >
                {/* Thumbnail placeholder */}
                <div className="relative h-44 bg-gradient-to-br from-purple-900/40 to-cyan-900/30 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen
                      size={40}
                      className="text-purple-400/50 group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  {course.discountPrice && (
                    <span className="absolute top-3 right-3 badge badge-success text-xs">
                      DISKON
                    </span>
                  )}
                  <span className="absolute top-3 left-3 badge badge-primary text-xs">
                    {course.category}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-slate-500 text-xs mb-3">
                    {course.instructor}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      {course.rating}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {formatNumber(course.totalStudents)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {course.durationHours}j
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {course.discountPrice ? (
                      <>
                        <span className="text-white font-bold text-sm">
                          {formatPrice(course.discountPrice)}
                        </span>
                        <span className="text-slate-500 text-xs line-through">
                          {formatPrice(course.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {formatPrice(course.price)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/courses"
              className="btn-secondary"
              id="view-all-courses"
            >
              Lihat Semua Kursus
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-20 grid-pattern relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="badge badge-accent mb-4 inline-block">
              Keunggulan
            </span>
            <h2 className="section-title text-center">
              Mengapa Memilih{" "}
              <span className="gradient-text">MyLearning</span>?
            </h2>
            <p className="section-subtitle mx-auto text-center">
              Kami berkomitmen memberikan pengalaman belajar online terbaik untuk
              Anda
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Award,
                title: "Instruktur Berpengalaman",
                desc: "Belajar langsung dari praktisi industri dengan pengalaman 10+ tahun di bidangnya.",
                color: "from-purple-500/20 to-purple-500/5",
                iconColor: "text-purple-400",
              },
              {
                icon: Zap,
                title: "Belajar Interaktif",
                desc: "Kursus dilengkapi dengan proyek praktis, quiz, dan sertifikat setelah selesai.",
                color: "from-cyan-500/20 to-cyan-500/5",
                iconColor: "text-cyan-400",
              },
              {
                icon: Clock,
                title: "Akses Seumur Hidup",
                desc: "Sekali beli, akses selamanya. Termasuk semua update konten yang akan datang.",
                color: "from-amber-500/20 to-amber-500/5",
                iconColor: "text-amber-400",
              },
              {
                icon: Shield,
                title: "Garansi 30 Hari",
                desc: "Tidak puas? Dapatkan refund penuh dalam 30 hari. Tanpa pertanyaan.",
                color: "from-emerald-500/20 to-emerald-500/5",
                iconColor: "text-emerald-400",
              },
              {
                icon: TrendingUp,
                title: "Kurikulum Terkini",
                desc: "Materi selalu diupdate mengikuti perkembangan teknologi dan industri terbaru.",
                color: "from-rose-500/20 to-rose-500/5",
                iconColor: "text-rose-400",
              },
              {
                icon: Users,
                title: "Komunitas Aktif",
                desc: "Bergabung dengan 50,000+ siswa lainnya di forum diskusi dan group belajar.",
                color: "from-indigo-500/20 to-indigo-500/5",
                iconColor: "text-indigo-400",
              },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 group">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon size={22} className={feature.iconColor} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="badge badge-primary mb-4 inline-block">
              Testimoni
            </span>
            <h2 className="section-title text-center">
              Apa Kata <span className="gradient-text">Siswa</span> Kami
            </h2>
            <p className="section-subtitle mx-auto text-center">
              Ribuan siswa telah merasakan manfaat belajar di MyLearning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Dimas Pratama",
                role: "Full-Stack Developer di Tokopedia",
                courseName: "Mastering React & Next.js",
                courseSlug: "mastering-react-nextjs",
                text: "Kursus React & Next.js di MyLearning benar-benar mengubah karir saya. Dalam 3 bulan, saya berhasil landing job sebagai developer di perusahaan unicorn!",
                rating: 5,
              },
              {
                name: "Anisa Putri",
                role: "Data Analyst di GoTo",
                courseName: "Python for Data Science",
                courseSlug: "python-data-science-ml",
                text: "Materi Python untuk Data Science sangat komprehensif. Instrukturnya sabar dan menjelaskan konsep kompleks dengan cara yang mudah dipahami.",
                rating: 5,
              },
              {
                name: "Raka Mahendra",
                role: "UI/UX Designer Freelance",
                courseName: "UI/UX Design Masterclass",
                courseSlug: "uiux-design-figma",
                text: "Setelah menyelesaikan kursus UI/UX Design, portofolio saya meningkat drastis. Sekarang saya bisa mendapatkan klien freelance dari luar negeri.",
                rating: 5,
              },
              {
                name: "Siti Aminah",
                role: "Mobile Developer di Grab",
                courseName: "Flutter Mobile Development",
                courseSlug: "flutter-mobile-development",
                text: "Belajar Flutter di sini sangat menyenangkan. Kurikulumnya sangat up-to-date dengan kebutuhan industri saat ini.",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="card p-6 flex flex-col h-full">
                {/* Stars */}
                <div className="stars mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic flex-grow">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-slate-500 text-xs text-balance">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/courses/${testimonial.courseSlug}`}
                    className="flex items-center gap-2 group/link"
                  >
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lulusan:</div>
                    <div className="text-[11px] text-purple-400 font-bold group-hover/link:text-cyan-400 transition-colors underline decoration-purple-400/30 underline-offset-4">
                      {testimonial.courseName}
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-10 sm:p-14 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Siap Untuk{" "}
                <span className="gradient-text">Mulai Belajar</span>?
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                Bergabunglah dengan ribuan siswa yang telah meningkatkan skill
                dan karir mereka bersama MyLearning.
              </p>
              <Link
                href="/courses"
                className="btn-primary text-base !py-3.5 !px-10"
                id="cta-bottom-start"
              >
                Mulai Belajar Sekarang
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
