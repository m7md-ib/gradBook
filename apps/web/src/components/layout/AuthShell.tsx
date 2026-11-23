import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/landing/AuroraBackground';

/**
 * Login / sign-up frame in the landing page's style: the "graduation night"
 * sky on top (beside the form on wide screens) with the form card rising
 * over it.
 */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useTranslation();
  const notes = (t('landing.floatingNotes', { returnObjects: true }) as string[]).slice(0, 3);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.1fr_1fr]">
      <div className="relative isolate overflow-hidden px-6 pb-24 pt-10 text-center lg:flex lg:min-h-screen lg:flex-col lg:items-center lg:justify-center lg:pb-10">
        <AuroraBackground particles={12} />
        <Link to="/" className="relative inline-block font-heading-auto text-3xl font-bold text-gold-200">
          📖 {t('common.appName')}
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-6 font-heading-auto text-3xl font-bold text-white sm:text-4xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mx-auto mt-2 max-w-sm text-white/70"
        >
          {subtitle}
        </motion.p>
        <div className="relative mt-10 hidden flex-wrap justify-center gap-3 lg:flex">
          {notes.map((note, i) => (
            <span
              key={note}
              className="animate-bob rounded-md bg-[#FFFEF9] px-3 py-2 text-sm font-semibold text-maroon-700 shadow-xl"
              style={{ animationDelay: `${-i * 1.4}s`, ['--bob-tilt' as string]: `${(i - 1) * 5}deg` }}
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      <div className="relative -mt-16 px-4 pb-12 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-book ring-1 ring-ink/5 sm:p-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
