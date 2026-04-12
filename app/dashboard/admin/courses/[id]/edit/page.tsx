"use client";

import CourseForm from "@/app/components/admin/CourseForm";
import { useParams } from "next/navigation";

export default function EditCoursePage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="py-6">
      <CourseForm courseId={id} />
    </div>
  );
}
