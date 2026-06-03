import { supabase } from '../lib/supabaseClient';

export async function fetchAdminDashboard() {
  // ── 1. All profiles ──
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, role, full_name');

  if (profilesErr) throw profilesErr;

  // ── 2. All courses ──
  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .select('id, title, status, price, instructor_id');

  if (coursesErr) throw coursesErr;

  // ── 3. Completed enrollments ──
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, student_id, course_id, enrolled_at')
    .eq('payment_status', 'completed');

  if (enrollErr) throw enrollErr;

  // ── 4. Completed payments ──
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('id, course_id, amount, created_at')
    .eq('status', 'completed');

  if (payErr) throw payErr;

  // ═══════════════════════════════════════
  //  Shared stats (shown above tabs)
  // ═══════════════════════════════════════
  const totalUsers = profiles.length;
  const totalCourses = courses.length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalEnrollments = enrollments.length;

  // ═══════════════════════════════════════
  //  Students tab
  // ═══════════════════════════════════════
  const totalStudents = profiles.filter((p) => p.role === 'student').length;
  const activeStudents = new Set(enrollments.map((e) => e.student_id)).size;

  // Most popular courses — top 5 by enrollment count
  const enrollCountMap = {};
  for (const e of enrollments) {
    enrollCountMap[e.course_id] = (enrollCountMap[e.course_id] || 0) + 1;
  }
  const mostPopularCourses = courses
    .map((c) => ({ title: c.title, enrollments: enrollCountMap[c.id] || 0 }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5);

  // Enrollments per month — last 6 months
  const enrollmentsPerMonth = groupByMonth(
    enrollments.map((e) => e.enrolled_at),
    6
  );

  // ═══════════════════════════════════════
  //  Instructors tab
  // ═══════════════════════════════════════
  const totalInstructors = profiles.filter((p) => p.role === 'instructor').length;

  // Top instructors by revenue — top 5
  // First, map each course to its instructor
  const courseInstructorMap = {};
  for (const c of courses) {
    courseInstructorMap[c.id] = c.instructor_id;
  }

  // Accumulate revenue and course count per instructor
  const instructorStats = {};
  for (const c of courses) {
    if (!instructorStats[c.instructor_id]) {
      instructorStats[c.instructor_id] = { revenue: 0, courseCount: 0 };
    }
    instructorStats[c.instructor_id].courseCount++;
  }
  for (const p of payments) {
    const instrId = courseInstructorMap[p.course_id];
    if (instrId && instructorStats[instrId]) {
      instructorStats[instrId].revenue += p.amount || 0;
    }
  }

  const instructorProfiles = profiles.filter((p) => p.role === 'instructor');
  const topInstructors = instructorProfiles
    .map((p) => ({
      name: p.full_name || 'Unknown',
      revenue: instructorStats[p.id]?.revenue || 0,
      courseCount: instructorStats[p.id]?.courseCount || 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Revenue per month — last 6 months
  const revenuePerMonth = groupByMonthWithSum(
    payments.map((p) => ({ date: p.created_at, amount: p.amount || 0 })),
    6
  );

  // Courses by status
  const coursesByStatus = { draft: 0, published: 0, archived: 0 };
  for (const c of courses) {
    if (coursesByStatus[c.status] !== undefined) {
      coursesByStatus[c.status]++;
    }
  }

  return {
    // Shared
    totalUsers,
    totalCourses,
    totalRevenue,
    totalEnrollments,
    // Students tab
    totalStudents,
    activeStudents,
    mostPopularCourses,
    enrollmentsPerMonth,
    // Instructors tab
    totalInstructors,
    topInstructors,
    revenuePerMonth,
    coursesByStatus,
  };
}

// ── Helper: group dates into monthly buckets ──
// Returns an array of { month: 'Jan 2026', count: N } for the last `months` months
function groupByMonth(dates, months) {
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      count: 0,
    });
  }

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    const bucket = buckets.find(
      (b) => b.year === d.getFullYear() && b.monthIndex === d.getMonth()
    );
    if (bucket) bucket.count++;
  }

  return buckets.map(({ month, count }) => ({ month, count }));
}

// ── Helper: group dates into monthly buckets with summed amounts ──
function groupByMonthWithSum(items, months) {
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      total: 0,
    });
  }

  for (const item of items) {
    const d = new Date(item.date);
    const bucket = buckets.find(
      (b) => b.year === d.getFullYear() && b.monthIndex === d.getMonth()
    );
    if (bucket) bucket.total += item.amount;
  }

  return buckets.map(({ month, total }) => ({ month, total }));
}
