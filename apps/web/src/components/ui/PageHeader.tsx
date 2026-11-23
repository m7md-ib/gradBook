import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon, type IconName } from './Icon';
import { cn } from '@/lib/cn';

/** Title row for an inner page: an icon tile, the title, a hint line, and optional actions. */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-maroon-500 to-night-700 text-gold-100 shadow-md">
            <Icon name={icon} className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-heading-auto text-2xl font-bold leading-tight text-ink sm:text-[1.7rem]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink/55">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

/** The standard white panel inner pages are built from. */
export function Panel({ children, className, title, hint }: { children: ReactNode; className?: string; title?: ReactNode; hint?: ReactNode }) {
  return (
    <section className={cn('rounded-3xl border border-ink/5 bg-white/80 p-5 shadow-page backdrop-blur-sm sm:p-6', className)}>
      {(title || hint) && (
        <div className="mb-4">
          {title && <h2 className="font-heading-auto text-lg font-bold text-ink">{title}</h2>}
          {hint && <p className="mt-0.5 text-sm text-ink/55">{hint}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
