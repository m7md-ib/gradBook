import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './locales/ar.json';
import en from './locales/en.json';

export const RTL_LANGUAGES = new Set(['ar']);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      // Arabic is the platform default regardless of browser/OS locale (spec:
      // "Arabic is the default"); only an explicit in-app switch (persisted here) changes it.
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'daftar_locale',
    },
  });

export function applyDocumentDirection(lang: string) {
  const dir = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

i18n.on('languageChanged', (lng) => {
  applyDocumentDirection(lng);
});

applyDocumentDirection(i18n.language || 'ar');

export default i18n;
