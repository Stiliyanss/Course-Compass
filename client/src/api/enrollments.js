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
    .maybeSingle();

  if (error) throw error;

  // If data is not null, the student is enrolled
  return !!data;
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
