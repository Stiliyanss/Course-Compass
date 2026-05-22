import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all data needed for the student dashboard.
 *
 * Returns an object with:
 *   - enrollments: array of enrolled courses with instructor info
 *   - progress: object mapping courseId → { completed, total }
 *   - recentActivity: array of recently completed materials
 *
 * We gather data from multiple tables and combine them.
 */
export async function fetchDashboardData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // ── 1. Get all enrollments (completed payments only) ──
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id, enrolled_at')
    .eq('student_id', user.id)
    .eq('payment_status', 'completed')
    .order('enrolled_at', { ascending: false });

  if (enrollError) throw enrollError;
  if (enrollments.length === 0) {
    return { enrollments: [], progress: {}, recentActivity: [] };
  }

  // ── 2. Get course details for each enrollment ──
  const courseIds = enrollments.map((e) => e.course_id);

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, image_url, instructor_id')
    .in('id', courseIds);

  if (coursesError) throw coursesError;

  // ── 3. Get instructor names ──
  const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
  const { data: instructors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', instructorIds);

  // ── 4. Get all materials for these courses (to calculate total per course) ──
  const { data: allMaterials, error: materialsError } = await supabase
    .from('course_materials')
    .select('id, course_id')
    .in('course_id', courseIds);

  if (materialsError) throw materialsError;

  // ── 5. Get the student's completed materials ──
  const { data: completedMaterials, error: progressError } = await supabase
    .from('material_progress')
    .select('material_id, course_id, completed_at')
    .eq('student_id', user.id)
    .in('course_id', courseIds);

  if (progressError) throw progressError;

  // ── 6. Build progress map: courseId → { completed, total } ──
  const progress = {};
  courseIds.forEach((cid) => {
    const total = allMaterials.filter((m) => m.course_id === cid).length;
    const completed = completedMaterials.filter((m) => m.course_id === cid).length;
    progress[cid] = { completed, total };
  });

  // ── 7. Combine enrollments with course + instructor data ──
  const enrichedEnrollments = enrollments.map((enrollment) => {
    const course = courses.find((c) => c.id === enrollment.course_id);
    const instructor = instructors?.find((i) => i.id === course?.instructor_id);
    return {
      ...enrollment,
      course: course ? { ...course, instructor_name: instructor?.full_name || 'Unknown' } : null,
    };
  });

  // ── 8. Recent activity — last 5 completed materials with titles ──
  // Sort by completed_at descending, take the 5 most recent
  const recentCompleted = [...completedMaterials]
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 5);

  // Get material titles for the recent items
  const recentMaterialIds = recentCompleted.map((m) => m.material_id);
  let recentActivity = [];

  if (recentMaterialIds.length > 0) {
    const { data: materialDetails } = await supabase
      .from('course_materials')
      .select('id, title, file_type, course_id')
      .in('id', recentMaterialIds);

    recentActivity = recentCompleted.map((item) => {
      const detail = materialDetails?.find((m) => m.id === item.material_id);
      const course = courses.find((c) => c.id === item.course_id);
      return {
        materialId: item.material_id,
        title: detail?.title || 'Unknown material',
        fileType: detail?.file_type || '',
        courseName: course?.title || 'Unknown course',
        completedAt: item.completed_at,
      };
    });
  }

  // ── 9. Learning streak — consecutive days with at least one completion ──
  const streak = calcStreak(completedMaterials.map((m) => m.completed_at));

  return {
    enrollments: enrichedEnrollments,
    progress,
    recentActivity,
    streak,
  };
}

/**
 * Calculate a learning streak: how many consecutive days (ending today or
 * yesterday) the student completed at least one material.
 */
function calcStreak(dates) {
  if (dates.length === 0) return 0;

  // Get unique days (in local timezone) sorted descending
  const uniqueDays = [
    ...new Set(dates.map((d) => new Date(d).toLocaleDateString())),
  ]
    .map((d) => new Date(d))
    .sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Streak must start from today or yesterday
  const first = uniqueDays[0];
  first.setHours(0, 0, 0, 0);
  if (first < yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const curr = uniqueDays[i];
    curr.setHours(0, 0, 0, 0);
    const prev = uniqueDays[i - 1];
    prev.setHours(0, 0, 0, 0);

    const diff = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
