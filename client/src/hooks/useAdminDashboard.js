import { useQuery } from '@tanstack/react-query';
import { fetchAdminDashboard } from '../api/adminDashboard';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
  });
}
