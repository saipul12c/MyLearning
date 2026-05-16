import { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: "Punya pertanyaan, masukan, atau butuh bantuan? Tim kami siap membantu Anda. Kirimkan pesan dan kami akan merespons secepat mungkin.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
