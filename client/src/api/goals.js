import { supabase } from '../lib/supabaseClient';

/**
 * Fetch the student's learning goal.
 * Returns the goal row or null if none set.
 */
export async function fetchGoal() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('learning_goals')
    .select('*')
    .eq('student_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create or update the student's weekly materials target.
 */
export async function upsertGoal(weeklyMaterialsTarget) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('learning_goals')
    .upsert(
      {
        student_id: user.id,
        weekly_materials_target: weeklyMaterialsTarget,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
