import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all courses the current student is enrolled in.
 *
 * Queries the enrollments table filtered by the current user,
 * then fetches the full course data + instructor profiles.
 *
 * The enrollments table links students to courses:
 *   enrollments: { student_id, course_id, payment_status, enrolled_at }
 *
 * RLS policy "Students can view own enrollments" ensures
 * students can only see their own enrollments (student_id = auth.uid()).
 */
/**
 * Check if the current user is enrolled in a specific course.
 *
 * Returns true if there is an enrollment row where
 * student_id = current user AND course_id = the given course.
 * Returns false if not logged in or not enrolled.
 */
export async function checkEnrollment(courseId) {
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — can't be enrolled
  if (!user) return false;

  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .eq('payment_status', 'completed')
    .maybeSingle();

  if (error) throw error;

  // If data is not null, the student is enrolled
  return !!data;
}

/**
 * Fetch enrollment counts and student details for all courses owned by the instructor.
 * Returns { [courseId]: { count, students: [{ id, full_name, avatar_url, enrolled_at }] } }
 */
export async function fetchCourseEnrollments(courseIds) {
  if (!courseIds || courseIds.length === 0) return {};

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('student_id, course_id, enrolled_at')
    .eq('payment_status', 'completed')
    .in('course_id', courseIds);

  if (error) throw error;
  if (!enrollments || enrollments.length === 0) return {};

  // Fetch student profiles
  const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', studentIds);

  // Group by course
  const result = {};
  for (const courseId of courseIds) {
    const courseEnrollments = enrollments.filter((e) => e.course_id === courseId);
    result[courseId] = {
      count: courseEnrollments.length,
      students: courseEnrollments.map((e) => {
        const profile = profiles?.find((p) => p.id === e.student_id);
        return {
          id: e.student_id,
          full_name: profile?.full_name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          enrolled_at: e.enrolled_at,
        };
      }),
    };
  }
  return result;
}

export async function fetchMyEnrollments() {
  const { data: { user } } = await supabase.auth.getUser();

  // Step 1: Get all enrollments for this student
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  if (enrollments.length === 0) return [];

  // Step 2: Get the course data for each enrollment
  const courseIds = enrollments.map((e) => e.course_id);
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .in('id', courseIds);

  if (coursesError) throw coursesError;

  // Step 3: Get instructor profiles
  const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
  const { data: instructors } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', instructorIds);

  // Step 4: Combine everything — each enrollment gets its course + instructor
  return enrollments.map((enrollment) => {
    const course = courses.find((c) => c.id === enrollment.course_id);
    const instructor = instructors?.find((i) => i.id === course?.instructor_id) || null;
    return {
      ...enrollment,
      course: course ? { ...course, instructor } : null,
    };
  });
}
