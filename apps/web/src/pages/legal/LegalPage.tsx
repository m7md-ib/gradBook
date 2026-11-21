import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatDate } from '@/lib/format';
import { CONTACT_EMAIL, CONTACT_WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import { LEGAL_LAST_UPDATED, PRIVACY, TERMS } from './legalContent';

export default function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const sections = (kind === 'privacy' ? PRIVACY : TERMS)[lang];
  const title = kind === 'privacy' ? t('legal.privacy') : t('legal.terms');

  return (
    <div className="min-h-screen bg-paper">
      <Helmet>
        <title>
          {title} — {t('common.appName')}
        </title>
      </Helmet>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-heading-auto text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink/50">{t('legal.lastUpdated', { date: formatDate(LEGAL_LAST_UPDATED, i18n.language) })}</p>

        <div className="mt-8 flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading-auto text-xl font-bold text-ink">{section.heading}</h2>
              <div className="mt-3 flex flex-col gap-3 leading-relaxed text-ink/75">
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-2xl bg-white/70 p-5 shadow-page">
            <h2 className="font-heading-auto text-lg font-bold text-ink">{t('legal.contact')}</h2>
            <p className="mt-2 text-sm text-ink/70">
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="underline" dir="ltr">
                {CONTACT_WHATSAPP_DISPLAY}
              </a>
              {' · '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <p className="text-sm">
            <Link to={kind === 'privacy' ? '/terms' : '/privacy'} className="font-medium text-maroon-600 hover:underline">
              {kind === 'privacy' ? t('legal.terms') : t('legal.privacy')}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
