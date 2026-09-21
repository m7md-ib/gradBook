import { apiClient } from '../client';
import type { CheckoutSessionDto, OrderDto } from '@/types/api';

export const commerceEndpoints = {
  async createOrder(notebookId: string, packageId: string) {
    const { data } = await apiClient.post<{ order: OrderDto; checkout: CheckoutSessionDto }>('/api/orders', {
      notebookId,
      packageId,
    });
    return data;
  },
  async getOrder(orderId: string): Promise<OrderDto> {
    const { data } = await apiClient.get<{ order: OrderDto }>(`/api/orders/${orderId}`);
    return data.order;
  },
  async confirmMock(orderId: string): Promise<OrderDto> {
    const { data } = await apiClient.post<{ order: OrderDto }>(`/api/orders/${orderId}/confirm-mock`);
    return data.order;
  },
};
