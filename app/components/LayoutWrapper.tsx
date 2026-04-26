"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LiveCS from "./LiveCS";
import AnnouncementBar from "./AnnouncementBar";
import StickyBottomAd from "./StickyBottomAd";

import { type Promotion } from "@/lib/promotions";

interface LayoutWrapperProps {
  children: React.ReactNode;
  globalPromos?: Promotion[];
  stickyPromo?: Promotion | null;
  footerPromo?: Promotion | null;
}

export default function LayoutWrapper({ children, globalPromos = [], stickyPromo = null, footerPromo = null }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <>
        <AnnouncementBar initialPromos={globalPromos} />
        <div className="flex flex-col min-h-screen">
            {children}
        </div>
        <LiveCS />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar initialPromos={globalPromos} />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer initialPromo={footerPromo} />
      <LiveCS />
      <StickyBottomAd initialPromo={stickyPromo} />
    </div>
  );
}
