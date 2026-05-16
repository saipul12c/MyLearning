import { Metadata } from "next";
import SentinelAIClient from "./SentinelAIClient";

export const metadata: Metadata = {
  title: "Sentinel AI Assistant | Asisten Belajar Cerdas Anda",
  description: "Kenali Sentinel AI Assistant, kecerdasan buatan canggih yang siap membantu Anda belajar lebih cepat, menjawab pertanyaan teknis, dan memberikan dukungan 24/7 di MyLearning.",
  alternates: {
    canonical: "/sentinel-ai",
  },
  openGraph: {
    title: "Sentinel AI Assistant - Personalized Learning Intelligence",
    description: "Tingkatkan pengalaman belajar Anda dengan dukungan AI Assistant yang cerdas, aman, dan responsif.",
    images: ["/logo.png"],
  }
};

export default function SentinelAIPage() {
  return <SentinelAIClient />;
}
