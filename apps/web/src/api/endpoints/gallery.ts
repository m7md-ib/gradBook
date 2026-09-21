import { apiClient } from '../client';
import type { GalleryItemDto, Paginated } from '@/types/api';

export const galleryEndpoints = {
  async list(notebookId: string, page = 1, pageSize = 30): Promise<Paginated<GalleryItemDto>> {
    const { data } = await apiClient.get<Paginated<GalleryItemDto>>(`/api/notebooks/${notebookId}/gallery`, {
      params: { page, pageSize },
    });
    return data;
  },
  async approve(notebookId: string, itemId: string) {
    const { data } = await apiClient.patch<{ item: GalleryItemDto }>(
      `/api/notebooks/${notebookId}/gallery/${itemId}/approve`,
    );
    return data.item;
  },
  async hide(notebookId: string, itemId: string) {
    const { data } = await apiClient.patch<{ item: GalleryItemDto }>(
      `/api/notebooks/${notebookId}/gallery/${itemId}/hide`,
    );
    return data.item;
  },
  async remove(notebookId: string, itemId: string) {
    await apiClient.delete(`/api/notebooks/${notebookId}/gallery/${itemId}`);
  },
};
