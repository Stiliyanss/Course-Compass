import { supabase } from '../lib/supabaseClient';

/**
 * Fetch detailed analytics for a single course owned by the instructor.
 * Returns: course info, enrolled students with progress, reviews, revenue, sections/materials.
 */
export async function fetchInstructorCourseDetail(courseId) {
  // ── 1. Course data ──
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseErr) throw courseErr;

  // ── 2. Sections & materials ──
  const { data: sections } = await supabase
    .from('course_sections')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index');

  const { data: materials } = await supabase
    .from('course_materials')
    .select('id, title, file_type, section_id, order_index')
    .eq('course_id', courseId)
    .order('order_index');

  const totalMaterials = materials?.length || 0;

  // ── 3. Enrollments + student profiles ──
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, enrolled_at, payment_status')
    .eq('course_id', courseId)
    .eq('payment_status', 'completed')
    .order('enrolled_at', { ascending: false });

  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))];
  let profiles = [];
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .in('id', studentIds);
    profiles = data || [];
  }

  // ── 4. Progress for all enrolled students ──
  const materialIds = (materials || []).map((m) => m.id);
  let allProgress = [];
  if (materialIds.length > 0 && studentIds.length > 0) {
    const { data } = await supabase
      .from('material_progress')
      .select('material_id, student_id')
      .in('material_id', materialIds);
    allProgress = data || [];
  }

  // Build student list with progress
  const students = (enrollments || []).map((e) => {
    const profile = profiles.find((p) => p.id === e.student_id);
    const completed = allProgress.filter((p) => p.student_id === e.student_id).length;
    const percent = totalMaterials > 0 ? Math.round((completed / totalMaterials) * 100) : 0;
    return {
      id: e.student_id,
      full_name: profile?.full_name || 'Unknown',
      avatar_url: profile?.avatar_url || null,
      email: profile?.email || '',
      enrolled_at: e.enrolled_at,
      completed,
      total: totalMaterials,
      percent,
    };
  });

  // ── 5. Reviews ──
  const { data: reviews } = await supabase
    .from('course_reviews')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  let reviewsWithProfiles = [];
  if (reviews && reviews.length > 0) {
    const reviewerIds = [...new Set(reviews.map((r) => r.student_id))];
    const { data: reviewerProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', reviewerIds);

    reviewsWithProfiles = reviews.map((r) => {
      const p = reviewerProfiles?.find((pr) => pr.id === r.student_id);
      return {
        ...r,
        student_name: p?.full_name || 'Unknown',
        student_avatar: p?.avatar_url || null,
      };
    });
  }

  const avgRating = reviewsWithProfiles.length > 0
    ? (reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0) / reviewsWithProfiles.length).toFixed(1)
    : null;

  // ── 6. Revenue ──
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, status, created_at')
    .eq('course_id', courseId)
    .eq('status', 'completed');

  const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

  // ── 7. Average completion ──
  const avgCompletion = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.percent, 0) / students.length)
    : 0;

  return {
    course,
    sections: (sections || []).map((s) => ({
      ...s,
      materials: (materials || []).filter((m) => m.section_id === s.id),
    })),
    totalMaterials,
    students,
    reviews: reviewsWithProfiles,
    avgRating,
    totalRevenue,
    avgCompletion,
  };
}
