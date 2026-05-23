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

  return {
    totalCourses,
    publishedCourses,
    uniqueStudents,
    totalRevenue,
    studentsPerCourse,
  };
}
