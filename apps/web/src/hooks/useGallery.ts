import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { galleryEndpoints } from '@/api/endpoints/gallery';

export function useOwnerGallery(notebookId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'gallery', page],
    queryFn: () => galleryEndpoints.list(notebookId as string, page),
    enabled: Boolean(notebookId),
  });
}

export function useModerateGalleryItem(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notebooks', notebookId, 'gallery'] });
  const approve = useMutation({
    mutationFn: (itemId: string) => galleryEndpoints.approve(notebookId as string, itemId),
    onSuccess: invalidate,
  });
  const hide = useMutation({
    mutationFn: (itemId: string) => galleryEndpoints.hide(notebookId as string, itemId),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => galleryEndpoints.remove(notebookId as string, itemId),
    onSuccess: invalidate,
  });
  return { approve, hide, remove };
}
