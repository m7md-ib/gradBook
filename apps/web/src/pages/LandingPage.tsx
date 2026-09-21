import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Notebook3D } from '@/components/notebook';
import type { NotebookPageContent } from '@/components/notebook';
import { usePublicNotebook, usePublicMessages } from '@/hooks/usePublicNotebook';
import { isExpiredView } from '@/api/endpoints/public';
import { usePackages } from '@/hooks/useCatalog';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

const DEMO_SLUG = 'sara-2026';

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

  const { data: notebookData } = usePublicNotebook(DEMO_SLUG);
  const notebook = notebookData && !isExpiredView(notebookData) ? notebookData : undefined;
  const { data: messagesData } = usePublicMessages(notebook ? DEMO_SLUG : undefined, 1);
  const { data: packages } = usePackages();

  const pages = useMemo<NotebookPageContent[]>(() => {
    const graduate = notebook?.graduates[0];
    const list: NotebookPageContent[] = [];
    if (graduate) {
      list.push({
        kind: 'intro',
        graduateName: graduate.fullName,
        institution: graduate.institution,
        major: graduate.major,
        profilePhotoUrl: graduate.profilePhotoUrl,
        welcomeMessage: notebook?.welcomeMessage ?? null,
        showProfilePhoto: notebook?.showProfilePhoto ?? true,
      });
    }
    for (const m of messagesData?.items.slice(0, 6) ?? []) {
      list.push({
        kind: 'message',
        id: m.id,
        authorName: m.authorName,
        body: m.body,
        relationship: m.relationship,
        reaction: m.reaction,
        photoUrl: m.photoUrl,
        featured: m.featured,
        pageNumber: m.pageNumber,
      });
    }
    return list;
  }, [notebook, messagesData]);

  const graduate = notebook?.graduates[0];

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
            {graduate ? (
              <Notebook3D
                cover={{
                  coverImageUrl: notebook?.coverImageUrl,
                  coverQuote: notebook?.coverQuote,
                  elements: notebook?.coverElements,
                  graduateName: graduate.fullName,
                  major: graduate.major,
                  institution: graduate.institution,
                  graduationYear: graduate.graduationYear,
                }}
                book={{ pages, currentIndex: 0, onIndexChange: () => undefined }}
                autoOpenLabel={t('landing.openNotebookHint') ?? undefined}
              />
            ) : (
              <div className="aspect-[3/4] w-full animate-pulse rounded-[10px] bg-gold-200/50 shadow-book" />
            )}
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
        </div>
      </section>

      <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
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
