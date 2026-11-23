import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import '@/i18n/config';
import '@/i18n/zodErrorMap';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthContext';
import App from './App';
import '@/styles/globals.css';

// The built HTML carries the page's search tags for crawlers; once the app
// runs, react-helmet manages them per route, so drop the static copies (they
// would otherwise linger as duplicates after navigating to another page).
document.querySelectorAll('[data-prerender]').forEach((el) => el.remove());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <Toaster position="top-center" richColors closeButton dir="auto" />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
