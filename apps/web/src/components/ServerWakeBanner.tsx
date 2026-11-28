import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useServerWaking } from '@/lib/serverWake';

/** Shown while the API is slow to answer (usually: waking up from sleep). */
export function ServerWakeBanner() {
  const { t } = useTranslation();
  const waking = useServerWaking();
  return (
    <AnimatePresence>
      {waking && (
        <motion.div
          role="status"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-4"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-2.5 rounded-full bg-night-800/95 px-4 py-2.5 text-sm font-semibold text-gold-100 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute h-full w-full animate-ping rounded-full bg-gold-400/50" />
              <span className="h-2 w-2 rounded-full bg-gold-400" />
            </span>
            {t('common.serverWaking')}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
