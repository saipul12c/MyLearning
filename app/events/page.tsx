import { getPromotionsBatch } from "@/lib/promotions";
import { getEvents } from "@/lib/events";
import EventsGalleryClient from "./EventsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Event & Webinar | MyLearning",
  description: "Ikuti berbagai webinar, workshop, dan talkshow bersama para expert di bidang teknologi.",
};

export default async function EventsGalleryPage() {
  const [adBatch, events] = await Promise.all([
    getPromotionsBatch(["event_listing", "all"]),
    getEvents()
  ]);
  
  const listingPromo = adBatch["event_listing"]?.[0] || null;
  const featuredPromo = adBatch["all"]?.[0] || null; // 'all' location usually returns featured ads

  return (
    <EventsGalleryClient 
      initialEvents={events.data}
      initialListingPromo={listingPromo} 
      initialFeaturedPromo={featuredPromo} 
    />
  );
}
