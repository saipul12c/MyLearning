"use client";

import PromotionRequestForm from "@/app/components/PromotionRequestForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getCourseById } from "@/lib/courses";
import { Course } from "@/lib/data";

export default function CreateAdPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get('mode');
  const courseIdParam = searchParams.get('courseId');
  const mode = modeParam === 'course' ? 'course' : 'custom';
  
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [loading, setLoading] = useState(!!courseIdParam);

  useEffect(() => {
    if (courseIdParam) {
      getCourseById(courseIdParam).then(c => {
        if (c) setCourse(c);
        setLoading(false);
      });
    }
  }, [courseIdParam]);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
           <ArrowLeft size={18} />
        </button>
        <div>
           <h1 className="text-2xl font-black text-white tracking-tight">Buat Kampanye Iklan</h1>
           <p className="text-slate-500 text-xs">Atur preferensi tayangan dan audiens promosi Anda</p>
        </div>
      </div>
      
      <PromotionRequestForm 
        mode={mode} 
        course={course}
        onClose={() => router.back()} 
      />
    </div>
  );
}
