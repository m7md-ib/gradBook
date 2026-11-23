import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CoverRenderer, type CoverRendererProps } from './CoverRenderer';
import { FlipBook, type FlipBookHandle, type Spread } from './FlipBook';
import { PageSurface } from './PageSurface';
import { PageContentView } from './PageContentView';
import { FALLBACK_THEME, type NotebookPageContent, type NotebookThemeStyle } from './types';
import { Button } from '@/components/ui/Button';
import { useMediaQuery, useReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

export interface Notebook3DProps {
  cover: CoverRendererProps;
  book: {
    theme?: NotebookThemeStyle;
    pages: NotebookPageContent[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    onWriteClick?: () => void;
  };
  onOpen?: () => void;
  className?: string;
  autoOpenLabel?: string;
  /** Landing-page demo: opens itself and turns its pages while on screen, until someone touches it. */
  autoplay?: boolean;
  /** Light text for the controls under the book, when it sits on a dark background. */
  onDark?: boolean;
}

/*
 * Spread layout (tablets and up), spread s:
 *   0  → closed: the cover alone, centred
 *   1  → inside of the cover | page 0
 *   s  → page 2s-3 | page 2s-2
 * Single layout (phones): spread 0 is the cover, spread s is page s-1.
 */
const spreadForPage = (wide: boolean, page: number) => (wide ? Math.floor((page + 3) / 2) : page + 1);
const pageForSpread = (wide: boolean, spread: number, count: number) => {
  if (spread <= 0) return 0;
  if (!wide) return Math.min(count - 1, spread - 1);
  return 2 * spread - 2 < count ? 2 * spread - 2 : 2 * spread - 3;
};

function Endpaper({ theme }: { theme: NotebookThemeStyle }) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{
        backgroundColor: theme.coverGradientTo,
        backgroundImage: `radial-gradient(${theme.accentColor}55 1.2px, transparent 1.4px), radial-gradient(${theme.accentColor}33 1.2px, transparent 1.4px), linear-gradient(160deg, ${theme.coverGradientFrom}, ${theme.coverGradientTo})`,
        backgroundSize: '18px 18px, 18px 18px, 100% 100%',
        backgroundPosition: '0 0, 9px 9px, 0 0',
      }}
    >
      <div className="absolute inset-4 rounded-sm border" style={{ borderColor: `${theme.accentColor}66` }} />
      <span className="text-4xl opacity-70 drop-shadow-sm" aria-hidden>
        🎓
      </span>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Notebook3D({ cover, book, onOpen, className, autoOpenLabel, autoplay, onDark }: Notebook3DProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const wide = useMediaQuery('(min-width: 768px)');
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reducedMotion = useReducedMotion();
  const theme = book.theme ?? FALLBACK_THEME;
  const { pages, currentIndex, onIndexChange, onWriteClick } = book;

  const flip = useRef<FlipBookHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const [spread, setSpread] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [opening, setOpening] = useState(false);
  const opened = useRef(false);

  const spreads = useMemo<Spread[]>(() => {
    const page = (i: number, side: 'start' | 'end' | 'single') => {
      const content = pages[i];
      if (!content) return null;
      return (
        <PageSurface theme={theme} side={side} pageNumber={i + 1} ruled={content.kind === 'message'}>
          <PageContentView content={content} onWriteClick={onWriteClick} />
        </PageSurface>
      );
    };
    const coverFace = (
      <div className="h-full w-full">
        <CoverRenderer {...cover} className="h-full rounded-md shadow-none ring-0" />
      </div>
    );
    const endpaper = <Endpaper theme={theme} />;

    if (!wide) return [{ start: null, end: coverFace }, ...pages.map((_, i) => ({ start: null, end: page(i, 'single') }))];

    const list: Spread[] = [
      { start: null, end: coverFace },
      { start: endpaper, end: page(0, 'end') },
    ];
    for (let s = 2; 2 * s - 3 < pages.length; s += 1) {
      list.push({ start: page(2 * s - 3, 'start'), end: page(2 * s - 2, 'end') ?? endpaper });
    }
    return list;
  }, [pages, theme, cover, wide, onWriteClick]);

  const last = spreads.length - 1;

  // Follow the parent's page (and re-map when the layout switches).
  useEffect(() => {
    setSpread((current) => {
      if (current === 0) return 0;
      const target = Math.min(last, spreadForPage(wide, currentIndex));
      return pageForSpread(wide, current, pages.length) === currentIndex && current <= last ? current : target;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, wide, last]);

  const handleSpreadChange = useCallback(
    (next: number) => {
      setSpread(next);
      setOpening(false);
      if (next > 0) {
        if (!opened.current) {
          opened.current = true;
          onOpen?.();
          if (!autoplay) setShowSwipeHint(true);
        }
        onIndexChange(pageForSpread(wide, next, pages.length));
      }
    },
    [onOpen, onIndexChange, wide, pages.length, autoplay],
  );

  useEffect(() => {
    if (!showSwipeHint) return;
    const id = window.setTimeout(() => setShowSwipeHint(false), 4500);
    return () => window.clearTimeout(id);
  }, [showSwipeHint]);

  const interact = useCallback(() => setInteracted(true), []);

  function openBook() {
    interact();
    setOpening(true);
    void flip.current?.next(1.15);
  }

  // Keyboard: arrows follow the reading direction.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (!inView) return;
      interact();
      const forward = (e.key === 'ArrowLeft') === isRtl;
      void (forward ? flip.current?.next() : flip.current?.prev());
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRtl, inView, interact]);

  // Autoplay: open, turn every few seconds, then close back and start over.
  const rewinding = useRef(false);
  useEffect(() => {
    if (!autoplay || reducedMotion || interacted || !inView) return;
    if (spread === 0) rewinding.current = false;
    if (spread >= last) rewinding.current = true;
    const delay = rewinding.current ? (spread >= last ? 2600 : 120) : spread === 0 ? 1300 : 2400;
    const id = window.setTimeout(() => {
      if (rewinding.current) void flip.current?.prev(0.45);
      else {
        if (spread === 0) setOpening(true);
        void flip.current?.next(spread === 0 ? 1.2 : 0.95);
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [autoplay, reducedMotion, interacted, inView, spread, last]);

  // A closed book floats and leans toward the pointer.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 120, damping: 14 });
  const springY = useSpring(tiltY, { stiffness: 120, damping: 14 });
  const closed = spread === 0;
  const tiltEnabled = canHover && !reducedMotion && closed;

  function onTilt(e: ReactPointerEvent<HTMLDivElement>) {
    if (!tiltEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(px * 10);
    tiltX.set(-py * 8);
  }
  function resetTilt() {
    tiltX.set(0);
    tiltY.set(0);
  }
  useEffect(() => {
    if (!closed) resetTilt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closed]);

  const sizeStyle = wide
    ? { width: 'min(100%, 60rem, calc((100svh - 9rem) * 1.5))', aspectRatio: '3 / 2' }
    : { width: 'min(100%, 27rem, calc((100svh - 12rem) * 0.75))', aspectRatio: '3 / 4' };

  const openLabel = autoOpenLabel ?? t('notebook.openButton');
  const pageNumber = pageForSpread(wide, spread, pages.length) + 1;

  return (
    <div ref={rootRef} className={cn('flex w-full flex-col items-center', className)} style={{ overflowX: 'clip' }}>
      <motion.div
        className="flex w-full justify-center py-3"
        style={{ perspective: 1400 }}
        onPointerMove={onTilt}
        onPointerLeave={resetTilt}
      >
        <motion.div
          className="relative flex w-full justify-center"
          style={{ rotateX: springX, rotateY: springY }}
          animate={closed && !reducedMotion ? { y: [0, -7, 0] } : { y: 0 }}
          transition={closed && !reducedMotion ? { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
        >
          <FlipBook
            ref={flip}
            spreads={spreads}
            spread={Math.min(spread, last)}
            onSpreadChange={handleSpreadChange}
            layout={wide ? 'spread' : 'single'}
            isRtl={isRtl}
            centerClosed
            singleBack={(lower) => (lower === 0 ? <Endpaper theme={theme} /> : <PageSurface theme={theme} />)}
            onInteract={interact}
            reducedMotion={reducedMotion}
            nextLabel={t('common.next')}
            prevLabel={t('common.back')}
            style={sizeStyle}
          />

          {/* Closed: the whole cover opens the book, with a pulsing hint on it. */}
          <AnimatePresence>
            {closed && !opening && (
              <motion.button
                key="open-cover"
                type="button"
                onClick={openBook}
                aria-label={openLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="absolute inset-y-0 z-40 flex cursor-pointer items-center justify-center outline-none"
                style={
                  wide
                    ? { width: `calc(${sizeStyle.width} / 2)`, left: '50%', transform: 'translateX(-50%)' }
                    : { width: sizeStyle.width, left: '50%', transform: 'translateX(-50%)' }
                }
              >
                <span className="pointer-events-none relative mt-[28%] inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-maroon-700 shadow-lg backdrop-blur-sm">
                  <span className="absolute inset-0 rounded-full bg-white/60 motion-safe:animate-ping" />
                  <motion.span
                    className="relative text-base"
                    animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    👆
                  </motion.span>
                  <span className="relative">{t('notebook.tapToOpen')}</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <div className="relative mt-4 flex min-h-[3.25rem] w-full items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {closed && !opening ? (
            <motion.div
              key="open"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <Button size="lg" variant={onDark ? 'secondary' : 'primary'} onClick={openBook} className="shadow-lg">
                📖 {openLabel}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    interact();
                    void flip.current?.prev();
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-maroon-700 shadow-page ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-page-lg active:scale-95 ltr:rotate-180"
                  aria-label={t('common.back')}
                >
                  <ChevronIcon />
                </button>
                <span className={cn('min-w-[7rem] text-center text-sm tabular-nums', onDark ? 'text-white/75' : 'text-ink/60')}>
                  {t('notebook.pageOf', { current: pageNumber, total: pages.length })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    interact();
                    void flip.current?.next();
                  }}
                  disabled={spread >= last}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon-600 text-white shadow-page transition hover:-translate-y-0.5 hover:shadow-page-lg active:scale-95 disabled:opacity-30 rtl:rotate-180"
                  aria-label={t('common.next')}
                >
                  <ChevronIcon />
                </button>
              </div>
              <AnimatePresence>
                {showSwipeHint && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn('text-xs', onDark ? 'text-white/60' : 'text-ink/50')}
                  >
                    {t(wide ? 'notebook.dragHint' : 'notebook.swipeHint')}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
