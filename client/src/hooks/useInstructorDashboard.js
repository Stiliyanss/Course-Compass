import { useQuery } from '@tanstack/react-query';
import { fetchInstructorDashboard } from '../api/instructorDashboard';

export function useInstructorDashboard() {
  return useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: fetchInstructorDashboard,
  });
}
