import axios, { type AxiosRequestConfig } from 'axios';

// In production the API is reached through this site's own origin: vercel.json
// proxies /api/* to the API host. That makes the auth and CSRF cookies
// first-party — as cross-site (third-party) cookies on the API's own domain
// they're blocked by Safari/iOS always and by every browser's private mode,
// which made sign-up and login fail (403) for those visitors. Local dev still
// talks to VITE_API_URL directly (same-site on localhost). Set
// VITE_API_DIRECT=true to call VITE_API_URL directly from a non-Vercel host.
const useSameOrigin = import.meta.env.PROD && import.meta.env.VITE_API_DIRECT !== 'true';

export const apiClient = axios.create({
  baseURL: useSameOrigin ? '' : (import.meta.env.VITE_API_URL as string),
  withCredentials: true,
});

// The API and the frontend can be on different origins in production, and
// page JS can only read cookies set for its own origin — so the CSRF token
// (set on the API's origin) has to come from a JSON response instead of
// document.cookie. Fetched once and cached; the underlying cookie doesn't
// change for the life of the session.
let csrfTokenPromise: Promise<string> | null = null;

function fetchCsrfToken(): Promise<string> {
  csrfTokenPromise ??= apiClient
    .get<{ csrfToken: string }>('/api/csrf-token')
    .then((res) => res.data.csrfToken)
    .catch((error) => {
      csrfTokenPromise = null;
      throw error;
    });
  return csrfTokenPromise;
}

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const csrf = await fetchCsrfToken();
    config.headers.set('x-csrf-token', csrf);
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
