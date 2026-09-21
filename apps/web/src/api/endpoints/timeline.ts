import { apiClient } from '../client';
import type { TimelineItemDto } from '@/types/api';

export interface TimelineItemPayload {
  type: string;
  title: string;
  description?: string;
  date?: string;
  sortOrder?: number;
}

export const timelineEndpoints = {
  async list(notebookId: string): Promise<TimelineItemDto[]> {
    const { data } = await apiClient.get<{ items: TimelineItemDto[] }>(`/api/notebooks/${notebookId}/timeline`);
    return data.items;
  },
  async create(notebookId: string, payload: TimelineItemPayload) {
    const { data } = await apiClient.post<{ item: TimelineItemDto }>(`/api/notebooks/${notebookId}/timeline`, payload);
    return data.item;
  },
  async update(notebookId: string, itemId: string, payload: Partial<TimelineItemPayload>) {
    const { data } = await apiClient.patch<{ item: TimelineItemDto }>(
      `/api/notebooks/${notebookId}/timeline/${itemId}`,
      payload,
    );
    return data.item;
  },
  async remove(notebookId: string, itemId: string) {
    await apiClient.delete(`/api/notebooks/${notebookId}/timeline/${itemId}`);
  },
};
