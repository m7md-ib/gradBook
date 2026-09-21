import { apiClient } from '../client';
import type { Paginated, ReportDto } from '@/types/api';

export const moderationEndpoints = {
  async list(notebookId: string, page = 1, pageSize = 20): Promise<Paginated<ReportDto>> {
    const { data } = await apiClient.get<Paginated<ReportDto>>(`/api/notebooks/${notebookId}/reports`, {
      params: { page, pageSize },
    });
    return data;
  },
  async resolve(notebookId: string, reportId: string, status: 'dismissed' | 'actioned') {
    const { data } = await apiClient.patch<{ report: ReportDto }>(`/api/notebooks/${notebookId}/reports/${reportId}`, {
      status,
    });
    return data.report;
  },
};
