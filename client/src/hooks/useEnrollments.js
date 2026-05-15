import { useQuery } from '@tanstack/react-query';
import { fetchMyEnrollments } from '../api/enrollments';

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
