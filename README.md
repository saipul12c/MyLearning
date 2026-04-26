# MyLearning - Platform Pembelajaran Online Indonesia

Platform pembelajaran online terpasang dengan fitur lengkap untuk memberdayakan pendidikan digital di Indonesia. MyLearning menyediakan ekosistem pembelajaran yang komprehensif dengan kursu berkualitas tinggi, instruktur berpengalaman, dan teknologi terkini.

## 🌟 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Instalasi & Setup](#instalasi--setup)
- [Struktur Proyek](#struktur-proyek)
- [Panduan Penggunaan](#panduan-penggunaan)
- [API & Database](#api--database)
- [Deployment](#deployment)
- [Kontribusi](#kontribusi)

---

## ✨ Fitur Utama

### User-Side Features
- **🔐 Autentikasi & Profil**
  - Login/Register dengan email
  - Verifikasi email dan keamanan dua faktor
  - Management profil pengguna
  - Dashboard personal dengan progress tracking

- **📚 Katalog Kursus**
  - Browse ribuan kursus berkualitas
  - Filter dan pencarian advanced
  - Preview video dan deskripsi lengkap
  - Rating dan review dari pengguna
  - Sistem rekomendasi berbasis AI

- **🎓 Pembelajaran Interaktif**
  - Video player dengan subtitle
  - Materi pembelajaran (markdown support)
  - Quiz dan assessment untuk setiap modul
  - Sertifikat digital otomatis
  - Download materi untuk offline learning

- **💬 Komunitas & Diskusi**
  - Forum diskusi per kursus
  - Live chat dengan instruktur
  - Q&A section
  - Peer-to-peer learning

- **🎁 Promosi & Voucher**
  - Sistem voucher dinamis
  - Flash sale dan promotional campaigns
  - Discount codes dan referral program
  - Bundle deals untuk multiple courses

- **📊 Analytics & Progress**
  - Tracking progress pembelajaran
  - Completion certificates
  - Badge dan achievement system
  - Learning statistics dashboard

- **🎤 Events & Webinar**
  - Virtual events dan webinar live
  - Event registration dan ticketing
  - Agenda dan speaker information
  - Attendee management

- **💳 Payment & E-Commerce**
  - Multiple payment methods
  - Payment gateway integration
  - Invoice generation
  - Refund management

### Admin & Instructor Features
- **👨‍🏫 Instructor Dashboard**
  - Course management dan publishing
  - Student progress monitoring
  - Revenue tracking
  - Performance analytics
  - Content versioning dan revision

- **📋 Admin Panel**
  - User management
  - Course moderation
  - Payment & financial reporting
  - Promotional campaign management
  - System configuration
  - Event scheduling
  - Advertisement management

- **📢 Marketing & Advertisement**
  - Native ads placement
  - Video ads integration
  - Carousel ads management
  - Performance metrics

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.2.2 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React Icons
- **Markdown**: React Markdown dengan GFM support
- **PDF Generation**: jsPDF + html2canvas
- **QR Code**: qrcode.react
- **Form & Validation**: React built-in + custom hooks

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **Storage**: Supabase Storage (images, videos, documents)
- **AI Integration**: Google Gemini API

### DevOps & Tools
- **Deployment**: Netlify (production)
- **Version Control**: Git
- **Linting**: ESLint 9
- **Package Manager**: npm
- **Environment**: Node.js latest

---

## 📦 Instalasi & Setup

### Prerequisites
- Node.js 18+ dan npm/yarn
- Supabase account (database dan auth)
- Google Gemini API key (untuk AI features)
- Netlify account (untuk deployment)

### Langkah-Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd my-learning
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   Buat file `.env.local` dengan konfigurasi berikut:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Google Gemini
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Payment Gateway (jika menggunakan)
   NEXT_PUBLIC_PAYMENT_API_URL=payment_gateway_url
   ```

4. **Setup Database**
   ```bash
   # Jalankan migrations di Supabase
   # File: database/01_schema.sql hingga 15_fix_capacity_counter.sql
   ```

5. **Development Server**
   ```bash
   npm run dev
   # Akses http://localhost:3000
   ```

6. **Build untuk Production**
   ```bash
   npm run build
   npm start
   ```

---

## 📁 Struktur Proyek

```
my-learning/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Global styles
│   ├── components/               # Reusable React components
│   │   ├── AuthContext.tsx       # Authentication context
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── LessonPlayer.tsx      # Video player
│   │   ├── QuizModal.tsx         # Quiz functionality
│   │   ├── CertificateGenerator.tsx  # Sertifikat generation
│   │   ├── PaymentModal.tsx      # Payment handling
│   │   ├── InstructorDashboard.tsx   # Instructor tools
│   │   ├── admin/                # Admin components
│   │   ├── ui/                   # UI components (buttons, modals, etc)
│   │   └── events/               # Event-related components
│   ├── dashboard/                # User dashboard pages
│   │   ├── layout.tsx
│   │   ├── admin/                # Admin dashboard
│   │   ├── instructor/           # Instructor workspace
│   │   ├── my-courses/           # User enrolled courses
│   │   ├── profile/              # User profile
│   │   ├── ads/                  # Ad management (admin)
│   │   └── vouchers/             # Voucher management (admin)
│   ├── courses/                  # Course pages
│   │   ├── page.tsx              # Course listing
│   │   └── [slug]/               # Individual course pages
│   ├── events/                   # Events & webinar pages
│   ├── contact/                  # Contact form
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── verify/                   # Email verification
│   ├── faq/                      # FAQ section
│   ├── about/                    # About page
│   ├── terms/                    # Terms of service
│   └── privacy/                  # Privacy policy
│
├── lib/                          # Utility dan business logic
│   ├── supabase.ts               # Supabase client setup
│   ├── auth.ts                   # Authentication functions
│   ├── courses.ts                # Course-related functions
│   ├── enrollment.ts             # Enrollment logic
│   ├── certificates.ts           # Certificate generation
│   ├── payments.ts               # Payment processing (jika ada)
│   ├── analytics.ts              # Analytics tracking
│   ├── gemini.ts                 # Google Gemini AI integration
│   ├── notifications.ts          # Email & notification system
│   ├── discussions.ts            # Forum & discussion logic
│   ├── reviews.ts                # Reviews dan ratings
│   ├── assessments.ts            # Quiz dan assessment logic
│   ├── promotions.ts             # Promotional campaigns
│   ├── vouchers.ts               # Voucher system
│   ├── events.ts                 # Event management
│   ├── signatures.ts             # Digital signature verification
│   ├── live_chat.ts              # Real-time chat
│   ├── instructor.ts             # Instructor-specific logic
│   ├── interests.ts              # User interests & preferences
│   ├── profiles.ts               # User profile management
│   ├── storage.ts                # File upload/download
│   ├── search-utils.ts           # Search functionality
│   └── utils.ts                  # General utilities
│
├── database/                     # Database schema & migrations
│   ├── 01_schema.sql             # Main tables schema
│   ├── 02_logic.sql              # Stored procedures & functions
│   ├── 03_security.sql           # RLS policies
│   ├── 04_seed_users.sql         # User seed data
│   ├── 05_seed_catalog.sql       # Course catalog
│   ├── 06_seed_curriculum.sql    # Lesson structure
│   ├── 07_seed_engagement.sql    # Engagement data
│   ├── 08_signatures.sql         # Signature system
│   ├── 09_live_cs.sql            # Live chat schema
│   ├── 10_vouchers.sql           # Voucher management
│   ├── 11_seed_events.sql        # Event data
│   ├── 12_email_notifications.sql# Email configuration
│   ├── 13_rate_limiting.sql      # Rate limiting
│   ├── 14_certificate_generation.sql # Certificate schema
│   └── 15_fix_capacity_counter.sql   # Bug fixes
│
├── public/                       # Static assets
│   └── courses/                  # Course thumbnails & media
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── proxy.ts                      # API proxy configuration
├── netlify.toml                  # Netlify deployment config
└── README.md                     # Documentation (file ini)
```

---

## 🚀 Panduan Penggunaan

### Untuk User/Student

1. **Registrasi & Login**
   - Klik tombol "Register" di homepage
   - Isi email dan password
   - Verifikasi email Anda
   - Login ke dashboard

2. **Browsing Kursus**
   - Kunjungi halaman "Kursus" untuk melihat katalog
   - Gunakan filter untuk menemukan kursus yang sesuai
   - Klik kursus untuk preview video dan read reviews
   - Lihat instructor profile dan rating

3. **Mengikuti Kursus**
   - Klik "Enroll" atau "Beli Kursus"
   - Lakukan pembayaran
   - Akses materi di "My Courses"
   - Ikuti modul secara berurutan

4. **Pembelajaran**
   - Tonton video dengan video player built-in
   - Baca materi pembelajaran
   - Ikuti quiz di akhir modul
   - Berinteraksi di discussion forum
   - Chat dengan instruktur

5. **Sertifikat**
   - Selesaikan semua modul dan quiz
   - Dapatkan sertifikat digital otomatis
   - Download atau bagikan di LinkedIn
   - Verifikasi sertifikat dengan unique signature

### Untuk Instructor

1. **Setup Channel**
   - Login ke dashboard
   - Akses "Instructor Dashboard"
   - Setup channel dan bio
   - Upload profile picture

2. **Membuat Kursus**
   - Klik "Create New Course"
   - Isi detail kursus (title, description, category, price)
   - Upload course thumbnail
   - Ubah status menjadi "Published"

3. **Membuat Materi**
   - Buat modul baru
   - Upload video (dari YouTube, Vimeo, atau storage)
   - Tulis deskripsi dan resources
   - Add quiz questions
   - Set learning objectives

4. **Mengelola Siswa**
   - View enrolled students
   - Track progress setiap siswa
   - Respond ke pertanyaan
   - Manage discussions

5. **Analytics & Revenue**
   - View course performance metrics
   - Check student enrollment
   - Monitor revenue
   - Download reports

### Untuk Admin

1. **User Management**
   - View all users
   - Manage user roles dan permissions
   - Handle support tickets
   - Monitor user activity

2. **Course Moderation**
   - Review dan approve new courses
   - Monitor course content untuk compliance
   - Handle course reports
   - Manage course categories

3. **Payment & Financial**
   - View all transactions
   - Process refunds
   - Generate financial reports
   - Manage payment methods

4. **Promotional Campaigns**
   - Create discount codes
   - Define promotional periods
   - Monitor campaign performance
   - Manage advertisement inventory

5. **System Configuration**
   - Configure platform settings
   - Manage email templates
   - Setup payment gateways
   - Configure AI settings

---

## 📊 API & Database

### Database Schema Highlights

**Main Tables:**
- `users` - User accounts
- `courses` - Course information
- `lessons` - Lesson content
- `enrollments` - Student course enrollments
- `assessments` - Quiz dan tests
- `certificates` - Digital certificates
- `payments` - Transaction records
- `reviews_ratings` - Course reviews
- `discussions` - Forum posts
- `live_sessions` - Live streaming sessions
- `events` - Virtual events
- `vouchers` - Discount codes
- `promotions` - Marketing campaigns
- `advertisements` - Ad placements
- `signatures` - Digital signatures

### Key Features
- Row Level Security (RLS) untuk data privacy
- Stored procedures untuk complex operations
- Real-time subscriptions (Realtime DB)
- Full-text search capabilities
- Rate limiting untuk API protection

### API Routes
- `POST /api/auth/*` - Authentication endpoints
- `GET/POST /api/courses/*` - Course management
- `GET/POST /api/lessons/*` - Lesson access
- `GET/POST /api/enrollments/*` - Enrollment management
- `POST /api/certificates/*` - Certificate generation
- `GET/POST /api/payments/*` - Payment processing
- `GET/POST /api/ai/*` - AI features (Gemini)
- `GET/POST /api/notifications/*` - Email & notifications

---

## 🌐 Deployment

### Deployment ke Netlify

1. **Build Production**
   ```bash
   npm run build
   ```

2. **Connect ke Netlify**
   ```bash
   # Via CLI
   npm install -g netlify-cli
   netlify deploy
   
   # Atau connect repository di Netlify dashboard
   ```

3. **Environment Variables**
   - Set di Netlify dashboard → Site settings → Build & deploy → Environment
   - Pastikan semua `.env` variables sudah dikonfigurasi

4. **Custom Domain**
   - Setup custom domain di Netlify dashboard
   - Configure DNS records

### Konfigurasi Netlify
- File: `netlify.toml`
- Build command: `next build`
- Publish directory: `.next`
- Node version: 18+ (set di netlify.toml)

### Monitoring & Logging
- Monitor performance di Netlify dashboard
- Check function logs untuk debugging
- Setup error tracking dengan Sentry (optional)

---

## 🔒 Security Best Practices

1. **Authentication & Authorization**
   - JWT tokens dengan secure expiration
   - Refresh token rotation
   - Role-based access control (RBAC)
   - API key validation

2. **Data Protection**
   - Row Level Security (RLS) di database
   - Encryption untuk sensitive data
   - Secure headers configuration
   - CORS policy setup

3. **Payment Security**
   - PCI compliance untuk payment processing
   - Tokenization untuk credit cards
   - SSL/TLS encryption
   - Server-side validation

4. **API Security**
   - Rate limiting untuk DDoS protection
   - Input validation dan sanitization
   - SQL injection prevention
   - XSS protection

5. **Regular Maintenance**
   - Keep dependencies updated
   - Security patches prioritized
   - Regular security audits
   - Monitoring suspicious activities

---

## 🐛 Troubleshooting

### Masalah Umum

**1. Build Error: TypeScript issues**
```bash
npm run lint
# Fix errors manually atau
npm run build -- --verbose
```

**2. Database Connection Error**
- Verify Supabase credentials di `.env.local`
- Check network connectivity
- Confirm RLS policies tidak blocking access

**3. Payment Gateway Error**
- Verify API keys
- Check payment provider status
- Review transaction logs

**4. Video Not Loading**
- Confirm video provider (YouTube/Vimeo) accessible
- Check Supabase Storage permissions
- Verify remote image patterns di next.config.ts

**5. Certificate Generation Fails**
- Check html2canvas dependency
- Verify PDF library versions
- Review file storage permissions

---

## 📝 Development Guidelines

### Code Style
- Use TypeScript untuk type safety
- Follow ESLint rules
- Component naming: PascalCase
- Function naming: camelCase
- Constants: UPPER_SNAKE_CASE

### Component Structure
```tsx
// Good example
'use client'; // Mark client components

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ComponentProps {
  userId: string;
  onSuccess?: () => void;
}

export default function MyComponent({ userId, onSuccess }: ComponentProps) {
  const [loading, setLoading] = useState(false);

  // ... component logic

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Form Handling
- Use React hooks untuk form state
- Validate input client-side dan server-side
- Show loading states during submission
- Handle errors gracefully

### Database Queries
- Use Supabase client methods
- Always verify RLS policies
- Implement error handling
- Cache queries when appropriate

### API Development
- Use Next.js API Routes
- Implement request validation
- Return consistent response format
- Add proper error codes

---

## 🤝 Kontribusi

Kami welcome kontribusi dari developer komunitas!

### Proses Kontribusi
1. Fork repository
2. Buat feature branch: `git checkout -b feature/nama-fitur`
3. Commit changes: `git commit -m 'Add: deskripsi fitur'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buka Pull Request dengan deskripsi lengkap

### Commit Message Guidelines
```
Format: [TYPE]: [DESCRIPTION]

Types:
- feat: Feature baru
- fix: Bug fixes
- docs: Documentation changes
- style: Code style (formatting)
- refactor: Code refactoring
- perf: Performance improvements
- test: Test additions
- chore: Build/dependency updates

Contoh:
- feat: Add email verification system
- fix: Fix certificate generation timeout
- docs: Update API documentation
```

---

## 📞 Support & Contact

- **Email**: support@mylearning.id
- **Discord**: [Join Community](https://discord.gg/mylearning)
- **Issues**: [GitHub Issues](https://github.com/mylearning/issues)
- **Documentation**: [Docs Site](https://docs.mylearning.id)

---

## 📄 Lisensi

Project ini dilindungi di bawah lisensi proprietary. Untuk informasi lebih lanjut, lihat file LICENSE.

---

## 🎯 Roadmap

### Q2 2026
- [ ] Mobile app (iOS & Android)
- [ ] Advanced AI-powered recommendations
- [ ] Live marketplace untuk resource
- [ ] Peer-to-peer tutoring platform

### Q3 2026
- [ ] Blockchain certificates
- [ ] Advanced analytics dashboard
- [ ] Corporate training packages
- [ ] Multi-language support

### Q4 2026
- [ ] AI tutor assistant
- [ ] Gamification features
- [ ] API marketplace
- [ ] White-label solutions

---

## 👥 Team

MyLearning dikembangkan oleh tim dedicated yang passionate tentang education technology.

**Untuk informasi lebih detail tentang tim, hubungi support.**

---

**Last Updated**: April 2026

**Version**: 0.1.0

Terima kasih telah menggunakan MyLearning! 🎓
