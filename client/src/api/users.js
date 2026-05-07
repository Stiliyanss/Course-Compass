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
  // Step 1: Update the user's role
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Step 2: If demoting to student, mark their approved application as 'revoked'
  // so they see a "Your status was revoked" message and can reapply.
  if (role === 'student') {
    await supabase
      .from('instructor_applications')
      .update({ status: 'revoked', reviewed_at: new Date().toISOString() })
      .eq('user_id', id)
      .eq('status', 'approved');
  }

  return data;
}

/**
 * Upload an avatar image and update the user's profile.
 *
 * How it works:
 * 1. Get the current user's ID
 * 2. Upload the file to Supabase Storage in the 'avatars' bucket
 *    - File path: {userId}.{extension}
 *    - Using the userId as filename means each user has one file
 *      that gets overwritten on re-upload (no orphaned files)
 * 3. Get the public URL for the uploaded file
 * 4. Update the user's profile with the new avatar_url
 *
 * @param {File} file — the image file from an <input type="file">
 */
export async function uploadAvatar(file) {
  const { data: { user } } = await supabase.auth.getUser();

  // Get file extension (e.g. "png" from "photo.png")
  const ext = file.name.split('.').pop();
  // Path in the bucket — one file per user, always overwritten
  const filePath = `${user.id}.${ext}`;

  // Step 1: Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true, // overwrite if file already exists
    });

  if (uploadError) throw uploadError;

  // Step 2: Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Step 3: Add a cache-busting timestamp so the browser
  // doesn't show the old cached image after re-upload
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  // Step 4: Update the profile row
  const { data, error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return data;
}
