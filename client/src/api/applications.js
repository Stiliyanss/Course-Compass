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

/**
 * Delete the current user's application (e.g. after rejection).
 * Allows the user to submit a new application.
 */
export async function deleteMyApplication(id) {
  const { error } = await supabase
    .from('instructor_applications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Admin functions ──────────────────────────────────────────

/**
 * Fetch all instructor applications (admin only).
 * Joins the profiles table so we can show the applicant's name and email.
 * RLS policy "Admins can view all applications" ensures only admins can call this.
 */
export async function fetchAllApplications() {
  const { data, error } = await supabase
    .from('instructor_applications')
    .select('*, applicant:profiles(id, full_name, email)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Approve or reject an application (admin only).
 *
 * Two things happen:
 * 1. Update the application row — set status and reviewed_at timestamp
 * 2. If approved — update the user's profile role from 'student' to 'instructor'
 *
 * Both operations must succeed. If the role update fails,
 * we throw an error so the admin knows something went wrong.
 */
export async function reviewApplication(id, status) {
  // Step 1: Update the application status
  const { data: application, error: appError } = await supabase
    .from('instructor_applications')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, applicant:profiles(id, full_name, email)')
    .single();

  if (appError) throw appError;

  // Step 2: If approved, promote the user to instructor
  if (status === 'approved') {
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'instructor' })
      .eq('id', application.applicant.id);

    if (roleError) throw roleError;
  }

  return application;
}
