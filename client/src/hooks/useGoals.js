import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGoal, upsertGoal } from '../api/goals';

/**
 * Hook to fetch the student's learning goal.
 */
export function useGoal() {
  return useQuery({
    queryKey: ['learning-goal'],
    queryFn: fetchGoal,
  });
}

/**
 * Hook to create or update the student's weekly materials target.
 */
export function useUpsertGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertGoal,
    onSuccess: (data) => {
      queryClient.setQueryData(['learning-goal'], data);
    },
  });
}
