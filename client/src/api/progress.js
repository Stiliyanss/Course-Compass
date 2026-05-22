import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all completed material IDs for the current student in a course.
 *
 * Returns a Set of material IDs that the student has marked as completed.
 * Using a Set makes lookup fast: completedSet.has(materialId) → true/false
 */
export async function fetchProgress(courseId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('material_progress')
    .select('material_id')
    .eq('student_id', user.id)
    .eq('course_id', courseId);

  if (error) throw error;

  return new Set(data.map((row) => row.material_id));
}

/**
 * Toggle a material's completion status.
 *
 * If completed = true → INSERT a row (mark as done)
 * If completed = false → DELETE the row (unmark)
 */
export async function toggleMaterialProgress(courseId, materialId, completed) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (completed) {
    // Mark as completed — insert a row
    const { error } = await supabase
      .from('material_progress')
      .upsert(
        {
          student_id: user.id,
          course_id: courseId,
          material_id: materialId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,material_id' }
      );

    if (error) throw error;
  } else {
    // Unmark — delete the row
    const { error } = await supabase
      .from('material_progress')
      .delete()
      .eq('student_id', user.id)
      .eq('material_id', materialId);

    if (error) throw error;
  }
}
