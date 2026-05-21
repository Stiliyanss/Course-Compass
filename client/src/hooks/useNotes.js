import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotes, saveNote } from '../api/notes';

/**
 * Hook to fetch the current student's notes for a course.
 * Returns { data: { "sectionId": "note content", ... } }
 */
export function useNotes(courseId) {
  return useQuery({
    queryKey: ['notes', courseId],
    queryFn: () => fetchNotes(courseId),
    enabled: !!courseId,
  });
}

/**
 * Hook to save a note. After saving, it updates the local cache
 * immediately (optimistic update) so the UI feels instant.
 */
export function useSaveNote(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, content }) => saveNote(sectionId, content),
    onSuccess: (_, { sectionId, content }) => {
      // Update the cached notes object directly instead of refetching
      // This makes the save feel instant — no loading spinner needed
      queryClient.setQueryData(['notes', courseId], (old) => ({
        ...old,
        [sectionId]: content,
      }));
    },
  });
}
