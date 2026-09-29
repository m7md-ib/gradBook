import { apiClient } from '../client';
import type { AuthUser } from '@/types/api';

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  locale: 'ar' | 'en';
}
export interface LoginPayload {
  email: string;
  password: string;
}
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authEndpoints = {
  async signup(payload: SignupPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<{ user: AuthUser }>('/api/auth/signup', payload);
    return data.user;
  },
  async login(payload: LoginPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<{ user: AuthUser }>('/api/auth/login', payload);
    return data.user;
  },
  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<{ user: AuthUser }>('/api/auth/me');
    return data.user;
  },
  async changePassword(payload: ChangePasswordPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<{ user: AuthUser }>('/api/auth/change-password', payload);
    return data.user;
  },
};
