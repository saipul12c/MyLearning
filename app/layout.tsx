import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import LayoutWrapper from "./components/LayoutWrapper";
import ClientInitializer from "./components/ClientInitializer";
import { getPromotionsBatch } from "@/lib/promotions";

// Disabling next/font/google due to build-time connection issues.
// Font is now handled in globals.css via standard @import or system fallback.
const inter = {
  variable: "--font-inter",
};

export const metadata: Metadata = {
  title: {
    default: "MyLearning - Platform Belajar Online Terbaik di Indonesia",
    template: "%s | MyLearning",
  },
  description:
    "Pelajari skill digital dari instruktur terbaik. Kursus pemrograman, data science, desain, bisnis, dan lebih banyak lagi. Mulai belajar gratis hari ini!",
  keywords: [
    "belajar online",
    "kursus online",
    "belajar programming",
    "kursus web development",
    "belajar data science",
    "kursus Indonesia",
  ],
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

  return (
    <html lang="id" className={`${inter.variable} antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <ClientInitializer />
          <LayoutWrapper 
            globalPromos={globalPromos} 
            stickyPromo={stickyPromo} 
            footerPromo={footerPromo}
          >
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
