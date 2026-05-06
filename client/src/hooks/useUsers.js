import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllUsers, updateUserRole } from '../api/users';

/**
 * Hook to fetch all user profiles (admin only).
 * Caches under ['users'] so repeated visits don't refetch.
 */
export function useAllUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
  });
}

/**
 * Hook to change a user's role (admin only).
 *
 * Usage: mutation.mutate({ id, role: 'student' })
 *
 * On success, invalidates ['users'] so the users table
 * refreshes and shows the updated role immediately.
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
