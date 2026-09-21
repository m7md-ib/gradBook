import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@/api/endpoints/admin';

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: adminEndpoints.stats });
}

export function useAdminUsers(page: number, search?: string) {
  return useQuery({ queryKey: ['admin', 'users', page, search], queryFn: () => adminEndpoints.users(page, 20, search) });
}

export function useSetUserBlocked() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => adminEndpoints.setUserBlocked(id, blocked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminNotebooks(page: number, status?: string) {
  return useQuery({
    queryKey: ['admin', 'notebooks', page, status],
    queryFn: () => adminEndpoints.notebooks(page, 20, status),
  });
}

export function useForceNotebookStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'expired' | 'draft' }) =>
      adminEndpoints.forceNotebookStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'notebooks'] }),
  });
}

export function useAdminOrders(page: number) {
  return useQuery({ queryKey: ['admin', 'orders', page], queryFn: () => adminEndpoints.orders(page) });
}

export function useAdminReports(page: number) {
  return useQuery({ queryKey: ['admin', 'reports', page], queryFn: () => adminEndpoints.reports(page) });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'dismissed' | 'actioned' }) =>
      adminEndpoints.resolveReport(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
}

export function useAdminPackages() {
  return useQuery({ queryKey: ['admin', 'packages'], queryFn: adminEndpoints.packages });
}

export function useUpdateAdminPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminEndpoints.updatePackage>[1] }) =>
      adminEndpoints.updatePackage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'packages'] });
    },
  });
}

export function useAdminThemes() {
  return useQuery({ queryKey: ['admin', 'themes'], queryFn: adminEndpoints.themes });
}

export function useUpdateAdminTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, payload }: { slug: string; payload: Parameters<typeof adminEndpoints.updateTheme>[1] }) =>
      adminEndpoints.updateTheme(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'themes'] });
    },
  });
}

export function useAdminSettings() {
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: adminEndpoints.settings });
}

export function useUpdateAdminSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => adminEndpoints.updateSetting(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}
