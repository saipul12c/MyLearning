import { getCourses, getCategories } from "@/lib/courses";
import { getActivePromotions } from "@/lib/promotions";
import CoursesClient from "./CoursesClient";

export const metadata = {
  title: "Kursus Online | MyLearning",
  description: "Jelajahi berbagai kursus online terbaik dari instruktur berpengalaman di MyLearning.",
};

export default async function CoursesPage(props: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await props.searchParams;

  // Fetch data directly in the Server Component
  const [initialCourses, initialCategories, listingPromos, spotlightPromos] = await Promise.all([
    getCourses(),
    getCategories(),
    getActivePromotions("course_listing", category),
    getActivePromotions("course_listing_spotlight", category)
  ]);

  return (
    <CoursesClient
      initialCourses={initialCourses}
      initialCategories={initialCategories}
      initialCategory={category}
      promotions={listingPromos}
      spotlightPromo={spotlightPromos[0]}
    />
  );
}
