import { supabase } from "./supabase";

export interface LessonNote {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  video_timestamp: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch notes for a specific lesson
 */
export async function getLessonNotes(userId: string, lessonId: string): Promise<LessonNote[]> {
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('video_timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return data;
}

/**
 * Save a new note
 */
export async function saveLessonNote(note: {
  userId: string;
  lessonId: string;
  content: string;
  videoTimestamp: number;
}) {
  const { data, error } = await supabase
    .from('lesson_notes')
    .insert({
      user_id: note.userId,
      lesson_id: note.lessonId,
      content: note.content,
      video_timestamp: note.videoTimestamp
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving note:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

/**
 * Delete a note
 */
export async function deleteLessonNote(noteId: string, userId: string) {
  const { error } = await supabase
    .from('lesson_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting note:', error);
    return { success: false, error };
  }

  return { success: true };
}

/**
 * Format seconds to MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
