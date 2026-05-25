import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all reviews for a course, with student profile info.
 */
export async function fetchCourseReviews(courseId) {
  const { data, error } = await supabase
    .from('course_reviews')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fetch student profiles
  const studentIds = [...new Set(data.map((r) => r.student_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', studentIds);

  return data.map((review) => {
    const profile = profiles?.find((p) => p.id === review.student_id);
    return {
      ...review,
      student_name: profile?.full_name || 'Unknown',
      student_avatar: profile?.avatar_url || null,
    };
  });
}

/**
 * Fetch the current user's review for a course (if exists).
 */
export async function fetchMyReview(courseId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('course_reviews')
    .select('*')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new review.
 */
export async function createReview({ courseId, rating, comment }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('course_reviews')
    .insert({
      course_id: courseId,
      student_id: user.id,
      rating,
      comment,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing review.
 */
export async function updateReview({ reviewId, rating, comment }) {
  const { data, error } = await supabase
    .from('course_reviews')
    .update({ rating, comment, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a review.
 */
export async function deleteReview(reviewId) {
  const { error } = await supabase
    .from('course_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}
