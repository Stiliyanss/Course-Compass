import { useQuery } from '@tanstack/react-query';
import { fetchMyEnrollments, checkEnrollment, fetchCourseEnrollments } from '../api/enrollments';

/**
 * Hook to check if the current user is enrolled in a specific course.
 *
 * queryKey includes the courseId so each course has its own cache entry.
 * Returns { data: true/false, isLoading, ... }
 */
export function useEnrollmentCheck(courseId) {
  return useQuery({
    queryKey: ['enrollment-check', courseId],
    queryFn: () => checkEnrollment(courseId),
    enabled: !!courseId,
  });
}

/**
 * Hook to fetch the current student's enrolled courses.
 * Returns enrollment data with full course + instructor info.
 */
export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: fetchMyEnrollments,
  });
}

/**
 * Hook to fetch enrollment data (count + student list) for given course IDs.
 */
export function useCourseEnrollments(courseIds) {
  return useQuery({
    queryKey: ['course-enrollments', courseIds],
    queryFn: () => fetchCourseEnrollments(courseIds),
    enabled: courseIds?.length > 0,
  });
}
