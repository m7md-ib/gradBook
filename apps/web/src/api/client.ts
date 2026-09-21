import axios, { type AxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
});

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const csrf = getCookie('daftar_csrf');
    if (csrf) {
      config.headers.set('x-csrf-token', csrf);
    }
  }
  return config;
});

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<unknown> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryableConfig | undefined;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise ??= apiClient.post('/api/auth/refresh').finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return apiClient(original);
      } catch {
        // fall through and reject with the original error
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorResponse {
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
}

export function getApiErrorMessage(error: unknown, fallback = 'حدث خطأ غير متوقع، حاول لاحقاً'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.message) return data.error.message;
  }
  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.error?.code;
  }
  return undefined;
}
