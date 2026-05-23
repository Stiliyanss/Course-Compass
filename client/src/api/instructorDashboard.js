import { supabase } from '../lib/supabaseClient';

export async function fetchInstructorDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // ── 1. Instructor's courses ──
  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .select('id, title, status, price, created_at, image_url')
    .eq('instructor_id', user.id);

  if (coursesErr) throw coursesErr;

  const courseIds = courses.map((c) => c.id);

  // ── 2. Enrollments for those courses ──
  let enrollments = [];
  if (courseIds.length > 0) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, student_id, course_id, enrolled_at')
      .eq('payment_status', 'completed')
      .in('course_id', courseIds);

    if (error) throw error;
    enrollments = data || [];
  }

  // ── 3. Payments for those courses ──
  let payments = [];
  if (courseIds.length > 0) {
    const { data, error } = await supabase
      .from('payments')
      .select('id, course_id, amount, status')
      .eq('status', 'completed')
      .in('course_id', courseIds);

    if (error) throw error;
    payments = data || [];
  }

  // ── Compute stats ──
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'published').length;
  const uniqueStudents = new Set(enrollments.map((e) => e.student_id)).size;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // ── 4. Students per course ──
  const studentsPerCourse = courses.map((c) => ({
    id: c.id,
    title: c.title,
    students: enrollments.filter((e) => e.course_id === c.id).length,
  })).sort((a, b) => b.students - a.students);

  // ── 5. Average completion rate per course ──
  // We need: total materials per course, and completed materials per enrolled student
  let allMaterials = [];
  let allProgress = [];

  if (courseIds.length > 0) {
    const { data: mats } = await supabase
      .from('course_materials')
      .select('id, course_id')
      .in('course_id', courseIds);
    allMaterials = mats || [];

    const { data: prog } = await supabase
      .from('material_progress')
      .select('material_id, student_id')
      .in('material_id', (mats || []).map((m) => m.id));
    allProgress = prog || [];
  }

  const completionPerCourse = courses.map((c) => {
    const courseMaterials = allMaterials.filter((m) => m.course_id === c.id);
    const totalMats = courseMaterials.length;
    const courseEnrollments = enrollments.filter((e) => e.course_id === c.id);

    if (totalMats === 0 || courseEnrollments.length === 0) {
      return { id: c.id, title: c.title, avgCompletion: 0 };
    }

    const matIds = new Set(courseMaterials.map((m) => m.id));
    const studentRates = courseEnrollments.map((e) => {
      const completed = allProgress.filter(
        (p) => p.student_id === e.student_id && matIds.has(p.material_id)
      ).length;
      return (completed / totalMats) * 100;
    });

    const avg = Math.round(studentRates.reduce((s, r) => s + r, 0) / studentRates.length);
    return { id: c.id, title: c.title, avgCompletion: avg };
  }).sort((a, b) => b.avgCompletion - a.avgCompletion);

  // ── 6. Revenue per course ──
  const revenuePerCourse = courses.map((c) => ({
    id: c.id,
    title: c.title,
    revenue: payments
      .filter((p) => p.course_id === c.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  })).sort((a, b) => b.revenue - a.revenue);

  // ── 7. Recent enrollments — last 5 with student names ──
  const recentEnrollments = [...enrollments]
    .sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at))
    .slice(0, 5);

  let recentActivity = [];
  if (recentEnrollments.length > 0) {
    const studentIds = [...new Set(recentEnrollments.map((e) => e.student_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', studentIds);

    recentActivity = recentEnrollments.map((e) => {
      const profile = profiles?.find((p) => p.id === e.student_id);
      const course = courses.find((c) => c.id === e.course_id);
      return {
        studentName: profile?.full_name || 'Unknown student',
        avatarUrl: profile?.avatar_url || null,
        courseName: course?.title || 'Unknown course',
        enrolledAt: e.enrolled_at,
      };
    });
  }

  return {
    totalCourses,
    publishedCourses,
    uniqueStudents,
    totalRevenue,
    studentsPerCourse,
    revenuePerCourse,
    completionPerCourse,
    recentActivity,
  };
}
