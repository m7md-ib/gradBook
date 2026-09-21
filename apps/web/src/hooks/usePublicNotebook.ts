import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicEndpoints, type CreateMessagePayload } from '@/api/endpoints/public';

export function usePublicNotebook(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'notebook', slug],
    queryFn: () => publicEndpoints.getNotebook(slug as string),
    enabled: Boolean(slug),
    retry: false,
  });
}

export function usePublicMessages(slug: string | undefined, page: number, targetGraduateId?: string) {
  return useQuery({
    queryKey: ['public', 'notebook', slug, 'messages', page, targetGraduateId],
    queryFn: () => publicEndpoints.messages(slug as string, page, 20, targetGraduateId),
    enabled: Boolean(slug),
  });
}

export function usePublicGallery(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'notebook', slug, 'gallery'],
    queryFn: () => publicEndpoints.gallery(slug as string),
    enabled: Boolean(slug),
  });
}

export function usePublicTimeline(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'notebook', slug, 'timeline'],
    queryFn: () => publicEndpoints.timeline(slug as string),
    enabled: Boolean(slug),
  });
}

export function useSubmitAccessCode(slug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => publicEndpoints.submitAccessCode(slug as string, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['public', 'notebook', slug] }),
  });
}

export function useSubmitMessage(slug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMessagePayload) => publicEndpoints.submitMessage(slug as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'notebook', slug, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'notebook', slug] });
    },
  });
}

export function useSubmitGalleryPhoto(slug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, caption, submittedByName }: { file: File; caption?: string; submittedByName?: string }) =>
      publicEndpoints.submitGalleryPhoto(slug as string, file, caption, submittedByName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['public', 'notebook', slug, 'gallery'] }),
  });
}

export function useReportContent(slug: string | undefined) {
  return useMutation({
    mutationFn: (payload: { targetType: string; targetId: string; reason: string }) =>
      publicEndpoints.report(slug as string, payload),
  });
}
