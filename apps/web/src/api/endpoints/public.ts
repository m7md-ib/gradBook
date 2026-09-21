import { apiClient } from '../client';
import type { ExpiredNotebookView, GalleryItemDto, Paginated, PublicMessage, PublicNotebook, TimelineItemDto } from '@/types/api';

export interface CreateMessagePayload {
  authorName: string;
  body: string;
  relationship: string;
  reaction?: string;
  photoFile?: File | null;
  targetGraduateId?: string;
  website?: string;
}

export const publicEndpoints = {
  async getNotebook(slug: string): Promise<PublicNotebook | ExpiredNotebookView> {
    const { data } = await apiClient.get<PublicNotebook | ExpiredNotebookView>(`/api/public/notebooks/${slug}`);
    return data;
  },
  async submitAccessCode(slug: string, code: string): Promise<void> {
    await apiClient.post(`/api/public/notebooks/${slug}/access`, { code });
  },
  async messages(slug: string, page = 1, pageSize = 20, targetGraduateId?: string) {
    const { data } = await apiClient.get<Paginated<PublicMessage>>(`/api/public/notebooks/${slug}/messages`, {
      params: { page, pageSize, targetGraduateId },
    });
    return data;
  },
  async gallery(slug: string, page = 1, pageSize = 30) {
    const { data } = await apiClient.get<Paginated<GalleryItemDto>>(`/api/public/notebooks/${slug}/gallery`, {
      params: { page, pageSize },
    });
    return data;
  },
  async timeline(slug: string): Promise<TimelineItemDto[]> {
    const { data } = await apiClient.get<{ items: TimelineItemDto[] }>(`/api/public/notebooks/${slug}/timeline`);
    return data.items;
  },
  async submitMessage(slug: string, payload: CreateMessagePayload) {
    const form = new FormData();
    form.append('authorName', payload.authorName);
    form.append('body', payload.body);
    form.append('relationship', payload.relationship);
    if (payload.reaction) form.append('reaction', payload.reaction);
    if (payload.targetGraduateId) form.append('targetGraduateId', payload.targetGraduateId);
    form.append('website', payload.website ?? '');
    if (payload.photoFile) form.append('file', payload.photoFile);

    const { data } = await apiClient.post<{ message: { id: string; status: string }; requiresApproval: boolean }>(
      `/api/public/notebooks/${slug}/messages`,
      form,
    );
    return data;
  },
  async submitGalleryPhoto(slug: string, file: File, caption?: string, submittedByName?: string) {
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    if (submittedByName) form.append('submittedByName', submittedByName);
    const { data } = await apiClient.post(`/api/public/notebooks/${slug}/gallery`, form);
    return data;
  },
  async report(slug: string, payload: { targetType: string; targetId: string; reason: string }) {
    await apiClient.post(`/api/public/notebooks/${slug}/report`, payload);
  },
  async trackEvent(slug: string, type: 'notebook_open' | 'write_start' | 'share_click' | 'qr_scan', metadata?: Record<string, unknown>) {
    await apiClient.post(`/api/public/notebooks/${slug}/events`, { type, metadata }).catch(() => undefined);
  },
};

export function isExpiredView(value: PublicNotebook | ExpiredNotebookView): value is ExpiredNotebookView {
  return 'expired' in value && value.expired === true;
}
