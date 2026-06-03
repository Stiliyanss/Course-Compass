import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchComments, createComment, deleteComment } from '../api/comments';

/**
 * Fetch all comments for a material.
 * Only fetches when materialId is provided.
 */
export function useComments(materialId) {
  return useQuery({
    queryKey: ['comments', materialId],
    queryFn: () => fetchComments(materialId),
    enabled: !!materialId,
  });
}

/**
 * Create a new comment.
 * Invalidates the comments list so the new comment appears immediately.
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.materialId] });
    },
  });
}

/**
 * Delete a comment.
 * Invalidates the comments list for the material.
 */
export function useDeleteComment(materialId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', materialId] });
    },
  });
}
