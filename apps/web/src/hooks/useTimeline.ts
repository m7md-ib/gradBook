import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timelineEndpoints, type TimelineItemPayload } from '@/api/endpoints/timeline';

export function useOwnerTimeline(notebookId: string | undefined) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'timeline'],
    queryFn: () => timelineEndpoints.list(notebookId as string),
    enabled: Boolean(notebookId),
  });
}

export function useTimelineMutations(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'timeline'] });
  const create = useMutation({
    mutationFn: (payload: TimelineItemPayload) => timelineEndpoints.create(notebookId as string, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<TimelineItemPayload> }) =>
      timelineEndpoints.update(notebookId as string, itemId, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => timelineEndpoints.remove(notebookId as string, itemId),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}
