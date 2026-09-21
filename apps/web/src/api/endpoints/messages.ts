import { apiClient } from '../client';
import type { OwnerMessage, Paginated } from '@/types/api';

export interface MessageQueryParams {
  status?: 'pending' | 'approved' | 'hidden' | 'deleted';
  search?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

export const messagesEndpoints = {
  async list(notebookId: string, params: MessageQueryParams): Promise<Paginated<OwnerMessage>> {
    const { data } = await apiClient.get<Paginated<OwnerMessage>>(`/api/notebooks/${notebookId}/messages`, {
      params,
    });
    return data;
  },
  async moderate(notebookId: string, messageId: string, status: 'approved' | 'hidden' | 'deleted') {
    const { data } = await apiClient.patch<{ message: OwnerMessage }>(
      `/api/notebooks/${notebookId}/messages/${messageId}`,
      { status },
    );
    return data.message;
  },
  async setFeatured(notebookId: string, messageId: string, featured: boolean) {
    const { data } = await apiClient.patch<{ message: OwnerMessage }>(
      `/api/notebooks/${notebookId}/messages/${messageId}/feature`,
      { featured },
    );
    return data.message;
  },
  async remove(notebookId: string, messageId: string) {
    await apiClient.delete(`/api/notebooks/${notebookId}/messages/${messageId}`);
  },
};
