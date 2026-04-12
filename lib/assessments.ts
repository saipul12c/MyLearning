/**
 * MyLearning Assessments System
 * 
 * NOTE: As of the technical audit, all static assessment data has been moved to Supabase.
 */

import { supabase } from "./supabase";

export type AssessmentType = "quiz" | "assignment" | "final_project";

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string | number;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  isRequired?: boolean;
}

export interface Assignment {
  id: string | number;
  title: string;
  description: string;
  instructions: string;
  questions: string[];
  correctAnswers: string[];
}

export interface FinalProject {
  title: string;
  description: string;
  objectives: string[];
  deliverables: string[];
  evaluationCriteria: string[];
  estimatedHours: number;
}

export interface CourseAssessments {
  quizzes: Quiz[];
  assignments: Assignment[];
  finalProject?: FinalProject;
}

/**
 * Dynamic fetch functions below replace the old static data.
 */

/**
 * Fetch assessments for a specific course dynamically from Supabase
 */
export async function getCourseAssessments(courseSlug: string): Promise<CourseAssessments | null> {
  try {
    // 1. Get Course ID
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();
    
    if (!course) return null;

    // 2. Fetch Assessment Definitions
    const { data: defs, error: defError } = await supabase
      .from("assessment_definitions")
      .select(`
        id, title, description, assessment_type, passing_score, 
        instructions, questions_list, correct_answers_list, 
        objectives, deliverables, evaluation_criteria, estimated_hours,
        max_attempts, is_required, time_limit_minutes
      `)
      .eq("course_id", course.id);

    if (defError || !defs) return null;

    // 3. Fetch Quiz Questions for all found quizzes
    const quizIds = defs.filter(d => d.assessment_type === 'quiz').map(d => d.id);
    let quizQuestions: any[] = [];
    
    if (quizIds.length > 0) {
      const { data: qData } = await supabase
        .from("assessment_questions")
        .select("*")
        .in("assessment_id", quizIds)
        .order("order_index", { ascending: true });
      quizQuestions = qData || [];
    }

    // 4. Map DB records to CourseAssessments interface
    const assessments: CourseAssessments = {
      quizzes: [],
      assignments: [],
    };

    defs.forEach(def => {
      if (def.assessment_type === 'quiz') {
        assessments.quizzes.push({
          id: def.id,
          title: def.title,
          description: def.description,
          passingScore: def.passing_score,
          timeLimitMinutes: def.time_limit_minutes,
          maxAttempts: def.max_attempts,
          isRequired: def.is_required,
          questions: quizQuestions
            .filter(q => q.assessment_id === def.id)
            .map(q => ({
              id: q.id,
              question: q.question_text,
              options: q.options,
              correctAnswer: Number(q.correct_answer_index),
              explanation: q.explanation
            }))
        });
      } else if (def.assessment_type === 'assignment') {
        assessments.assignments.push({
          id: def.id,
          title: def.title,
          description: def.description,
          instructions: def.instructions,
          questions: def.questions_list || [],
          correctAnswers: def.correct_answers_list || []
        });
      } else if (def.assessment_type === 'final_project') {
        assessments.finalProject = {
          title: def.title,
          description: def.description,
          objectives: def.objectives || [],
          deliverables: def.deliverables || [],
          evaluationCriteria: def.evaluation_criteria || [],
          estimatedHours: def.estimated_hours || 0
        };
      }
    });

    return assessments;
  } catch (err) {
    console.error(`Error fetching assessments for ${courseSlug}:`, err);
    return null;
  }
}

/**
 * Legacy Helper for Enrollment calculations
 */
export async function getTotalAssessmentItems(slug: string) {
  const assessments = await getCourseAssessments(slug);
  if (!assessments) return { totalLessons: 0, totalQuizzes: 0, totalAssignments: 0, hasFinalProject: false, totalItems: 0 };
  
  const totalQuizzes = assessments.quizzes.length;
  const totalAssignments = assessments.assignments.length;
  const hasFinalProject = !!assessments.finalProject;
  
  return { 
    totalLessons: 0, 
    totalQuizzes, 
    totalAssignments, 
    hasFinalProject, 
    totalItems: totalQuizzes + totalAssignments + (hasFinalProject ? 1 : 0) 
  };
}

/**
 * Admin CRUD Functions
 */

export async function upsertAssessment(assessmentData: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    // Authorization check
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== 'admin') throw new Error("Forbidden");

    const payload = {
      course_id: assessmentData.course_id,
      assessment_type: assessmentData.assessment_type,
      title: assessmentData.title,
      description: assessmentData.description,
      passing_score: assessmentData.passing_score || 70,
      time_estimate_minutes: assessmentData.time_estimate_minutes || 15,
      order_index: assessmentData.order_index || 0,
      slug: assessmentData.slug || `ass-${Date.now()}`,
      instructions: assessmentData.instructions || null,
      questions_list: assessmentData.questions_list || [],
      correct_answers_list: assessmentData.correct_answers_list || [],
      objectives: assessmentData.objectives || [],
      deliverables: assessmentData.deliverables || [],
      evaluation_criteria: assessmentData.evaluation_criteria || [],
      estimated_hours: assessmentData.estimated_hours || 0,
      max_attempts: assessmentData.max_attempts || 0,
      is_required: assessmentData.is_required !== undefined ? assessmentData.is_required : true,
      time_limit_minutes: assessmentData.time_limit_minutes || 0
    };

    const { data, error } = await supabase
      .from("assessment_definitions")
      .upsert(assessmentData.id ? { id: assessmentData.id, ...payload } : payload)
      .select()
      .single();

    return { success: !error, data, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function deleteAssessment(id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    const { error } = await supabase.from("assessment_definitions").delete().eq("id", id);
    return { success: !error, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function upsertQuizQuestion(questionData: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const payload = {
      assessment_id: questionData.assessment_id,
      question_text: questionData.question_text,
      type: questionData.type || 'multiple_choice',
      options: questionData.options || [],
      correct_answer_index: String(questionData.correct_answer_index),
      explanation: questionData.explanation,
      hint: questionData.hint,
      points: questionData.points || 1,
      order_index: questionData.order_index || 0
    };

    const { data, error } = await supabase
      .from("assessment_questions")
      .upsert(questionData.id ? { id: questionData.id, ...payload } : payload)
      .select()
      .single();

    return { success: !error, data, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function deleteQuizQuestion(id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    const { error } = await supabase.from("assessment_questions").delete().eq("id", id);
    return { success: !error, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
