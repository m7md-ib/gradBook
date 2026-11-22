import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Notebook3D } from '@/components/notebook';
import type { NotebookPageContent } from '@/components/notebook';
import { usePackages } from '@/hooks/useCatalog';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { whatsappLink } from '@/lib/contact';

interface SampleMessage {
  author: string;
  relationship: string;
  body: string;
  reaction: string;
}

const FEATURES = [
  { icon: '📖', titleKey: 'landing.featureNotebookTitle', descKey: 'landing.featureNotebookDesc' },
  { icon: '💌', titleKey: 'landing.featureMessagesTitle', descKey: 'landing.featureMessagesDesc' },
  { icon: '🔒', titleKey: 'landing.featurePrivacyTitle', descKey: 'landing.featurePrivacyDesc' },
  { icon: '📱', titleKey: 'landing.featureMobileTitle', descKey: 'landing.featureMobileDesc' },
] as const;

const STEPS = [
  { icon: '🖊️', titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
  { icon: '🔗', titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
  { icon: '💌', titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
  { icon: '💛', titleKey: 'landing.step4Title', descKey: 'landing.step4Desc' },
] as const;

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: packages } = usePackages();

  // A fixed, clearly-labelled example rather than a live demo notebook: it
  // renders instantly (no wait on a sleeping API) and never puts a real
  // person's notebook on the homepage.
  const sample = {
    graduateName: t('landing.sample.graduateName'),
    institution: t('landing.sample.institution'),
    major: t('landing.sample.major'),
    quote: t('landing.sample.quote'),
    welcome: t('landing.sample.welcome'),
    messages: t('landing.sample.messages', { returnObjects: true }) as SampleMessage[],
  };

  const pages = useMemo<NotebookPageContent[]>(
    () => [
      {
        kind: 'intro',
        graduateName: sample.graduateName,
        institution: sample.institution,
        major: sample.major,
        profilePhotoUrl: null,
        welcomeMessage: sample.welcome,
        showProfilePhoto: false,
      },
      ...sample.messages.map(
        (m, i): NotebookPageContent => ({
          kind: 'message',
          id: `sample-${i}`,
          authorName: m.author,
          body: m.body,
          relationship: m.relationship as Extract<NotebookPageContent, { kind: 'message' }>['relationship'],
          reaction: m.reaction,
          photoUrl: null,
          featured: i === 0,
          pageNumber: i + 1,
        }),
      ),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );

  function goCreate() {
    navigate(isAuthenticated ? '/create' : '/signup');
  }

  return (
    <div className="min-h-screen bg-paper">
      <Helmet>
        <title>{t('common.appName')} — {t('landing.heroTitle')}</title>
        <meta name="description" content={t('landing.heroSubtitle') ?? ''} />
      </Helmet>
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up text-center lg:text-start">
            <h1 className="font-heading-auto text-4xl font-bold leading-[1.25] text-ink sm:text-5xl lg:text-[3.2rem]">
              {t('landing.heroTitle')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink/70 lg:mx-0">{t('landing.heroSubtitle')}</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" onClick={goCreate}>
                {t('landing.ctaPrimary')}
              </Button>
              <a href="#how-it-works">
                <Button size="lg" variant="outline">
                  {t('landing.ctaSecondary')}
                </Button>
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <p className="mb-3 text-center text-xs font-medium text-ink/50">{t('landing.sampleLabel')}</p>
            <Notebook3D
              cover={{
                coverQuote: sample.quote,
                graduateName: sample.graduateName,
                major: sample.major,
                institution: sample.institution,
                graduationYear: new Date().getFullYear(),
              }}
              book={{ pages, currentIndex: 0, onIndexChange: () => undefined }}
              autoOpenLabel={t('landing.openNotebookHint') ?? undefined}
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading-auto text-3xl font-bold text-ink sm:text-4xl">{t('landing.sectionHowTitle')}</h2>
          <p className="mt-3 text-ink/60">{t('landing.sectionHowSubtitle')}</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.titleKey} className="relative flex flex-col items-center gap-3 rounded-2xl bg-paper p-6 shadow-page">
                <span className="absolute -top-3 rounded-full bg-maroon-600 px-3 py-1 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-4xl">{step.icon}</span>
                <h3 className="font-heading-auto text-lg font-bold text-ink">{t(step.titleKey)}</h3>
                <p className="text-sm text-ink/60">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading-auto text-3xl font-bold text-ink sm:text-4xl">
            {t('landing.sectionFeaturesTitle')}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.titleKey} className="flex flex-col items-center gap-3 rounded-2xl border border-ink/5 p-6 text-center">
                <span className="text-4xl">{f.icon}</span>
                <h3 className="font-heading-auto text-lg font-bold text-ink">{t(f.titleKey)}</h3>
                <p className="text-sm text-ink/60">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading-auto text-3xl font-bold text-ink sm:text-4xl">{t('landing.sectionPricingTitle')}</h2>
          <p className="mt-3 text-ink/60">{t('landing.sectionPricingSubtitle')}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages?.map((pkg, i) => (
              <div
                key={pkg.id}
                className={`relative flex flex-col gap-4 rounded-2xl border p-8 text-start ${
                  i === 1 ? 'border-maroon-500 bg-maroon-600 text-white shadow-book' : 'border-ink/10 bg-paper'
                }`}
              >
                {i === 1 && (
                  <span className="absolute -top-3 rtl:right-6 ltr:left-6 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-ink">
                    {t('landing.pricingMostPopular')}
                  </span>
                )}
                <h3 className="font-heading-auto text-2xl font-bold">{i18n.language === 'ar' ? pkg.nameAr : pkg.nameEn}</h3>
                <p className={`text-3xl font-bold ${i === 1 ? 'text-gold-200' : 'text-maroon-700'}`}>
                  {formatCurrency(pkg.priceCents, pkg.currency, i18n.language)}
                  <span className={`ms-2 text-sm font-medium ${i === 1 ? 'text-white/70' : 'text-ink/50'}`}>
                    {t(`packageDuration.${pkg.duration}`, '')}
                  </span>
                </p>
                <p className={i === 1 ? 'text-white/80' : 'text-ink/60'}>
                  {i18n.language === 'ar' ? pkg.descriptionAr : pkg.descriptionEn}
                </p>
                <ul className={`flex flex-col gap-2 text-sm ${i === 1 ? 'text-white/90' : 'text-ink/70'}`}>
                  {pkg.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span>✓</span>
                      <span>{t(`packageFeatures.${f}`, f)}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-2"
                  variant={i === 1 ? 'secondary' : 'primary'}
                  onClick={goCreate}
                >
                  {t('landing.pricingCta')}
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-ink/60">{t('landing.paymentNote')}</p>
        </div>
      </section>

      <section id="faq" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading-auto text-3xl font-bold text-ink sm:text-4xl">{t('landing.faqTitle')}</h2>
          <div className="mt-10 flex flex-col gap-3">
            {(t('landing.faq', { returnObjects: true }) as Array<{ q: string; a: string }>).map((item) => (
              <details key={item.q} className="group rounded-xl bg-white/70 p-5 shadow-page">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {item.q}
                  <span className="text-maroon-600 transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink/70">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-ink/60">{t('landing.contactTitle')}</p>
            <a href={whatsappLink()} target="_blank" rel="noreferrer">
              <Button variant="outline">💬 {t('landing.contactCta')}</Button>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white/50 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading-auto text-3xl font-bold text-ink sm:text-4xl">{t('landing.finalCtaTitle')}</h2>
        <p className="mt-3 text-ink/60">{t('landing.finalCtaSubtitle')}</p>
        <Button size="lg" className="mt-6" onClick={goCreate}>
          {t('landing.ctaPrimary')}
        </Button>
      </section>

      <Footer />
    </div>
  );
}
