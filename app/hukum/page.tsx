import { Metadata } from "next";
import HukumClient from "./HukumClient";

export const metadata: Metadata = {
  title: "Kepatuhan Hukum & Standar Privasi | MyLearning",
  description: "Pelajari rincian kepatuhan hukum MyLearning terhadap UU PDP, GDPR, CCPA, dan standar internasional lainnya untuk menjamin keamanan data Anda.",
  alternates: {
    canonical: "/hukum",
  },
};

export default function HukumPage() {
  return <HukumClient />;
}
