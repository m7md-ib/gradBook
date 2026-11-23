import { useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Notebook3D } from '@/components/notebook';
import type { NotebookPageContent } from '@/components/notebook';
import { AuroraBackground } from '@/components/landing/AuroraBackground';
import { MessageMarquee, type MarqueeMessage } from '@/components/landing/MessageMarquee';
import { Reveal, RevealGroup, RevealItem } from '@/components/landing/Reveal';
import { useConfetti } from '@/components/landing/Confetti';
import { usePackages } from '@/hooks/useCatalog';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { CONTACT_WHATSAPP, whatsappLink } from '@/lib/contact';
import { Seo } from '@/components/Seo';
import { HOME_META, homeJsonLd } from '@/seo/pages';
import { SITE_URL } from '@/seo/site';
import { cn } from '@/lib/cn';

interface SampleMessage {
  author: string;
  relationship: string;
  body: string;
  reaction: string;
}

const FEATURES = [
  { icon: '📖', titleKey: 'landing.featureNotebookTitle', descKey: 'landing.featureNotebookDesc', tint: 'from-gold-200/70' },
  { icon: '💌', titleKey: 'landing.featureMessagesTitle', descKey: 'landing.featureMessagesDesc', tint: 'from-maroon-300/40' },
  { icon: '🔒', titleKey: 'landing.featurePrivacyTitle', descKey: 'landing.featurePrivacyDesc', tint: 'from-sky-200/60' },
  { icon: '📱', titleKey: 'landing.featureMobileTitle', descKey: 'landing.featureMobileDesc', tint: 'from-emerald-200/60' },
] as const;

const STEPS = [
  { icon: '🖊️', titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
  { icon: '🔗', titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
  { icon: '💌', titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
  { icon: '💛', titleKey: 'landing.step4Title', descKey: 'landing.step4Desc' },
] as const;

/** Positions of the little notes floating around the hero book (percent of its stage). */
const FLOATING_NOTES = [
  { top: '6%', start: '-4%', tilt: '-8deg', delay: '0s' },
  { top: '58%', start: '-8%', tilt: '6deg', delay: '-1.6s' },
  { top: '14%', end: '-6%', tilt: '7deg', delay: '-3.1s' },
  { top: '66%', end: '-3%', tilt: '-5deg', delay: '-2.2s' },
];

function SectionHeading({ title, subtitle, light }: { title: string; subtitle?: string; light?: boolean }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className={cn('font-heading-auto text-3xl font-bold sm:text-[2.6rem] sm:leading-tight', light ? 'text-white' : 'text-ink')}>
        {title}
      </h2>
      <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 via-maroon-400 to-gold-400" />
      {subtitle && <p className={cn('mt-4 text-lg', light ? 'text-white/70' : 'text-ink/60')}>{subtitle}</p>}
    </Reveal>
  );
}

/** A card that lights up where the pointer is and leans toward it. */
function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  function onMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
  }
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onMouseMove={onMove}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-ink/5 bg-white/80 shadow-page transition-shadow duration-300 hover:shadow-page-lg',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(260px circle at var(--x) var(--y), rgba(201,168,118,0.22), transparent 70%)' }}
        aria-hidden
      />
      {children}
    </motion.div>
  );
}

