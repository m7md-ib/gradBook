import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
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
