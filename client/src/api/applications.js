import { supabase } from '../lib/supabaseClient';

/**
 * Submit an instructor application.
 * The user_id is set to the currently logged-in user.
 * RLS ensures users can only insert their own applications.
 */
export async function submitApplication({ bio, expertise, course_topics }) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('instructor_applications')
    .insert({
      user_id: user.id,
      bio,
      expertise,
      course_topics,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch the current user's application (if any).
 * Returns null if no application exists.
 */
export async function fetchMyApplication() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('instructor_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
