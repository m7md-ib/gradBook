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
            className="relative mx-auto w-full max-w-xs sm:max-w-sm"
            style={{ perspective: '1800px' }}
          >
            <div
              className="pointer-events-none absolute inset-0 translate-y-2 translate-x-1 rounded-[10px] bg-black/10 blur-[2px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-1 w-full translate-x-0.5 rounded-[10px] border border-black/5 bg-gold-100"
              aria-hidden
              style={{ transform: 'translate(3px, 3px)' }}
            />
            <motion.div
              animate={stage === 'opening' ? { rotateY: isRtl ? 115 : -115, opacity: 0.4 } : { rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.6, 0.02, 0.2, 1] }}
              onAnimationComplete={() => {
                if (stage === 'opening') setStage('open');
              }}
              style={{ transformOrigin: isRtl ? '100% 50%' : '0% 50%', transformStyle: 'preserve-3d' }}
              className="relative"
            >
              <CoverRenderer {...cover} />
            </motion.div>

            {stage === 'closed' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 flex justify-center"
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
