import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSections,
  createSection,
  updateSection,
  deleteSection,
  uploadMaterial,
  deleteMaterial,
} from '../api/sections';

/**
 * Fetch all sections (with their materials) for a course.
 * The queryKey includes the courseId so each course has its own cache.
 */
export function useSections(courseId) {
  return useQuery({
    queryKey: ['sections', courseId],
    queryFn: () => fetchSections(courseId),
    enabled: !!courseId,
  });
}

/**
 * Create a new section.
 * Invalidates the sections cache so the new section appears immediately.
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, title, orderIndex }) =>
      createSection(courseId, title, orderIndex),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sections', variables.courseId] });
    },
  });
}

/**
 * Update a section's title.
 *
 * We need the courseId to invalidate the right cache,
 * so it's passed alongside the section data.
 */
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }) => updateSection(id, title),
    onSuccess: (_data, _variables, _context) => {
      // Invalidate all section caches since we don't have courseId
      // in the mutation response
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

/**
 * Delete a section and all its materials.
 */
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

/**
 * Upload a file and create a material entry in a section.
 * Invalidates sections cache so the new material appears.
 */
export function useUploadMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMaterial,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sections', variables.courseId] });
    },
  });
}

/**
 * Delete a material (file + database row).
 */
export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fileUrl }) => deleteMaterial(id, fileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}
