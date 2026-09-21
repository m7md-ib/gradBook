import { apiClient } from '../client';
import type { CoverTemplate, Package, Theme } from '@/types/api';

export const catalogEndpoints = {
  async themes(): Promise<Theme[]> {
    const { data } = await apiClient.get<{ themes: Theme[] }>('/api/catalog/themes');
    return data.themes;
  },
  async coverTemplates(): Promise<CoverTemplate[]> {
    const { data } = await apiClient.get<{ coverTemplates: CoverTemplate[] }>('/api/catalog/cover-templates');
    return data.coverTemplates;
  },
  async packages(): Promise<Package[]> {
    const { data } = await apiClient.get<{ packages: Package[] }>('/api/catalog/packages');
    return data.packages;
  },
};