function HowItWorks() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] });
  const line = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="how-it-works" className="relative scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <SectionHeading title={t('landing.sectionHowTitle')} subtitle={t('landing.sectionHowSubtitle')} />
      <div ref={ref} className="relative mx-auto mt-16 max-w-6xl">
        {/* The path between the steps draws itself as you scroll. */}
        <div className="absolute inset-x-[12%] top-10 hidden h-0.5 rounded-full bg-ink/10 lg:block" aria-hidden>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-maroon-500 via-gold-500 to-maroon-500"
            style={{ scaleX: line, transformOrigin: isRtl ? 'right' : 'left' }}
          />
        </div>
        <div className="absolute bottom-10 top-10 start-10 w-0.5 rounded-full bg-ink/10 lg:hidden" aria-hidden>
          <motion.div className="w-full rounded-full bg-gradient-to-b from-maroon-500 to-gold-500" style={{ height: '100%', scaleY: line, transformOrigin: 'top' }} />
        </div>

        <RevealGroup className="relative grid gap-10 lg:grid-cols-4 lg:gap-6" stagger={0.15}>
          {STEPS.map((step, i) => (
            <RevealItem key={step.titleKey} className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center">
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-gold-100 text-3xl shadow-page-lg ring-4 ring-paper"
              >
                {step.icon}
                <span className="absolute -top-1 rounded-full bg-maroon-600 px-2 py-0.5 text-xs font-bold text-white shadow ltr:-right-1 rtl:-left-1">
                  {i + 1}
                </span>
              </motion.div>
              <div className="pt-2 lg:pt-0">
                <h3 className="font-heading-auto text-xl font-bold text-ink">{t(step.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{t(step.descKey)}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);
  const items = t('landing.faq', { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <RevealGroup className="mt-12 flex flex-col gap-3" stagger={0.07}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <RevealItem key={item.q}>
            <div className={cn('rounded-2xl bg-white/80 shadow-page transition-shadow', isOpen && 'shadow-page-lg ring-1 ring-gold-300/60')}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 p-5 text-start font-semibold text-ink"
              >
                {item.q}
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-xl text-maroon-600"
                  aria-hidden
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 leading-relaxed text-ink/70">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: packages } = usePackages();
  const [confetti, fireConfetti] = useConfetti();
  const isAr = i18n.language === 'ar';

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
      { kind: 'end', graduateName: sample.graduateName },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );
  const cover = useMemo(
    () => ({
      coverQuote: sample.quote,
      graduateName: sample.graduateName,
      major: sample.major,
      institution: sample.institution,
      graduationYear: new Date().getFullYear(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );
  const [samplePage, setSamplePage] = useState(0);

  // Hero parallax: the text drifts up and fades a little as the page scrolls.
  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 600], [0, -60]);
  const heroFade = useTransform(scrollY, [0, 500], [1, 0.4]);

  function goCreate(e?: MouseEvent<HTMLElement>) {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      window.setTimeout(() => navigate(isAuthenticated ? '/create' : '/signup'), 550);
      return;
    }
    navigate(isAuthenticated ? '/create' : '/signup');
  }

  // "Make your graduation a book…" — the part after the ellipsis gets the gold treatment.
  const [titleLead, titleRest] = (() => {
    const title = t('landing.heroTitle');
    const match = title.match(/^(.*?(?:\.\.\.|…))\s*(.*)$/);
    return match ? [match[1], match[2]] : [title, ''];
  })();
  const words = (text: string) => text.split(/\s+/).filter(Boolean);
  const trust = t('landing.heroTrust', { returnObjects: true }) as string[];
  const notes = t('landing.floatingNotes', { returnObjects: true }) as string[];
  const wall = t('landing.wallMessages', { returnObjects: true }) as MarqueeMessage[];

  let wordIndex = 0;
  const animatedWords = (text: string, className?: string) =>
    words(text).map((word) => {
      const delay = 0.25 + wordIndex++ * 0.07;
      return (
        <motion.span
          key={`${word}-${delay}`}
          className={cn('inline-block', className)}
          initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}&nbsp;
        </motion.span>
      );
    });

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-paper">
        <Seo
          title={isAr ? HOME_META.title : `${t('common.appName')} — ${t('landing.heroTitle')}`}
          description={isAr ? HOME_META.description : t('landing.heroSubtitle') ?? ''}
          path="/"
          jsonLd={homeJsonLd(SITE_URL, t('landing.faq', { returnObjects: true }) as Array<{ q: string; a: string }>, `+${CONTACT_WHATSAPP}`)}
        />
        <Navbar variant="overlay" />
        {confetti}

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden px-4 pb-28 pt-28 sm:px-6 sm:pt-32 lg:min-h-[100svh] lg:px-8">
          <AuroraBackground />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
            <motion.div style={{ y: heroTextY, opacity: heroFade }} className="text-center lg:text-start">
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-gold-300/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-gold-100 backdrop-blur-md"
              >
                <span aria-hidden>🎓</span>
                {t('landing.heroBadge')}
                <span
                  className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.25)_50%,transparent_65%)] bg-[length:200%_100%]"
                  aria-hidden
                />
              </motion.span>

              <h1 className="mt-6 font-heading-auto text-[2.5rem] font-bold leading-[1.3] text-white sm:text-6xl sm:leading-[1.25] lg:text-[4.1rem]">
                {animatedWords(titleLead)}
                {titleRest && (
                  <>
                    <br className="hidden sm:block" />
                    {animatedWords(
                      titleRest,
                      'bg-gradient-to-l from-gold-200 via-gold-400 to-[#F4C95D] bg-clip-text text-transparent ltr:bg-gradient-to-r',
                    )}
                  </>
                )}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9 }}
                className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/75 lg:mx-0"
              >
                {t('landing.heroSubtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.05 }}
                className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative">
                  <span className="absolute -inset-1 animate-pulse rounded-2xl bg-gold-400/40 blur-lg" aria-hidden />
                  <Button size="lg" variant="secondary" className="relative px-9 shadow-xl" onClick={goCreate}>
                    ✨ {t('landing.ctaPrimary')}
                  </Button>
                </motion.div>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="border-white/25 bg-white/5 text-white backdrop-blur-md hover:bg-white/15">
                    {t('landing.ctaSecondary')}
                  </Button>
                </a>
              </motion.div>

              <motion.ul
                initial="hidden"
                animate="shown"
                variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.12, delayChildren: 1.3 } } }}
                className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/70 lg:justify-start"
              >
                {trust.map((item) => (
                  <motion.li
                    key={item}
                    variants={{ hidden: { opacity: 0, x: isAr ? 10 : -10 }, shown: { opacity: 1, x: 0 } }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 text-[11px] text-gold-200">✓</span>
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-2xl"
            >
              {/* Spotlight behind the book */}
              <div className="absolute inset-[8%] rounded-full bg-gold-300/25 blur-[80px]" aria-hidden />
              {notes.slice(0, FLOATING_NOTES.length).map((note, i) => {
                const pos = FLOATING_NOTES[i];
                return (
                  <span
                    key={note}
                    className={cn(
                      'absolute z-10 hidden animate-bob rounded-md bg-[#FFFEF9] px-3 py-2 text-sm font-semibold text-maroon-700 shadow-xl ring-1 ring-black/5 sm:block',
                      i > 1 && 'lg:block',
                    )}
                    style={
                      {
                        top: pos.top,
                        insetInlineStart: pos.start,
                        insetInlineEnd: pos.end,
                        animationDelay: pos.delay,
                        '--bob-tilt': pos.tilt,
                      } as CSSProperties
                    }
                    aria-hidden
                  >
                    {note}
                  </span>
                );
              })}
              <p className="relative mb-1 text-center text-xs font-medium tracking-wide text-white/50">{t('landing.sampleLabel')}</p>
              <Notebook3D
                className="relative"
                cover={cover}
                book={{ pages, currentIndex: samplePage, onIndexChange: setSamplePage }}
                autoOpenLabel={t('landing.openNotebookHint') ?? undefined}
                autoplay
                onDark
              />
            </motion.div>
          </div>

          <a
            href="#how-it-works"
            className="absolute bottom-16 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-white/60 transition-colors hover:text-white lg:flex"
          >
            <span className="flex h-9 w-6 justify-center rounded-full border-2 border-white/40 pt-1.5">
              <span className="h-2 w-1 animate-scroll-dot rounded-full bg-white/80" />
            </span>
            {t('landing.scrollHint')}
          </a>

          {/* Wave into the page below */}
          <svg className="absolute inset-x-0 bottom-0 h-14 w-full text-paper sm:h-20" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
            <path fill="currentColor" d="M0 40 C 240 90 480 0 720 30 C 960 60 1200 10 1440 40 L1440 80 L0 80 Z" />
          </svg>
        </section>

        <HowItWorks />

        {/* ── Message wall ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-gold-50 to-paper py-24">
          <SectionHeading title={t('landing.wallTitle')} subtitle={t('landing.wallSubtitle')} />
          <Reveal delay={0.1} className="mt-12">
            <MessageMarquee messages={wall} />
          </Reveal>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading title={t('landing.sectionFeaturesTitle')} />
          <RevealGroup className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <RevealItem key={f.titleKey}>
                <SpotlightCard className="h-full p-7">
                  <div
                    className={cn(
                      'mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br to-white text-3xl shadow-inner transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110',
                      f.tint,
                    )}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-heading-auto text-xl font-bold text-ink">{t(f.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{t(f.descKey)}</p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 bg-gradient-to-b from-paper via-gold-50 to-paper px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading title={t('landing.sectionPricingTitle')} subtitle={t('landing.sectionPricingSubtitle')} />
          <RevealGroup className="mx-auto mt-14 grid max-w-6xl items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages?.map((pkg, i) => {
              const featured = i === 1;
              const card = (
                <div
                  className={cn(
                    'relative flex h-full flex-col gap-4 rounded-[1.4rem] p-8 text-start',
                    featured ? 'bg-gradient-to-br from-maroon-600 to-night-700 text-white' : 'bg-white/85',
                  )}
                >
                  {featured && (
                    <span className="absolute -top-3.5 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-3.5 py-1 text-xs font-bold text-ink shadow-md ltr:left-6 rtl:right-6">
                      ⭐ {t('landing.pricingMostPopular')}
                    </span>
                  )}
                  <h3 className="font-heading-auto text-2xl font-bold">{isAr ? pkg.nameAr : pkg.nameEn}</h3>
                  <p className={cn('text-4xl font-bold', featured ? 'text-gold-200' : 'text-maroon-700')}>
                    {formatCurrency(pkg.priceCents, pkg.currency, i18n.language)}
                    <span className={cn('ms-2 text-sm font-medium', featured ? 'text-white/70' : 'text-ink/50')}>
                      {t(`packageDuration.${pkg.duration}`, '')}
                    </span>
                  </p>
                  <p className={featured ? 'text-white/80' : 'text-ink/60'}>{isAr ? pkg.descriptionAr : pkg.descriptionEn}</p>
                  <ul className={cn('flex flex-1 flex-col gap-2.5 text-sm', featured ? 'text-white/90' : 'text-ink/70')}>
                    {pkg.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]',
                            featured ? 'bg-gold-400/25 text-gold-200' : 'bg-maroon-50 text-maroon-600',
                          )}
                        >
                          ✓
                        </span>
                        <span>{t(`packageFeatures.${feature}`, feature)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-2" variant={featured ? 'secondary' : 'primary'} onClick={goCreate}>
                    {t('landing.pricingCta')}
                  </Button>
                </div>
              );
              return (
                <RevealItem key={pkg.id} className={cn(featured && 'lg:-translate-y-4')}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className={cn(
                      'h-full rounded-3xl p-[2px]',
                      featured
                        ? 'animate-gradient-pan bg-[linear-gradient(120deg,#C9A876,#8C1D28,#F4C95D,#8C1D28,#C9A876)] bg-[length:300%_300%] shadow-book'
                        : 'bg-ink/5 shadow-page hover:shadow-page-lg',
                    )}
                  >
                    {card}
                  </motion.div>
                </RevealItem>
              );
            })}
          </RevealGroup>
          <Reveal>
            <p className="mt-10 text-center text-sm text-ink/60">{t('landing.paymentNote')}</p>
          </Reveal>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <SectionHeading title={t('landing.faqTitle')} />
            <Faq />
            <Reveal className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="text-ink/60">{t('landing.contactTitle')}</p>
              <a href={whatsappLink()} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-full">
                  💬 {t('landing.contactCta')}
                </Button>
              </a>
            </Reveal>
          </div>
        </section>

        {/* ── Final call to action ─────────────────────────────────────── */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative isolate mx-auto max-w-5xl overflow-hidden rounded-[2rem] px-6 py-16 text-center shadow-book sm:px-12 sm:py-20">
              <AuroraBackground particles={10} />
              <h2 className="relative font-heading-auto text-3xl font-bold text-white sm:text-5xl">{t('landing.finalCtaTitle')}</h2>
              <p className="relative mt-4 text-lg text-white/75">{t('landing.finalCtaSubtitle')}</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="relative mt-9 inline-block">
                <span className="absolute -inset-1 animate-pulse rounded-2xl bg-gold-400/40 blur-lg" aria-hidden />
                <Button size="lg" variant="secondary" className="relative px-10 shadow-xl" onClick={goCreate}>
                  🎓 {t('landing.ctaPrimary')}
                </Button>
              </motion.div>
            </div>
          </Reveal>
        </section>

        <Footer />
      </div>
    </MotionConfig>
  );
}
