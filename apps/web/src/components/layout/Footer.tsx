import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CONTACT_EMAIL, CONTACT_WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-ink/10 bg-paper py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
        <div className="font-heading-auto text-xl font-bold text-maroon-700">{t('common.appName')}</div>
        <p className="max-w-md text-sm text-ink/60">{t('landing.footerTagline')}</p>
        <p className="text-xs text-ink/50">
          <a href={whatsappLink()} target="_blank" rel="noreferrer" className="hover:text-ink/80 hover:underline" dir="ltr">
            {CONTACT_WHATSAPP_DISPLAY}
          </a>
          {' · '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink/80 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <nav className="flex gap-4 text-xs text-ink/50">
          <Link to="/terms" className="hover:text-ink/80 hover:underline">
            {t('legal.terms')}
          </Link>
          <Link to="/privacy" className="hover:text-ink/80 hover:underline">
            {t('legal.privacy')}
          </Link>
        </nav>
        <p className="text-xs text-ink/40">
          © {new Date().getFullYear()} {t('common.appName')} — {t('landing.footerRights')}
        </p>
      </div>
    </footer>
  );
}
