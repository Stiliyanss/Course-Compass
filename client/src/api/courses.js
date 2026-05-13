import { supabase } from '../lib/supabaseClient';

/**
 * Fetch published courses, optionally filtered by search term.
 * Joins the instructor's profile to get their name.
 */
export async function fetchCourses(filters = {}) {
  let query = supabase
    .from('courses')
    .select('*, instructor:profiles(id, full_name, avatar_url)')       
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch a single course by its ID.
 * Includes the instructor's profile info.
 */
export async function fetchCourseById(id) {
  const { data, error } = await supabase
    .from('courses')
    .select('*, instructor:profiles(id, full_name, avatar_url, bio)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
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
