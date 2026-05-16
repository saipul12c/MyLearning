import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourseBySlug } from "@/lib/courses";
import CourseDetailClient from "./CourseDetailClient";
import JsonLd from "../../components/JsonLd";

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
    description: course.description,
    alternates: {
      canonical: `/courses/${slug}`,
    },
    openGraph: {
      title: `${course.title} | MyLearning`,
      description: course.description,
      images: course.thumbnail ? [{ url: course.thumbnail }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title} | MyLearning`,
      description: course.description,
      images: course.thumbnail ? [course.thumbnail] : [],
    }
  };
}

export default async function CourseDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "MyLearning",
      "sameAs": "https://my-learning-projek.netlify.app"
    },
    "image": course.thumbnail,
    "offers": {
      "@type": "Offer",
      "price": course.discountPrice || course.price,
      "priceCurrency": "IDR",
      "availability": "https://schema.org/InStock",
      "url": `https://my-learning-projek.netlify.app/courses/${course.slug}`
    },
    "aggregateRating": course.totalReviews > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": course.rating,
      "reviewCount": course.totalReviews,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "courseWorkload": `PT${course.durationHours}H`
    }
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://my-learning-projek.netlify.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Courses",
        "item": "https://my-learning-projek.netlify.app/courses"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": course.title,
        "item": `https://my-learning-projek.netlify.app/courses/${course.slug}`
      }
    ]
  };

  return (
    <>
      <JsonLd data={courseLd} />
      <JsonLd data={breadcrumbLd} />
      <CourseDetailClient course={course} />
    </>
  );
}
