import { getEventBySlug } from "@/lib/events";
import { getPromotionsBatch } from "@/lib/promotions";
import EventDetailClient from "./EventDetailClient";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface EventDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Tidak Ditemukan" };

  return {
    title: `${event.title} | MyLearning Events`,
    description: event.shortDescription,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const [event, adBatch] = await Promise.all([
    getEventBySlug(slug),
    getPromotionsBatch(["event_detail_inline", "event_sidebar"]),
  ]);

  if (!event) {
    notFound();
  }

  const inlinePromo = adBatch["event_detail_inline"]?.[0] || null;
  const sidebarPromo = adBatch["event_sidebar"]?.[0] || null;

  return (
    <EventDetailClient 
      initialEvent={event} 
      initialInlinePromo={inlinePromo} 
      initialSidebarPromo={sidebarPromo} 
    />
  );
}
