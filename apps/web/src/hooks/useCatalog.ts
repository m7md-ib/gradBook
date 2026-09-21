import { useQuery } from '@tanstack/react-query';
import { catalogEndpoints } from '@/api/endpoints/catalog';

export function useThemes() {
  return useQuery({ queryKey: ['catalog', 'themes'], queryFn: catalogEndpoints.themes, staleTime: 5 * 60_000 });
}

export function useCoverTemplates() {
  return useQuery({
    queryKey: ['catalog', 'cover-templates'],
    queryFn: catalogEndpoints.coverTemplates,
    staleTime: 5 * 60_000,
  });
}

export function usePackages() {
  return useQuery({ queryKey: ['catalog', 'packages'], queryFn: catalogEndpoints.packages, staleTime: 5 * 60_000 });
}
