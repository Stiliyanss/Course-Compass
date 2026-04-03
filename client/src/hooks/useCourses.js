import { useQuery } from '@tanstack/react-query';
import { fetchCourses, fetchCourseById } from '../api/courses';

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
