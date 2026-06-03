import { supabase } from '../lib/supabaseClient';

export async function fetchAdminDashboard() {
  // ── 1. All profiles ──
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, role, full_name, created_at');

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

  // ── 5. Course materials ──
  const { data: materials, error: matErr } = await supabase
    .from('course_materials')
    .select('id, course_id');

  if (matErr) throw matErr;

  // ── 6. Material progress ──
  const { data: progress, error: progErr } = await supabase
    .from('material_progress')
    .select('id, student_id, material_id, completed, completed_at');

  if (progErr) throw progErr;

  // ── 7. Course reviews ──
  const { data: reviews, error: revErr } = await supabase
    .from('course_reviews')
    .select('id, course_id, rating');

  if (revErr) throw revErr;

  // ── 8. Instructor applications ──
  const { data: applications, error: appErr } = await supabase
    .from('instructor_applications')
    .select('id, status');

  if (appErr) throw appErr;

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

  // New registrations per month — last 6 months
  const registrationsPerMonth = groupByMonth(
    profiles.filter((p) => p.role === 'student').map((p) => p.created_at),
    6
  );

  // Inactive students — registered but never enrolled
  const enrolledStudentIds = new Set(enrollments.map((e) => e.student_id));
  const inactiveStudents = profiles.filter(
    (p) => p.role === 'student' && !enrolledStudentIds.has(p.id)
  ).length;

  // Enrollment distribution — how many students have 1, 2, 3, 4, 5+ courses
  const enrollmentsPerStudent = {};
  for (const e of enrollments) {
    enrollmentsPerStudent[e.student_id] = (enrollmentsPerStudent[e.student_id] || 0) + 1;
  }
  const enrollmentDistribution = [
    { label: '1 course', count: 0 },
    { label: '2 courses', count: 0 },
    { label: '3 courses', count: 0 },
    { label: '4 courses', count: 0 },
    { label: '5+ courses', count: 0 },
  ];
  for (const count of Object.values(enrollmentsPerStudent)) {
    const idx = Math.min(count, 5) - 1;
    enrollmentDistribution[idx].count++;
  }

  // Average completion rate — across all student-course pairs
  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.material_id)
  );
  const materialsByCourse = {};
  for (const m of materials) {
    if (!materialsByCourse[m.course_id]) materialsByCourse[m.course_id] = [];
    materialsByCourse[m.course_id].push(m.id);
  }
  let totalRates = 0;
  let rateCount = 0;
  for (const e of enrollments) {
    const courseMats = materialsByCourse[e.course_id] || [];
    if (courseMats.length === 0) continue;
    const done = courseMats.filter((id) => completedSet.has(id)).length;
    totalRates += done / courseMats.length;
    rateCount++;
  }
  const avgCompletionRate = rateCount > 0 ? Math.round((totalRates / rateCount) * 100) : 0;

  // Top students — by materials completed (tiebreak by enrollments)
  const completedPerStudent = {};
  for (const p of progress) {
    if (p.completed) {
      completedPerStudent[p.student_id] = (completedPerStudent[p.student_id] || 0) + 1;
    }
  }
  const studentProfiles = profiles.filter((p) => p.role === 'student');
  const topStudents = studentProfiles
    .map((p) => ({
      name: p.full_name || 'Unknown',
      enrollments: enrollmentsPerStudent[p.id] || 0,
      materialsCompleted: completedPerStudent[p.id] || 0,
    }))
    .sort((a, b) => b.materialsCompleted - a.materialsCompleted || b.enrollments - a.enrollments)
    .slice(0, 5);

  // Most active recently — last 30 days by completions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentActivityMap = {};
  for (const p of progress) {
    if (p.completed && p.completed_at && new Date(p.completed_at) >= thirtyDaysAgo) {
      recentActivityMap[p.student_id] = (recentActivityMap[p.student_id] || 0) + 1;
    }
  }
  const mostActiveRecently = studentProfiles
    .filter((p) => recentActivityMap[p.id])
    .map((p) => ({
      name: p.full_name || 'Unknown',
      completions: recentActivityMap[p.id],
    }))
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 5);

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

  // Top instructors by students — unique student count per instructor
  const studentsPerInstructor = {};
  for (const e of enrollments) {
    const instrId = courseInstructorMap[e.course_id];
    if (instrId) {
      if (!studentsPerInstructor[instrId]) studentsPerInstructor[instrId] = new Set();
      studentsPerInstructor[instrId].add(e.student_id);
    }
  }
  const topInstructorsByStudents = instructorProfiles
    .map((p) => ({
      name: p.full_name || 'Unknown',
      students: studentsPerInstructor[p.id]?.size || 0,
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 5);

  // Top rated instructors — by avg review rating
  const ratingsByInstructor = {};
  for (const r of reviews) {
    const instrId = courseInstructorMap[r.course_id];
    if (instrId) {
      if (!ratingsByInstructor[instrId]) ratingsByInstructor[instrId] = [];
      ratingsByInstructor[instrId].push(r.rating);
    }
  }
  const topRatedInstructors = instructorProfiles
    .filter((p) => ratingsByInstructor[p.id]?.length > 0)
    .map((p) => {
      const ratings = ratingsByInstructor[p.id];
      const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
      return { name: p.full_name || 'Unknown', avgRating: Math.round(avg * 10) / 10, reviewCount: ratings.length };
    })
    .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
    .slice(0, 5);

  // Best selling courses — top 5 by revenue
  const revenuePerCourse = {};
  for (const p of payments) {
    revenuePerCourse[p.course_id] = (revenuePerCourse[p.course_id] || 0) + (p.amount || 0);
  }
  const bestSellingCourses = courses
    .map((c) => ({ title: c.title, revenue: revenuePerCourse[c.id] || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Avg course price — average of paid courses only
  const paidCourses = courses.filter((c) => c.price > 0);
  const avgCoursePrice = paidCourses.length > 0
    ? Math.round(paidCourses.reduce((s, c) => s + c.price, 0) / paidCourses.length * 100) / 100
    : 0;

  // Pending applications
  const pendingApplications = applications.filter((a) => a.status === 'pending').length;

  return {
    // Shared
    totalUsers,
    totalCourses,
    totalRevenue,
    totalEnrollments,
    // Students tab
    totalStudents,
    activeStudents,
    inactiveStudents,
    avgCompletionRate,
    mostPopularCourses,
    enrollmentsPerMonth,
    registrationsPerMonth,
    enrollmentDistribution,
    topStudents,
    mostActiveRecently,
    // Instructors tab
    totalInstructors,
    topInstructors,
    revenuePerMonth,
    coursesByStatus,
    topInstructorsByStudents,
    topRatedInstructors,
    bestSellingCourses,
    avgCoursePrice,
    pendingApplications,
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
