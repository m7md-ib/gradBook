import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Seo } from '@/components/Seo';
import { AuroraBackground } from '@/components/landing/AuroraBackground';
import { Reveal, RevealGroup, RevealItem } from '@/components/landing/Reveal';
import { useAuth } from '@/context/AuthContext';
import { seoPageByPath, seoPageJsonLd, type SeoFaq } from '@/seo/pages';
import { SITE_URL } from '@/seo/site';
import { cn } from '@/lib/cn';
import NotFoundPage from '@/pages/NotFoundPage';

function FaqList({ items }: { items: SeoFaq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={cn('rounded-2xl bg-white/85 shadow-page ring-1 ring-ink/5', isOpen && 'ring-gold-300/70')}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 p-5 text-start font-semibold text-ink"
            >
              <h3>{item.q}</h3>
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
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-5 leading-relaxed text-ink/70">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** A search landing page: "دفتر تخرج إلكتروني", "هدية تخرج", a university… (content in seo/content.json). */
export default function SeoPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const page = seoPageByPath(pathname.replace(/\/+$/, '') || '/', new Date().getFullYear());

  if (!page) return <NotFoundPage />;

  const create = () => navigate(isAuthenticated ? '/create' : '/signup');

  return (
    <MotionConfig reducedMotion="user">
      {/* These pages are written in Arabic whatever the interface language. */}
      <div className="min-h-screen bg-paper" dir="rtl" lang="ar">
        <Seo title={page.title} description={page.description} path={page.path} jsonLd={seoPageJsonLd(page, SITE_URL)} />
        <Navbar variant="overlay" />

        <header className="relative isolate overflow-hidden px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
          <AuroraBackground particles={12} />
          <div className="relative mx-auto max-w-3xl text-center">
            <nav aria-label="breadcrumb" className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-white/60">
              {page.breadcrumbs.map((b, i) => (
                <span key={b.path} className="flex items-center gap-1.5">
                  {i > 0 && <Icon name="chevron" className="h-3.5 w-3.5 rotate-180" />}
                  {i === page.breadcrumbs.length - 1 ? (
                    <span className="text-gold-200">{b.label}</span>
                  ) : (
                    <Link to={b.path} className="hover:text-white">
                      {b.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 font-heading-auto text-4xl font-bold leading-tight text-white sm:text-5xl"
            >
              {page.h1}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75"
            >
              {page.lead}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button size="lg" variant="secondary" className="px-9 shadow-xl" onClick={create}>
                ✨ اعمل دفترك الآن
              </Button>
              <Link to="/">
                <Button size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/15">
                  شوف مثال حي
                </Button>
              </Link>
            </motion.div>
          </div>
          <svg className="absolute inset-x-0 bottom-0 h-14 w-full text-paper" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
            <path fill="currentColor" d="M0 40 C 240 90 480 0 720 30 C 960 60 1200 10 1440 40 L1440 80 L0 80 Z" />
          </svg>
        </header>

        <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pb-20 sm:px-6">
          {page.universities && (
            <RevealGroup className="grid gap-3 sm:grid-cols-2" stagger={0.05}>
              {page.universities.map((u) => (
                <RevealItem key={u.path}>
                  <Link
                    to={u.path}
                    className="group flex items-center gap-3 rounded-2xl bg-white/85 p-4 shadow-page ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-page-lg"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-maroon-500 to-night-700 text-lg text-gold-100">🎓</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">دفتر تخرج {u.label}</span>
                      <span className="block text-xs text-ink/50">{u.city}</span>
                    </span>
                    <Icon name="chevron" className="h-4 w-4 rotate-180 text-ink/30 transition group-hover:text-maroon-600" />
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          )}

          {page.sections.map((section) => (
            <Reveal key={section.heading}>
              <section className="rounded-3xl bg-white/85 p-6 shadow-page ring-1 ring-ink/5 sm:p-8">
                <h2 className="font-heading-auto text-2xl font-bold text-ink sm:text-[1.7rem]">{section.heading}</h2>
                {section.body && <p className="mt-3 text-[17px] leading-relaxed text-ink/75">{section.body}</p>}
                {section.steps && (
                  <ol className="mt-5 flex flex-col gap-3">
                    {section.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon-600 text-sm font-bold text-white shadow-sm">
                          {i + 1}
                        </span>
                        <span className="pt-1 leading-relaxed text-ink/80">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {section.bullets && (
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                        <span className="leading-relaxed text-ink/80">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}

          {page.faq.length > 0 && (
            <Reveal>
              <section>
                <h2 className="mb-4 font-heading-auto text-2xl font-bold text-ink sm:text-[1.7rem]">أسئلة شائعة</h2>
                <FaqList items={page.faq} />
              </section>
            </Reveal>
          )}

          <Reveal>
            <section className="relative isolate overflow-hidden rounded-[1.75rem] px-6 py-12 text-center shadow-book">
              <AuroraBackground particles={8} />
              <h2 className="relative font-heading-auto text-3xl font-bold text-white">جاهز تعمل دفترك؟</h2>
              <p className="relative mt-3 text-white/75">بياخد أقل من خمس دقايق، وبتشارك الرابط مع كل حبايبك.</p>
              <Button size="lg" variant="secondary" className="relative mt-7 px-10" onClick={create}>
                🎓 اعمل دفتري
              </Button>
            </section>
          </Reveal>

          {page.related.length > 0 && (
            <nav aria-label="مواضيع قريبة">
              <h2 className="mb-3 font-heading-auto text-xl font-bold text-ink">مواضيع قريبة</h2>
              <div className="flex flex-wrap gap-2">
                {page.related.map((r) => (
                  <Link
                    key={r.path}
                    to={r.path}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-maroon-700 shadow-page ring-1 ring-ink/5 transition hover:bg-maroon-600 hover:text-white"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </main>

        <Footer />
      </div>
    </MotionConfig>
  );
}
