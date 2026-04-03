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
