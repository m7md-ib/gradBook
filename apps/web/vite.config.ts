import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { prerenderSeo } from './seo-prerender';

// The public address search engines should index (canonical links, sitemap).
const SITE_URL = (process.env.VITE_SITE_URL || 'https://daftarjo.vercel.app').replace(/\/+$/, '');

export default defineConfig(({ mode }) => ({
  plugins: [react(), prerenderSeo(SITE_URL)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    // Sourcemaps stay on for dev/preview builds but off for production so
    // the original TypeScript source isn't shipped to every visitor.
    sourcemap: mode !== 'production',
  },
}));
