import { Metadata } from "next";
import SecurityClient from "./SecurityClient";

export const metadata: Metadata = {
  title: "Sentinel Gatekeeper | Keamanan Platform MyLearning",
  description: "Pelajari protokol keamanan Sentinel Gatekeeper yang menjaga data dan privasi Anda dengan enkripsi berlapis dan monitoring real-time.",
  alternates: {
    canonical: "/security",
  },
  openGraph: {
    title: "Sentinel Gatekeeper - Advanced Security Protocol",
    description: "Military-grade encryption and real-time threat monitoring for your learning data.",
    images: ["/logo.png"],
  }
};

export default function SecurityPage() {
  return <SecurityClient />;
}
