import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moderationEndpoints } from '@/api/endpoints/moderation';

export function useOwnerReports(notebookId: string | undefined) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'reports'],
    queryFn: () => moderationEndpoints.list(notebookId as string),
    enabled: Boolean(notebookId),
  });
}

export function useResolveOwnerReport(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: 'dismissed' | 'actioned' }) =>
      moderationEndpoints.resolve(notebookId as string, reportId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'reports'] }),
  });
}
