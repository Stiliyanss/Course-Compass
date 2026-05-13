import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCourses, fetchCourseById, fetchInstructorCourses, createCourse, updateCourse, deleteCourse } from '../api/courses';

/**
 * Hook to fetch all published courses.
 * Pass { search: "react" } to filter by title.
 */
export function useCourses(filters = {}) {
  return useQuery({
    // queryKey is how TanStack Query identifies this cached data.
    // If filters change (e.g. new search term), it refetches automatically.
    queryKey: ['courses', filters],

    // queryFn is the function that actually fetches the data.
    queryFn: () => fetchCourses(filters),
  });
}

/**
 * Hook to fetch a single course by ID.
 * Enabled only when id is provided (avoids fetching with undefined).
 */
export function useCourse(id) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourseById(id),

    // Don't run the query if id is missing (e.g. page is still loading the param)
    enabled: !!id,
  });
}

// ── Instructor hooks ─────────────────────────────────────────

/**
 * Fetch all courses owned by the current instructor.
 * Returns drafts, published, and archived — everything they own.
 */
export function useInstructorCourses() {
  return useQuery({
    queryKey: ['instructor-courses'],
    queryFn: fetchInstructorCourses,
  });
}

/**
 * Create a new course.
 * On success, invalidates the instructor courses list so the
 * new course appears in the table immediately.
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });
}

/**
 * Update an existing course.
 * Invalidates both the instructor list and the individual course cache.
 *
 * Why two invalidations?
 * - ['instructor-courses'] — so the manage courses table shows updated info
 * - ['course'] — so if someone has the course detail page open, it refreshes too
 * - ['courses'] — so the public catalog reflects changes (e.g. title rename)
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...courseData }) => updateCourse(id, courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

/**
 * Delete a course permanently.
 * Invalidates instructor courses and public catalog caches.
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
