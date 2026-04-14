"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LiveCS from "./LiveCS";
import AnnouncementBar from "./AnnouncementBar";
import StickyBottomAd from "./StickyBottomAd";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <>
        <AnnouncementBar />
        <div className="flex flex-col min-h-screen">
            {children}
        </div>
        <LiveCS />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <LiveCS />
      <StickyBottomAd />
    </div>
  );
}
