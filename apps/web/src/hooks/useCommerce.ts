import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { commerceEndpoints } from '@/api/endpoints/commerce';
import type { OrderDto } from '@/types/api';

export function useCreateOrder() {
  return useMutation({
    mutationFn: ({ notebookId, packageId }: { notebookId: string; packageId: string }) =>
      commerceEndpoints.createOrder(notebookId, packageId),
  });
}

export function useOrder(orderId: string | undefined, options?: Pick<UseQueryOptions<OrderDto>, 'refetchInterval'>) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => commerceEndpoints.getOrder(orderId as string),
    enabled: Boolean(orderId),
    refetchInterval: options?.refetchInterval,
  });
}

export function useConfirmMockPayment() {
  return useMutation({
    mutationFn: (orderId: string) => commerceEndpoints.confirmMock(orderId),
  });
}
