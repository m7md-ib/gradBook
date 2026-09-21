import { apiClient } from '../client';
import type { GraduateDto, NotebookDto, NotebookStats, QrCodeDto } from '@/types/api';

export interface GraduateInfoPayload {
  fullName: string;
  institution: string;
  major: string;
  graduationYear: number;
  graduationDate?: string;
  shortMessage?: string;
}

export interface CreateNotebookPayload {
  notebook: { type: 'individual' | 'class'; themeSlug: string; title?: string };
  graduate: GraduateInfoPayload;
}

export interface CoverCustomizationPayload {
  sourceType: 'template' | 'custom';
  templateSlug?: string;
  crop?: { x: number; y: number; zoom: number };
  overlayOpacity: number;
  quote?: string;
  elements: NotebookDto['coverElements'];
}

export interface NotebookSettingsPayload {
  visibility: 'public' | 'private' | 'invite_only';
  accessCode?: string;
  approvalMode: 'auto' | 'manual';
  allowPhotos: boolean;
  allowGallery: boolean;
  musicEnabled: boolean;
  musicTrackId?: string;
}

export const notebooksEndpoints = {
  async create(payload: CreateNotebookPayload) {
    const { data } = await apiClient.post<{ notebook: NotebookDto; graduate: GraduateDto }>(
      '/api/notebooks',
      payload,
    );
    return data;
  },
  async mine(): Promise<NotebookDto[]> {
    const { data } = await apiClient.get<{ notebooks: NotebookDto[] }>('/api/notebooks/mine');
    return data.notebooks;
  },
  async get(id: string): Promise<NotebookDto> {
    const { data } = await apiClient.get<{ notebook: NotebookDto }>(`/api/notebooks/${id}`);
    return data.notebook;
  },
  async updateSlug(id: string, slug: string): Promise<NotebookDto> {
    const { data } = await apiClient.patch<{ notebook: NotebookDto }>(`/api/notebooks/${id}/slug`, { slug });
    return data.notebook;
  },
  async updateCover(id: string, payload: CoverCustomizationPayload): Promise<NotebookDto> {
    const { data } = await apiClient.patch<{ notebook: NotebookDto }>(`/api/notebooks/${id}/cover`, payload);
    return data.notebook;
  },
  async uploadCoverImage(id: string, file: File): Promise<NotebookDto> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ notebook: NotebookDto }>(`/api/notebooks/${id}/cover/upload`, form);
    return data.notebook;
  },
  async updateSettings(id: string, payload: NotebookSettingsPayload): Promise<NotebookDto> {
    const { data } = await apiClient.patch<{ notebook: NotebookDto }>(`/api/notebooks/${id}/settings`, payload);
    return data.notebook;
  },
  async updateIntro(id: string, payload: { welcomeMessage?: string; showProfilePhoto: boolean }) {
    const { data } = await apiClient.patch<{ notebook: NotebookDto }>(`/api/notebooks/${id}/intro`, payload);
    return data.notebook;
  },
  async stats(id: string): Promise<NotebookStats> {
    const { data } = await apiClient.get<{ stats: NotebookStats }>(`/api/notebooks/${id}/stats`);
    return data.stats;
  },
  async qr(id: string): Promise<QrCodeDto> {
    const { data } = await apiClient.get<{ qr: QrCodeDto }>(`/api/notebooks/${id}/qr`);
    return data.qr;
  },
  async regenerateQr(id: string) {
    const { data } = await apiClient.post<{ qr: QrCodeDto }>(`/api/notebooks/${id}/qr/regenerate`);
    return data.qr;
  },
  async listGraduates(id: string): Promise<GraduateDto[]> {
    const { data } = await apiClient.get<{ graduates: GraduateDto[] }>(`/api/notebooks/${id}/graduates`);
    return data.graduates;
  },
  async addGraduate(id: string, payload: GraduateInfoPayload): Promise<GraduateDto> {
    const { data } = await apiClient.post<{ graduate: GraduateDto }>(`/api/notebooks/${id}/graduates`, payload);
    return data.graduate;
  },
  async updateGraduate(id: string, graduateId: string, payload: Partial<GraduateInfoPayload>) {
    const { data } = await apiClient.patch<{ graduate: GraduateDto }>(
      `/api/notebooks/${id}/graduates/${graduateId}`,
      payload,
    );
    return data.graduate;
  },
  async uploadGraduatePhoto(id: string, graduateId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ graduate: GraduateDto }>(
      `/api/notebooks/${id}/graduates/${graduateId}/photo`,
      form,
    );
    return data.graduate;
  },
  async removeGraduate(id: string, graduateId: string) {
    await apiClient.delete(`/api/notebooks/${id}/graduates/${graduateId}`);
  },
};
