import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PageSurface } from './PageSurface';
import { PageContentView } from './PageContentView';
import { FALLBACK_THEME, type NotebookPageContent, type NotebookThemeStyle } from './types';

export interface NotebookBookProps {
  theme?: NotebookThemeStyle;
  pages: NotebookPageContent[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onWriteClick?: () => void;
  className?: string;
}

type FlipState = { direction: 'forward' | 'backward'; outgoing: NotebookPageContent | null } | null;

const FLIP_DURATION = 0.62;

export function NotebookBook({ theme = FALLBACK_THEME, pages, currentIndex, onIndexChange, onWriteClick, className }: NotebookBookProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [flip, setFlip] = useState<FlipState>(null);
  const touchStartX = useRef<number | null>(null);

  const canGoNext = currentIndex < pages.length - 1;
  const canGoPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (!canGoNext || flip) return;
    if (prefersReducedMotion) {
      onIndexChange(currentIndex + 1);
      return;
    }
    setFlip({ direction: 'forward', outgoing: pages[currentIndex] ?? null });
    onIndexChange(currentIndex + 1);
  }, [canGoNext, flip, currentIndex, onIndexChange, pages, prefersReducedMotion]);

  const goPrev = useCallback(() => {
    if (!canGoPrev || flip) return;
    if (prefersReducedMotion) {
      onIndexChange(currentIndex - 1);
      return;
    }
    setFlip({ direction: 'backward', outgoing: pages[currentIndex - 1] ?? null });
    onIndexChange(currentIndex - 1);
  }, [canGoPrev, flip, currentIndex, onIndexChange, pages, prefersReducedMotion]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') isRtl ? goNext() : goPrev();
      if (e.key === 'ArrowLeft') isRtl ? goPrev() : goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, isRtl]);

  const startEdgeOrigin = isRtl ? '100% 50%' : '0% 50%';
  const endEdgeOrigin = isRtl ? '0% 50%' : '100% 50%';

  const leftContent = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const rightContent = pages[currentIndex] ?? null;

  return (
    <div className={cn('flex w-full flex-col items-center gap-4', className)}>
      <div
        className="relative w-full max-w-4xl"
        style={{ perspective: '2400px' }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          const forward = isRtl ? delta > 40 : delta < -40;
          const backward = isRtl ? delta < -40 : delta > 40;
          if (forward) goNext();
          if (backward) goPrev();
          touchStartX.current = null;
        }}
      >
        <div className="absolute inset-x-4 -bottom-3 h-6 rounded-full bg-black/25 blur-xl" aria-hidden />

        {/* Desktop two-page spread */}
        <div className="relative hidden overflow-hidden rounded-lg shadow-book md:grid md:grid-cols-2" style={{ minHeight: 480 }}>
          <div className="absolute inset-y-0 start-1/2 z-10 w-3 -translate-x-1/2 bg-gradient-to-r from-black/15 via-black/5 to-black/15" />

          <PageSurface theme={theme} side="left" pageNumber={leftContent ? currentIndex : undefined}>
            {leftContent ? (
              <PageContentView content={leftContent} onWriteClick={onWriteClick} />
            ) : (
              <div className="flex h-full items-center justify-center opacity-30">
                <span className="text-5xl">📖</span>
              </div>
            )}
          </PageSurface>

          <div className="relative">
            <PageSurface theme={theme} side="right" pageNumber={rightContent ? currentIndex + 1 : undefined}>
              {rightContent && <PageContentView content={rightContent} onWriteClick={onWriteClick} />}
            </PageSurface>

            {flip && (
              <motion.div
                key={`flip-desktop-${currentIndex}-${flip.direction}`}
                className="absolute inset-0 z-20"
                style={{ transformStyle: 'preserve-3d', transformOrigin: flip.direction === 'forward' ? startEdgeOrigin : endEdgeOrigin }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: flip.direction === 'forward' ? -180 : 180 }}
                transition={{ duration: FLIP_DURATION, ease: [0.45, 0, 0.55, 1] }}
                onAnimationComplete={() => setFlip(null)}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                  <PageSurface theme={theme} side="right">
                    {flip.outgoing && <PageContentView content={flip.outgoing} onWriteClick={onWriteClick} />}
                  </PageSurface>
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: theme.paperColor }}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile single page */}
        <div className="relative overflow-hidden rounded-lg shadow-book md:hidden" style={{ minHeight: 420 }}>
          <PageSurface theme={theme} side="single" pageNumber={rightContent ? currentIndex + 1 : undefined}>
            {rightContent && <PageContentView content={rightContent} onWriteClick={onWriteClick} />}
          </PageSurface>

          {flip && (
            <motion.div
              key={`flip-mobile-${currentIndex}-${flip.direction}`}
              className="absolute inset-0 z-20"
              style={{ transformStyle: 'preserve-3d', transformOrigin: flip.direction === 'forward' ? startEdgeOrigin : endEdgeOrigin }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: flip.direction === 'forward' ? -180 : 180 }}
              transition={{ duration: FLIP_DURATION, ease: [0.45, 0, 0.55, 1] }}
              onAnimationComplete={() => setFlip(null)}
            >
              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                <PageSurface theme={theme} side="single">
                  {flip.outgoing && <PageContentView content={flip.outgoing} onWriteClick={onWriteClick} />}
                </PageSurface>
              </div>
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: theme.paperColor }}
              />
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-page transition-opacity disabled:opacity-30 rtl:rotate-180"
          aria-label={t('common.back')}
        >
          ‹
        </button>
        <span className="text-sm text-ink/60">
          {t('notebook.pageOf', { current: currentIndex + 1, total: pages.length })}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-page transition-opacity disabled:opacity-30 rtl:rotate-180"
          aria-label={t('common.next')}
        >
          ›
        </button>
      </div>
    </div>
  );
}
