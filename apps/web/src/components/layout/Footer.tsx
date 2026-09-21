import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-ink/10 bg-paper py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
        <div className="font-heading-auto text-xl font-bold text-maroon-700">{t('common.appName')}</div>
        <p className="max-w-md text-sm text-ink/60">{t('landing.footerTagline')}</p>
        <p className="text-xs text-ink/40">
          © {new Date().getFullYear()} {t('common.appName')} — {t('landing.footerRights')}
        </p>
      </div>
    </footer>
  );
}
