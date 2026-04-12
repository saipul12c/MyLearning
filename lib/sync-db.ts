import { supabase } from "./supabase";
import { categories, instructors, courses } from "./data";
import { courseAssessments } from "./assessments";

/**
 * Fungsi untuk mensinkronisasi data statis dari lib/data.ts ke Database Supabase.
 * Berguna untuk inisialisasi awal atau update massal metadata.
 */
export async function syncDataToDatabase() {
  console.log("Starting data sync...");

  try {
    // 1. Sync Categories
    for (const cat of categories) {
      if (cat.slug === "all") continue;
      const { error } = await supabase.from("categories").upsert({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
      }, { onConflict: 'slug' });
      if (error) console.error(`Error syncing category ${cat.name}:`, error.message);
    }

    // 2. Sync Instructors
    for (const inst of instructors) {
      const { error } = await supabase.from("instructors").upsert({
        name: inst.name,
        slug: inst.id, // Using instructor_001 etc as slug for compatibility
        bio: inst.bio,
        avatar_url: inst.avatar,
        expertise: inst.expertise,
        rating: inst.rating,
        total_students: inst.totalStudents,
        qris_url: inst.qrisUrl,
        website_url: inst.websiteUrl,
        linkedin_url: inst.linkedinUrl
      }, { onConflict: 'slug' });
      if (error) console.error(`Error syncing instructor ${inst.name}:`, error.message);
    }

    // 3. Sync Courses
    const { data: dbCategories } = await supabase.from("categories").select("id, slug");
    const { data: dbInstructors } = await supabase.from("instructors").select("id, slug");

    for (const course of courses) {
      const categoryId = dbCategories?.find(c => c.slug === course.categorySlug)?.id;
      const instructorId = dbInstructors?.find(i => i.slug === course.instructorId)?.id;

      if (!categoryId || !instructorId) {
        console.warn(`Skipping course ${course.title} due to missing category or instructor.`);
        continue;
      }

      const { data: syncedCourse, error: courseError } = await supabase.from("courses").upsert({
        title: course.title,
        slug: course.slug,
        description: course.detailedDescription || course.description,
        short_description: course.description,
        thumbnail_url: course.thumbnail,
        price: course.price,
        discount_price: course.discountPrice,
        category_id: categoryId,
        instructor_id: instructorId,
        level: course.level,
        language: course.language,
        duration_hours: course.durationHours,
        total_lessons: course.totalLessons,
        rating: course.rating,
        total_reviews: course.totalReviews,
        total_students: course.totalStudents,
        is_published: course.isPublished,
        is_featured: course.isFeatured,
        learning_points: course.learningPoints,
        requirements: course.requirements
      }, { onConflict: 'slug' }).select("id").single();

      if (courseError) {
        console.error(`Error syncing course ${course.title}:`, courseError.message);
        continue;
      }

      // 3.1 Sync Lessons for this course
      if (syncedCourse && course.lessons) {
        for (let i = 0; i < course.lessons.length; i++) {
          const lesson = course.lessons[i];
          const { error: lessonError } = await supabase.from("lessons").upsert({
            course_id: syncedCourse.id,
            title: lesson.title,
            duration_minutes: lesson.durationMinutes,
            order_index: i,
            is_free_preview: lesson.isFreePreview,
            description: lesson.description || ""
          }, { onConflict: 'course_id,title' }); // Simple conflict resolution
          
          if (lessonError) console.error(`Error syncing lesson ${lesson.title}:`, lessonError.message);
        }
      }

      // 4. Sync Assessments (Quizzes & Assignments)
      const assessments = courseAssessments[course.slug];
      if (syncedCourse && assessments) {
        // Sync Quizzes
        for (const quiz of assessments.quizzes) {
          const { data: syncedQuiz, error: quizError } = await supabase.from("assessment_definitions").upsert({
            course_id: syncedCourse.id,
            assessment_type: 'quiz',
            title: quiz.title,
            description: quiz.description,
            passing_score: quiz.passingScore,
            time_estimate_minutes: (quiz as any).timeEstimateMinutes || 15,
            order_index: (quiz as any).orderInCourse || 0,
            slug: `quiz-${quiz.id}`
          }, { onConflict: 'course_id,assessment_type,slug' }).select("id").single();

          if (quizError) {
            console.error(`Error syncing quiz ${quiz.title}:`, quizError.message);
          } else if (syncedQuiz) {
            // Sync Quiz Questions
            for (let j = 0; j < quiz.questions.length; j++) {
              const q = quiz.questions[j];
              const { error: qError } = await supabase.from("assessment_questions").upsert({
                assessment_id: syncedQuiz.id,
                question_text: q.question,
                type: 'multiple_choice',
                options: q.options,
                correct_answer_index: String(q.correctAnswer),
                explanation: q.explanation,
                order_index: j
              });
              if (qError) console.error(`Error syncing quiz question ${q.id}:`, qError.message);
            }
          }
        }

        // Sync Assignments
        for (const ass of assessments.assignments) {
          const { data: syncedAss, error: assError } = await supabase.from("assessment_definitions").upsert({
            course_id: syncedCourse.id,
            assessment_type: 'assignment',
            title: ass.title,
            description: ass.description,
            time_estimate_minutes: (ass as any).timeEstimateMinutes || 30,
            order_index: (ass as any).orderInCourse || 0,
            slug: `assignment-${ass.id}`
          }, { onConflict: 'course_id,assessment_type,slug' }).select("id").single();

          if (assError) {
            console.error(`Error syncing assignment ${ass.title}:`, assError.message);
          } else if (syncedAss) {
            // Sync Assignment Tasks (Now simplified to questions list in DB if needed)
            const questions = (ass as any).questions || [];
            for (let j = 0; j < questions.length; j++) {
              const qText = questions[j];
              const { error: tError } = await supabase.from("assessment_questions").upsert({
                assessment_id: syncedAss.id,
                question_text: qText,
                type: 'short_answer',
                options: [],
                correct_answer_index: (ass as any).correctAnswers?.[j] || "",
                order_index: j
              });
              if (tError) console.error(`Error syncing assignment question ${j}:`, tError.message);
            }
          }
        }
      }
    }

    console.log("Data sync completed successfully!");
    return { success: true };
  } catch (err: any) {
    console.error("Sync failed:", err.message);
    return { success: false, error: err.message };
  }
}
