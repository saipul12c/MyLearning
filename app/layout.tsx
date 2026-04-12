import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import LayoutWrapper from "./components/LayoutWrapper";
import ClientInitializer from "./components/ClientInitializer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <ClientInitializer />
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
