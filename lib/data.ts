/**
 * MyLearning Data Models & Types
 * 
 * NOTE: As of the technical audit, all static data has been moved to Supabase.
 * This file now only contains types and basic utility functions used by the frontend.
 */

import { formatPrice as utilsFormatPrice, formatNumber as utilsFormatNumber } from "./utils";

// Standard formatting utility
export const formatPrice = utilsFormatPrice;
export const formatNumber = utilsFormatNumber;

// --- Interfaces ---

export interface Category {
  name: string;
  slug: string;
  icon?: any;
  courseCount?: number;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  expertise: string;
  bio: string;
  rating: number;
  totalStudents: number;
  qrisUrl?: string; // Specific QRIS payment address
  websiteUrl?: string;
  linkedinUrl?: string;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
  description?: string;
  videoUrl?: string;
  isCompleted?: boolean; // From student progress
}

export type CourseLevel = "Starter" | "Accelerator" | "Mastery";

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  detailedDescription?: string;
  thumbnail: string;
  price: number;
  discountPrice?: number;
  category: string;
  categorySlug: string;
  instructor: string;
  instructorId: string;
  instructorAvatar: string;
  instructorQrisUrl?: string;
  instructorWebsite?: string;
  instructorLinkedin?: string;
  level: CourseLevel;
  language: string;
  durationHours: number;
  totalLessons: number;
  rating: number;
  totalReviews: number;
  totalStudents: number;
  isPublished: boolean;
  isFeatured: boolean;
  updatedAt: string;
  learningPoints: string[];
  requirements: string[];
  lessons?: Lesson[];
}

/**
 * Empty placeholders for compatibility. 
 * Real data is now fetched via lib/courses.ts
 */
export const categories: Category[] = [];
export const instructors: Instructor[] = [];
export const courses: Course[] = [];

// Helper functions that now return empty or simple logic (Legacy Compatibility)
export const getCourses = () => [];
export const getCourseBySlug = (slug: string) => null;
export const getInstructorById = (id: string) => null;
export const getCoursesByCategory = (categorySlug: string) => [];
export const searchCourses = (query: string) => [];
export const getCourseLiveStats = (slug: string) => ({ rating: 4.8, students: 2500 });
