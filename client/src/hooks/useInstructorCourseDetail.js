import { useQuery } from '@tanstack/react-query';
import { fetchInstructorCourseDetail } from '../api/instructorCourseDetail';

export function useInstructorCourseDetail(courseId) {
  return useQuery({
    queryKey: ['instructor-course-detail', courseId],
    queryFn: () => fetchInstructorCourseDetail(courseId),
    enabled: !!courseId,
  });
}
