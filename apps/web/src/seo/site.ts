/** The public address search engines should index (canonical links). Matches vite.config.ts. */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://daftarjo.vercel.app').replace(/\/+$/, '');
