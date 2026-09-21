import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notebooksEndpoints, type CreateNotebookPayload, type CoverCustomizationPayload, type NotebookSettingsPayload, type GraduateInfoPayload } from '@/api/endpoints/notebooks';
import type { NotebookDto } from '@/types/api';

export function useMyNotebooks() {
  return useQuery({ queryKey: ['notebooks', 'mine'], queryFn: notebooksEndpoints.mine });
}

export function useNotebook(id: string | undefined) {
  return useQuery({
    queryKey: ['notebooks', id],
    queryFn: () => notebooksEndpoints.get(id as string),
    enabled: Boolean(id),
  });
}

export function useNotebookStats(id: string | undefined) {
  return useQuery({
    queryKey: ['notebooks', id, 'stats'],
    queryFn: () => notebooksEndpoints.stats(id as string),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });
}

export function useNotebookQr(id: string | undefined) {
  return useQuery({
    queryKey: ['notebooks', id, 'qr'],
    queryFn: () => notebooksEndpoints.qr(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotebookPayload) => notebooksEndpoints.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks', 'mine'] }),
  });
}

function useNotebookMutation<TPayload, TResult = NotebookDto>(
  id: string | undefined,
  mutationFn: (id: string, payload: TPayload) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TPayload) => mutationFn(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks', id] });
      queryClient.invalidateQueries({ queryKey: ['notebooks', 'mine'] });
    },
  });
}

export function useUpdateCover(id: string | undefined) {
  return useNotebookMutation<CoverCustomizationPayload>(id, notebooksEndpoints.updateCover);
}

export function useUploadCoverImage(id: string | undefined) {
  return useNotebookMutation<File>(id, notebooksEndpoints.uploadCoverImage);
}

export function useUpdateSettings(id: string | undefined) {
  return useNotebookMutation<NotebookSettingsPayload>(id, notebooksEndpoints.updateSettings);
}

export function useUpdateIntro(id: string | undefined) {
  return useNotebookMutation<{ welcomeMessage?: string; showProfilePhoto: boolean }>(
    id,
    notebooksEndpoints.updateIntro,
  );
}

export function useUpdateSlug(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => notebooksEndpoints.updateSlug(id as string, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks', id] });
      queryClient.invalidateQueries({ queryKey: ['notebooks', 'mine'] });
    },
  });
}

export function useRegenerateQr(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notebooksEndpoints.regenerateQr(id as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks', id, 'qr'] }),
  });
}

export function useGraduates(notebookId: string | undefined) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'graduates'],
    queryFn: () => notebooksEndpoints.listGraduates(notebookId as string),
    enabled: Boolean(notebookId),
  });
}

export function useAddGraduate(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GraduateInfoPayload) => notebooksEndpoints.addGraduate(notebookId as string, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'graduates'] }),
  });
}

export function useRemoveGraduate(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (graduateId: string) => notebooksEndpoints.removeGraduate(notebookId as string, graduateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'graduates'] }),
  });
}

export function useUploadGraduatePhoto(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ graduateId, file }: { graduateId: string; file: File }) =>
      notebooksEndpoints.uploadGraduatePhoto(notebookId as string, graduateId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'graduates'] }),
  });
}
