import { getPromotionsBatch } from "@/lib/promotions";
import UserEventsClient from "./UserEventsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Saya | MyLearning Dashboard",
  description: "Kelola tiket event, webinar, dan kompetisi yang Anda ikuti.",
};

export default async function UserEventsPage() {
  const adBatch = await getPromotionsBatch(["dashboard_card"]);
  const dashboardPromo = adBatch["dashboard_card"]?.[0] || null;

  return <UserEventsClient initialDashboardPromo={dashboardPromo} />;
}
