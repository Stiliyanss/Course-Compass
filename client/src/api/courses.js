import { supabase } from '../lib/supabaseClient';

/**
 * Upload a course image to Supabase Storage.
 *
 * File is stored as: course-images/{courseId}.{extension}
 * Using the courseId means each course has one image that gets
 * overwritten on re-upload — no orphaned files.
 *
 * @param {File} file — the image file from a file picker
 * @param {string} courseId — the course's UUID (used as filename)
 * @returns {string} — the public URL of the uploaded image
 */
export async function uploadCourseImage(file, courseId) {
  const ext = file.name.split('.').pop();
  const filePath = `${courseId}.${ext}`;

  const { error } = await supabase.storage
    .from('course-images')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('course-images')
    .getPublicUrl(filePath);

  return `${publicUrl}?t=${Date.now()}`;
}

/**
 * Fetch published courses, optionally filtered by search term.
 * Joins the instructor's profile to get their name.
 */
export async function fetchCourses(filters = {}) {
  let query = supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data: courses, error } = await query;
  if (error) throw error;

  // Fetch instructor profiles separately to avoid RLS join issues
  const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
  if (instructorIds.length === 0) return courses;

  const { data: instructors } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', instructorIds);

  // Fetch review stats for all courses
  const courseIds = courses.map((c) => c.id);
  let reviewStats = {};
  if (courseIds.length > 0) {
    const { data: reviews } = await supabase
      .from('course_reviews')
      .select('course_id, rating')
      .in('course_id', courseIds);

    if (reviews) {
      for (const r of reviews) {
        if (!reviewStats[r.course_id]) {
          reviewStats[r.course_id] = { total: 0, sum: 0 };
        }
        reviewStats[r.course_id].total++;
        reviewStats[r.course_id].sum += r.rating;
      }
    }
  }

  // Attach instructor + review stats to each course
  return courses.map((course) => {
    const stats = reviewStats[course.id];
    return {
      ...course,
      instructor: instructors?.find((i) => i.id === course.instructor_id) || null,
      avgRating: stats ? (stats.sum / stats.total).toFixed(1) : null,
      reviewCount: stats ? stats.total : 0,
    };
  });
}

/**
 * Fetch a single course by its ID.
 * Includes the instructor's profile info.
 */
export async function fetchCourseById(id) {
  // Fetch the course without joining profiles
  // (the profile join causes RLS-related hangs)
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Fetch the instructor's profile separately
  const { data: instructor, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', course.instructor_id)
    .maybeSingle();

  if (profileError) console.error('Instructor profile fetch error:', profileError);

  // Fetch review stats for this course
  const { data: reviews } = await supabase
    .from('course_reviews')
    .select('rating')
    .eq('course_id', id);

  const reviewCount = reviews?.length || 0;
  const avgRating = reviewCount > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  return { ...course, instructor, avgRating, reviewCount };
}


/**
 * Fetch ALL courses across all instructors (admin only).
 * Joins instructor profiles to get names.
 * Also fetches enrollment counts for each course.
 */
export async function fetchAllCoursesAdmin() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch instructor profiles
  const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
  let instructors = [];
  if (instructorIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', instructorIds);
    instructors = data || [];
  }

  // Fetch enrollment counts per course
  const courseIds = courses.map((c) => c.id);
  let enrollmentCounts = {};
  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds);

    if (enrollments) {
      for (const e of enrollments) {
        enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
      }
    }
  }

  return courses.map((course) => ({
    ...course,
    instructor: instructors.find((i) => i.id === course.instructor_id) || null,
    enrollmentCount: enrollmentCounts[course.id] || 0,
  }));
}

/**
 * Create a new course for the currently logged-in instructor.
 *
 * The course starts as a 'draft' by default (set in the database schema:
 * status TEXT NOT NULL DEFAULT 'draft'). This means instructors can fill
 * in details and upload materials before making it visible to students.
 *
 * The RLS policy "Instructors can create courses" checks two things:
 *   1. instructor_id = auth.uid()  — you can only create courses for yourself
 *   2. get_user_role() = 'instructor' — only approved instructors can create
 *
 * @param {Object} courseData — { title, description, price, duration, image_url }
 */
export async function createCourse(courseData) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('courses')
    .insert({
      instructor_id: user.id,
      ...courseData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all courses belonging to the currently logged-in instructor.
 *
 * Unlike fetchCourses() which only returns published courses for the catalog,
 * this returns ALL statuses (draft, published, archived) so the instructor
 * can manage their full course list.
 *
 * The RLS policy on courses has this SELECT condition:
 *   status = 'published' OR instructor_id = auth.uid() OR get_user_role() = 'admin'
 * The "instructor_id = auth.uid()" part is what lets instructors see their own
 * drafts and archived courses — not just published ones.
 */

export async function fetchInstructorCourses() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update an existing course.
 *
 * Only the fields passed in courseData will be updated — Supabase's
 * .update() does a partial update (like SQL's SET), so you don't need
 * to send every column, just the ones that changed.
 *
 * The RLS policy "Instructors can update own courses" checks:
 *   instructor_id = auth.uid() OR get_user_role() = 'admin'
 * So only the course owner (or an admin) can update it.
 *
 * @param {string} id — the course's UUID
 * @param {Object} courseData — fields to update, e.g. { title, price, status }
 */
export async function updateCourse(id, courseData) {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a course permanently.
 *
 * This removes the course row from the database. Because of ON DELETE CASCADE
 * in the schema, all related rows are automatically deleted too:
 *   - course_materials (files attached to this course)
 *   - enrollments (students enrolled in this course)
 *   - material_progress (student progress on this course's materials)
 *   - payments (payment records for this course)
 *
 * The RLS policy "Instructors can delete own courses" checks:
 *   instructor_id = auth.uid() OR get_user_role() = 'admin'
 *
 * @param {string} id — the course's UUID
 */
export async function deleteCourse(id) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
