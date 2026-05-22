import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProgress, toggleMaterialProgress } from '../api/progress';

/**
 * Hook to fetch the student's completed materials for a course.
 * Returns { data: Set of material IDs }
 */
export function useProgress(courseId) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => fetchProgress(courseId),
    enabled: !!courseId,
  });
}

/**
 * Hook to toggle a material's completion.
 * Uses optimistic updates — the checkbox updates instantly,
 * then syncs with the database in the background.
 */
export function useToggleProgress(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ materialId, completed }) =>
      toggleMaterialProgress(courseId, materialId, completed),

    // Optimistic update — update the cache before the server responds
    // This makes the checkbox feel instant
    onMutate: async ({ materialId, completed }) => {
      // Cancel any in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['progress', courseId] });

      // Get the current cached Set
      const previous = queryClient.getQueryData(['progress', courseId]);

      // Update the cache optimistically
      queryClient.setQueryData(['progress', courseId], (old) => {
        const newSet = new Set(old);
        if (completed) {
          newSet.add(materialId);
        } else {
          newSet.delete(materialId);
        }
        return newSet;
      });

      // Return the previous value so we can rollback on error
      return { previous };
    },

    // If the mutation fails, roll back to the previous state
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['progress', courseId], context.previous);
    },
  });
}
