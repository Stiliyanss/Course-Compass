import { supabase } from '../lib/supabaseClient';

/**
 * Toggle a course in the current user's wishlist.
 * If already wishlisted → removes it. If not → adds it.
 * Returns { wishlisted: boolean } with the new state.
 */
export async function toggleWishlist(courseId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already wishlisted
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return { wishlisted: false };
  } else {
    const { error } = await supabase
      .from('wishlists')
      .insert({ student_id: user.id, course_id: courseId });
    if (error) throw error;
    return { wishlisted: true };
  }
}

/**
 * Check if the current user has wishlisted a specific course.
 */
export async function checkWishlist(courseId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('wishlists')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  return !!data;
}

/**
 * Fetch all wishlisted courses for the current user,
 * with instructor profiles and review stats.
 */
export async function fetchMyWishlist() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: wishlistItems, error } = await supabase
    .from('wishlists')
    .select('course_id, created_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!wishlistItems || wishlistItems.length === 0) return [];

  // Fetch the courses
  const courseIds = wishlistItems.map((w) => w.course_id);
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .in('id', courseIds)
    .eq('status', 'published');

  if (!courses || courses.length === 0) return [];

  // Fetch instructor profiles
  const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
  const { data: instructors } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', instructorIds);

  // Fetch review stats
  const { data: reviews } = await supabase
    .from('course_reviews')
    .select('course_id, rating')
    .in('course_id', courseIds);

  const reviewStats = {};
  for (const r of reviews || []) {
    if (!reviewStats[r.course_id]) reviewStats[r.course_id] = { total: 0, sum: 0 };
    reviewStats[r.course_id].total++;
    reviewStats[r.course_id].sum += r.rating;
  }

  // Combine and return in wishlist order
  return wishlistItems
    .map((w) => {
      const course = courses.find((c) => c.id === w.course_id);
      if (!course) return null;

      const instructor = instructors?.find((i) => i.id === course.instructor_id);
      const stats = reviewStats[course.id];

      return {
        ...course,
        instructor: instructor || null,
        avgRating: stats ? (stats.sum / stats.total).toFixed(1) : null,
        reviewCount: stats?.total || 0,
        wishlisted_at: w.created_at,
      };
    })
    .filter(Boolean);
}
