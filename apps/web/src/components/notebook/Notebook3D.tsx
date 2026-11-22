import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CoverRenderer, type CoverRendererProps } from './CoverRenderer';
import { NotebookBook, type NotebookBookProps } from './NotebookBook';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface Notebook3DProps {
  cover: CoverRendererProps;
  book: Omit<NotebookBookProps, 'className'>;
  onOpen?: () => void;
  className?: string;
  autoOpenLabel?: string;
}

export function Notebook3D({ cover, book, onOpen, className, autoOpenLabel }: Notebook3DProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>('closed');
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function handleOpen() {
    onOpen?.();
    if (prefersReducedMotion) {
      setStage('open');
      return;
    }
    setStage('opening');
  }

  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <AnimatePresence mode="wait">
        {stage !== 'open' ? (
          <motion.div
            key="closed-book"
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex w-full flex-col items-center"
            // Sized so the cover *and* the open button fit on one phone screen.
            style={{ maxWidth: 'min(24rem, calc((100svh - 13rem) * 0.75))' }}
          >
            {/* The whole cover is the button: visitors kept tapping the cover. */}
            <button
              type="button"
              onClick={handleOpen}
              disabled={stage !== 'closed'}
              aria-label={autoOpenLabel ?? t('notebook.openButton')}
              className="group relative block w-full cursor-pointer rounded-[10px] text-start outline-none focus-visible:ring-4 focus-visible:ring-maroon-300"
              style={{ perspective: '1800px' }}
            >
              <div
                className="pointer-events-none absolute inset-0 translate-x-1 translate-y-2 rounded-[10px] bg-black/10 blur-[2px]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-[10px] border border-black/5 bg-gold-100"
                aria-hidden
                style={{ transform: 'translate(4px, 4px)' }}
              />
              <motion.div
                animate={stage === 'opening' ? { rotateY: isRtl ? 115 : -115, opacity: 0.4 } : { rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.32, 0, 0.15, 1] }}
                onAnimationComplete={() => {
                  if (stage === 'opening') setStage('open');
                }}
                style={{ transformOrigin: isRtl ? '100% 50%' : '0% 50%', transformStyle: 'preserve-3d' }}
                className="relative transition-transform duration-300 group-hover:-translate-y-1"
              >
                <CoverRenderer {...cover} />

                {stage === 'closed' && (
                  <span className="pointer-events-none absolute inset-x-0 top-[38%] flex justify-center" aria-hidden>
                    <span className="relative inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-maroon-700 shadow-lg backdrop-blur-sm">
                      <span className="absolute inset-0 animate-ping rounded-full bg-white/50" />
                      <span className="relative text-base">👆</span>
                      <span className="relative">{t('notebook.tapToOpen')}</span>
                    </span>
                  </span>
                )}
              </motion.div>
            </button>

            {stage === 'closed' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 mt-7 flex justify-center"
              >
                <Button size="lg" onClick={handleOpen} className="shadow-lg">
                  📖 {autoOpenLabel ?? t('notebook.openButton')}
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="open-book"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <NotebookBook {...book} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
