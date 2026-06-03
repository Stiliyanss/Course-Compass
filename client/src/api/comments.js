import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all comments for a specific material.
 * Joins the user's profile to get their name and avatar.
 */
export async function fetchComments(materialId) {
  const { data, error } = await supabase
    .from('material_comments')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Fetch user profiles for all commenters
  const userIds = [...new Set(data.map((c) => c.user_id))];
  let users = [];
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .in('id', userIds);
    users = profiles || [];
  }

  return data.map((comment) => ({
    ...comment,
    user: users.find((u) => u.id === comment.user_id) || null,
  }));
}

/**
 * Create a new comment on a material.
 */
export async function createComment({ materialId, content }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('material_comments')
    .insert({
      material_id: materialId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a comment by ID.
 */
export async function deleteComment(id) {
  const { error } = await supabase
    .from('material_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
