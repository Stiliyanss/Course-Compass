import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all user profiles (admin only).
 * RLS policy "Anyone can view profiles" allows SELECT,
 * but this function is only used in the admin panel.
 * Orders by creation date, newest first.
 */
export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update a user's role (admin only).
 * Used to demote an instructor back to student.
 * RLS policy "Admins can update all profiles" allows this.
 *
 * @param {string} id   — the user's profile ID
 * @param {string} role — the new role ('student', 'instructor', or 'admin')
 */
export async function updateUserRole(id, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
