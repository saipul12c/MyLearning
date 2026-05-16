import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import LayoutWrapper from "./components/LayoutWrapper";
import ClientInitializer from "./components/ClientInitializer";
import NotificationToast from "./components/NotificationToast";
import SentinelGuard from "./components/SentinelGuard";
import SentinelBroadcaster from "./components/SentinelBroadcaster";
import { getPromotionsBatch } from "@/lib/promotions";
import JsonLd from "./components/JsonLd";

// Disabling next/font/google due to build-time connection issues.
// Font is now handled in globals.css via standard @import or system fallback.
const inter = {
  variable: "--font-inter",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://my-learning-projek.netlify.app"),
  title: {
    default: "MyLearning - Platform Belajar Online Terbaik di Indonesia",
    template: "%s | MyLearning",
  },
  description:
    "Pelajari skill digital dari instruktur terbaik. Kursus pemrograman, data science, desain, bisnis, dan lebih banyak lagi. Mulai belajar gratis hari ini!",
  alternates: {
    canonical: "./",
  },
  keywords: [
    "belajar online",
    "kursus online",
    "belajar programming",
    "kursus web development",
    "belajar data science",
    "kursus Indonesia",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://my-learning-projek.netlify.app",
    siteName: "MyLearning",
    title: "MyLearning - Platform Belajar Online Terbaik di Indonesia",
    description: "Pelajari skill digital dari instruktur terbaik. Mulai belajar gratis hari ini!",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "MyLearning Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyLearning - Platform Belajar Online Terbaik di Indonesia",
    description: "Pelajari skill digital dari instruktur terbaik. Mulai belajar gratis hari ini!",
    images: ["/logo.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adBatch = await getPromotionsBatch(["global_announcement", "sticky_bottom", "footer_native"]);
  const globalPromos = adBatch["global_announcement"] || [];
  const stickyPromo = adBatch["sticky_bottom"]?.[0] || null;
  const footerPromo = adBatch["footer_native"]?.[0] || null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyLearning",
    "url": "https://my-learning-projek.netlify.app",
    "logo": "https://my-learning-projek.netlify.app/logo.png",
    "sameAs": [
      "https://twitter.com/mylearning",
      "https://facebook.com/mylearning",
      "https://instagram.com/mylearning"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+62-821-1234-5678",
      "contactType": "customer service",
      "areaServed": "ID",
      "availableLanguage": "Indonesian"
    }
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MyLearning",
    "url": "https://my-learning-projek.netlify.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://my-learning-projek.netlify.app/courses?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="id" className={`${inter.variable} antialiased`} data-scroll-behavior="smooth">
      <head>
        <JsonLd data={jsonLd} />
        <JsonLd data={websiteLd} />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <NotificationToast />
          <ClientInitializer />
          <SentinelBroadcaster />
          <SentinelGuard>
            <LayoutWrapper
              globalPromos={globalPromos}
              stickyPromo={stickyPromo}
              footerPromo={footerPromo}
            >
              {children}
            </LayoutWrapper>
          </SentinelGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
