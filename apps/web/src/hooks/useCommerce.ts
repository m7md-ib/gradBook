import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { commerceEndpoints } from '@/api/endpoints/commerce';
import type { OrderDto } from '@/types/api';

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ notebookId, packageId }: { notebookId: string; packageId: string }) =>
      commerceEndpoints.createOrder(notebookId, packageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] }),
  });
}

/** The order plus, for manual transfers, the platform's CliQ/bank details. */
export function useCheckout(orderId: string | undefined) {
  return useQuery({
    queryKey: ['orders', orderId, 'checkout'],
    queryFn: () => commerceEndpoints.getCheckout(orderId as string),
    enabled: Boolean(orderId),
    // While waiting on an admin to confirm a transfer, quietly pick up the
    // status change so the page flips to "activated" without a reload.
    refetchInterval: (query) => (query.state.data?.order.status === 'pending' ? 20_000 : false),
  });
}

export function useMyOrders() {
  return useQuery({ queryKey: ['orders', 'mine'], queryFn: () => commerceEndpoints.myOrders() });
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
