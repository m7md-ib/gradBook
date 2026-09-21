import { apiClient } from '../client';

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export const notificationsEndpoints = {
  async list() {
    const { data } = await apiClient.get<{ items: NotificationDto[]; unreadCount: number }>('/api/notifications');
    return data;
  },
  async markRead(id: string) {
    await apiClient.patch(`/api/notifications/${id}/read`);
  },
};
