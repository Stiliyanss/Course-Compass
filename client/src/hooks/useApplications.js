import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyApplication, submitApplication, fetchAllApplications, reviewApplication } from '../api/applications';

/**
 * Hook to fetch the current user's instructor application.
 * Returns null if they haven't applied yet.
 */
export function useMyApplication() {
  return useQuery({
    queryKey: ['my-application'],
    queryFn: fetchMyApplication,
  });
}

/**
 * Hook to submit a new instructor application.
 * On success, it invalidates the cached application query
 * so the UI immediately shows the submitted application status.
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitApplication,

    // After a successful submission, tell TanStack Query
    // that 'my-application' data is stale — it will refetch
    // automatically, and the page will switch from the form
    // to the "application submitted" status view.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-application'] });
    },
  });
}

// ── Admin hooks ──────────────────────────────────────────────

/**
 * Hook to fetch all instructor applications (admin only).
 * Returns the full list with applicant profile info.
 */
export function useAllApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: fetchAllApplications,
  });
}

/**
 * Hook to approve or reject an application (admin only).
 *
 * On success, invalidates the applications list so the table
 * updates immediately without a manual page refresh.
 *
 * Usage: reviewMutation.mutate({ id, status: 'approved' })
 */
export function useReviewApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn receives one argument, so we pass an object
    // and destructure it to get id and status
    mutationFn: ({ id, status }) => reviewApplication(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
