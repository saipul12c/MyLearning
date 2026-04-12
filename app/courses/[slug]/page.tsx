import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourseBySlug } from "@/lib/courses";
import CourseDetailClient from "./CourseDetailClient";

export const dynamic = 'force-dynamic';

// Removed generateStaticParams for dynamic DB fetching
/*
export async function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}
*/

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Kursus Tidak Ditemukan" };
  return { 
    title: `${course.title} | MyLearning`, 
    description: course.description 
  };
}

export default async function CourseDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  return <CourseDetailClient course={course} />;
}
