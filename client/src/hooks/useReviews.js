import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCourseReviews,
  fetchMyReview,
  createReview,
  updateReview,
  deleteReview,
} from '../api/reviews';

/**
 * Fetch all reviews for a course.
 * queryKey includes courseId so each course has its own cache.
 */
export function useReviews(courseId) {
  return useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => fetchCourseReviews(courseId),
    enabled: !!courseId,
  });
}

/**
 * Fetch the current user's review for a course.
 * Returns null if the user hasn't reviewed yet.
 */
export function useMyReview(courseId) {
  return useQuery({
    queryKey: ['my-review', courseId],
    queryFn: () => fetchMyReview(courseId),
    enabled: !!courseId,
  });
}

/**
 * Create a new review.
 * On success, invalidates both the reviews list and the user's review cache
 * so the UI updates immediately.
 */
export function useCreateReview(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', courseId] });
    },
  });
}

/**
 * Update an existing review.
 * Same invalidation pattern as create.
 */
export function useUpdateReview(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', courseId] });
    },
  });
}

/**
 * Delete a review.
 * Invalidates caches so the review disappears from the list.
 */
export function useDeleteReview(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', courseId] });
    },
  });
}
