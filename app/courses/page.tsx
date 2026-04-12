import { getCourses, getCategories } from "@/lib/courses";
import CoursesClient from "./CoursesClient";

export const metadata = {
  title: "Kursus Online | MyLearning",
  description: "Jelajahi berbagai kursus online terbaik dari instruktur berpengalaman di MyLearning.",
};

export default async function CoursesPage(props: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await props.searchParams;
  
  // Fetch data directly in the Server Component
  const [initialCourses, initialCategories] = await Promise.all([
    getCourses(),
    getCategories()
  ]);

  return (
    <CoursesClient 
      initialCourses={initialCourses} 
      initialCategories={initialCategories} 
      initialCategory={category}
    />
  );
}
