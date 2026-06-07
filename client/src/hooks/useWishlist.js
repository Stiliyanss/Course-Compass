import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkWishlist, toggleWishlist, fetchMyWishlist } from '../api/wishlist';

export function useWishlistCheck(courseId) {
  return useQuery({
    queryKey: ['wishlist-check', courseId],
    queryFn: () => checkWishlist(courseId),
    enabled: !!courseId,
  });
}

export function useMyWishlist() {
  return useQuery({
    queryKey: ['my-wishlist'],
    queryFn: fetchMyWishlist,
  });
}

export function useToggleWishlist(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleWishlist(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-wishlist'] });
    },
  });
}
