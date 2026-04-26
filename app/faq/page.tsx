import { getPromotionsBatch } from "@/lib/promotions";
import FaqClient from "./FaqClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pusat Bantuan & FAQ | MyLearning",
  description: "Cari jawaban cepat melalui pusat bantuan kami atau gunakan asisten cerdas kami untuk bantuan instan.",
};

export default async function FAQPage() {
  const adBatch = await getPromotionsBatch(["search_recovery"]);
  const searchRecoveryPromo = adBatch["search_recovery"]?.[0] || null;

  return <FaqClient initialSearchRecoveryPromo={searchRecoveryPromo} />;
}
