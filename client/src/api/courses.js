import { supabase } from '../lib/supabaseClient';

/**
 * Fetch published courses, optionally filtered by search term.
 * Joins the instructor's profile to get their name.
 */
export async function fetchCourses(filters = {}) {
  let query = supabase
    .from('courses')
    .select('*, instructor:profiles(id, full_name, avatar_url)')       
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch a single course by its ID.
 * Includes the instructor's profile info.
 */
export async function fetchCourseById(id) {
  const { data, error } = await supabase
    .from('courses')
    .select('*, instructor:profiles(id, full_name, avatar_url, bio)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all courses belonging to the currently logged-in instructor.
 *
 * Unlike fetchCourses() which only returns published courses for the catalog,
 * this returns ALL statuses (draft, published, archived) so the instructor
 * can manage their full course list.
 *
 * The RLS policy on courses has this SELECT condition:
 *   status = 'published' OR instructor_id = auth.uid() OR get_user_role() = 'admin'
 * The "instructor_id = auth.uid()" part is what lets instructors see their own
 * drafts and archived courses — not just published ones.
 */
export async function fetchInstructorCourses() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
