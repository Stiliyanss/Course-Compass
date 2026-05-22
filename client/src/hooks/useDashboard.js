import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../api/dashboard';

/**
 * Hook to fetch all student dashboard data.
 * Returns { enrollments, progress, recentActivity }
 */
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });
}
