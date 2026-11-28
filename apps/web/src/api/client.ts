import axios, { type AxiosRequestConfig } from 'axios';
import { trackServerWake, warmUp } from '@/lib/serverWake';

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

// Free hosting sleeps when idle: show a notice while it wakes, and start
// waking it the moment the site opens.
trackServerWake(apiClient);
warmUp(apiClient);

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

/** Readable names for request fields, so a validation error says *which* field. */
const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  slug: { ar: 'المعرّف', en: 'Identifier' },
  nameAr: { ar: 'الاسم بالعربي', en: 'Arabic name' },
  nameEn: { ar: 'الاسم بالإنجليزي', en: 'English name' },
  category: { ar: 'الفئة', en: 'Category' },
  fullName: { ar: 'الاسم', en: 'Name' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  newPassword: { ar: 'كلمة المرور الجديدة', en: 'New password' },
  authorName: { ar: 'الاسم', en: 'Name' },
  body: { ar: 'الرسالة', en: 'Message' },
  title: { ar: 'العنوان', en: 'Title' },
  priceCents: { ar: 'السعر', en: 'Price' },
  institution: { ar: 'الجامعة / المدرسة', en: 'Institution' },
  major: { ar: 'التخصص', en: 'Major' },
  graduationYear: { ar: 'سنة التخرج', en: 'Graduation year' },
};

export function getApiErrorMessage(error: unknown, fallback = 'حدث خطأ غير متوقع، حاول لاحقاً'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    // A bare "invalid data" left admins guessing; name the first bad field.
    const firstField = Object.entries(data?.error?.fieldErrors ?? {}).find(([, msgs]) => msgs?.length);
    if (firstField) {
      const [field, msgs] = firstField;
      const isEn = document.documentElement.lang === 'en';
      const label = FIELD_LABELS[field]?.[isEn ? 'en' : 'ar'] ?? field;
      return `${label}: ${msgs[0]}`;
    }
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
