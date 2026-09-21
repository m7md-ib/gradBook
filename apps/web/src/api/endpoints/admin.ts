import { apiClient } from '../client';
import type { NotebookDto, OrderDto, Package, Paginated, ReportDto, Theme, CoverTemplate } from '@/types/api';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'graduate' | 'admin';
  blockedAt: string | null;
  createdAt: string;
}

export interface PlatformStats {
  totalNotebooks: number;
  activeNotebooks: number;
  totalGraduates: number;
  totalMessages: number;
  totalVisitors: number;
  revenueCents: number;
  popularThemes: Array<{ themeSlug: string; total: number }>;
}

export const adminEndpoints = {
  async stats(): Promise<PlatformStats> {
    const { data } = await apiClient.get<PlatformStats>('/api/admin/stats');
    return data;
  },
  async users(page = 1, pageSize = 20, search?: string): Promise<Paginated<AdminUser>> {
    const { data } = await apiClient.get<Paginated<AdminUser>>('/api/admin/users', {
      params: { page, pageSize, search },
    });
    return data;
  },
  async setUserBlocked(id: string, blocked: boolean) {
    const { data } = await apiClient.patch<{ user: AdminUser }>(`/api/admin/users/${id}/block`, { blocked });
    return data.user;
  },
  async notebooks(page = 1, pageSize = 20, status?: string): Promise<Paginated<NotebookDto>> {
    const { data } = await apiClient.get<Paginated<NotebookDto>>('/api/admin/notebooks', {
      params: { page, pageSize, status },
    });
    return data;
  },
  async forceNotebookStatus(id: string, status: 'active' | 'expired' | 'draft') {
    const { data } = await apiClient.patch<{ notebook: NotebookDto }>(`/api/admin/notebooks/${id}/status`, {
      status,
    });
    return data.notebook;
  },
  async orders(page = 1, pageSize = 20): Promise<Paginated<OrderDto>> {
    const { data } = await apiClient.get<Paginated<OrderDto>>('/api/admin/orders', { params: { page, pageSize } });
    return data;
  },
  async reports(page = 1, pageSize = 20): Promise<Paginated<ReportDto>> {
    const { data } = await apiClient.get<Paginated<ReportDto>>('/api/admin/reports', { params: { page, pageSize } });
    return data;
  },
  async resolveReport(id: string, status: 'dismissed' | 'actioned') {
    const { data } = await apiClient.patch<{ report: ReportDto }>(`/api/admin/reports/${id}`, { status });
    return data.report;
  },
  async packages(): Promise<Package[]> {
    const { data } = await apiClient.get<{ packages: Package[] }>('/api/admin/packages');
    return data.packages;
  },
  async updatePackage(id: string, payload: Partial<Pick<Package, 'priceCents' | 'active' | 'nameAr' | 'nameEn' | 'sortOrder'>>) {
    const { data } = await apiClient.patch<{ package: Package }>(`/api/admin/packages/${id}`, payload);
    return data.package;
  },
  async themes(): Promise<Theme[]> {
    const { data } = await apiClient.get<{ themes: Theme[] }>('/api/admin/themes');
    return data.themes;
  },
  async updateTheme(slug: string, payload: Partial<Pick<Theme, 'active' | 'nameAr' | 'nameEn'>>) {
    const { data } = await apiClient.patch<{ theme: Theme }>(`/api/admin/themes/${slug}`, payload);
    return data.theme;
  },
  async coverTemplates(): Promise<CoverTemplate[]> {
    const { data } = await apiClient.get<{ coverTemplates: CoverTemplate[] }>('/api/admin/cover-templates');
    return data.coverTemplates;
  },
  async updateCoverTemplate(id: string, payload: Partial<Pick<CoverTemplate, 'active' | 'sortOrder' | 'nameAr' | 'nameEn'>>) {
    const { data } = await apiClient.patch<{ coverTemplate: CoverTemplate }>(`/api/admin/cover-templates/${id}`, payload);
    return data.coverTemplate;
  },
  async settings(): Promise<Array<{ key: string; value: unknown }>> {
    const { data } = await apiClient.get<{ settings: Array<{ key: string; value: unknown }> }>('/api/admin/settings');
    return data.settings;
  },
  async updateSetting(key: string, value: unknown) {
    const { data } = await apiClient.put<{ setting: { key: string; value: unknown } }>(`/api/admin/settings/${key}`, {
      value,
    });
    return data.setting;
  },
};
