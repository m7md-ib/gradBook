import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesEndpoints, type MessageQueryParams } from '@/api/endpoints/messages';

export function useOwnerMessages(notebookId: string | undefined, params: MessageQueryParams) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'messages', params],
    queryFn: () => messagesEndpoints.list(notebookId as string, params),
    enabled: Boolean(notebookId),
  });
}

export function useModerateMessage(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, status }: { messageId: string; status: 'approved' | 'hidden' | 'deleted' }) =>
      messagesEndpoints.moderate(notebookId as string, messageId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'stats'] });
    },
  });
}

export function useFeatureMessage(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, featured }: { messageId: string; featured: boolean }) =>
      messagesEndpoints.setFeatured(notebookId as string, messageId, featured),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'messages'] }),
  });
}
