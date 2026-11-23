import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { animate, motion } from 'framer-motion';
import { toast } from 'sonner';
import { CoverRenderer } from '@/components/notebook';
import { useThemes } from '@/hooks/useCatalog';
import { useNotebookStats } from '@/hooks/useNotebook';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { NotebookDto } from '@/types/api';

const STATS = [
  { key: 'totalMessages', labelKey: 'dashboard.statTotalMessages', icon: 'mail', tint: 'from-maroon-500 to-maroon-700' },
  { key: 'totalVisitors', labelKey: 'dashboard.statVisitors', icon: 'eye', tint: 'from-sky-500 to-indigo-600' },
  { key: 'pendingMessages', labelKey: 'dashboard.statPending', icon: 'clock', tint: 'from-gold-400 to-gold-600' },
  { key: 'qrScans', labelKey: 'dashboard.statQrScans', icon: 'qr', tint: 'from-emerald-500 to-teal-600' },
] as const;

const ACTIONS: Array<{ to: string; icon: IconName; titleKey: string; hintKey: string }> = [
  { to: '/dashboard/edit', icon: 'edit', titleKey: 'dashboard.actionEditTitle', hintKey: 'dashboard.actionEditHint' },
  { to: '/dashboard/messages', icon: 'mail', titleKey: 'dashboard.actionMessagesTitle', hintKey: 'dashboard.actionMessagesHint' },
  { to: '/dashboard/share', icon: 'qr', titleKey: 'dashboard.actionShareTitle', hintKey: 'dashboard.actionShareHint' },
  { to: '/dashboard/print', icon: 'download', titleKey: 'dashboard.actionPrintTitle', hintKey: 'dashboard.actionPrintHint' },
];

/** Counts up from 0 the first time the number arrives. */
function CountUp({ value }: { value: number | undefined }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value === undefined) return;
    const controls = animate(0, value, { duration: 0.9, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [value]);
  return <>{value === undefined ? '—' : shown}</>;
}

export default function DashboardOverviewPage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t, i18n } = useTranslation();
  const { data: themes } = useThemes();
  const { data: stats } = useNotebookStats(notebook.id);
  const theme = themes?.find((th) => th.slug === notebook.themeSlug);
  const graduate = notebook.graduates?.[0];
  const name = notebook.type === 'class' ? notebook.title ?? '' : graduate?.fullName ?? '';
  const firstName = name.split(/\s+/)[0] ?? name;
  const url = `${window.location.origin}/d/${notebook.slug}`;
  const pending = stats?.pendingMessages ?? 0;

  async function copy() {
    await navigator.clipboard.writeText(url);
    toast.success(t('common.copied'));
  }
  async function share() {
    const text = t('notebook.sharePreviewText', { name }) ?? '';
    if (navigator.share) {
      try {
        await navigator.share({ url, text, title: text });
      } catch {
        // cancelled
      }
    } else {
      await copy();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>
          {t('dashboard.myNotebook')} — {t('common.appName')}
        </title>
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-night-800 via-maroon-700 to-maroon-600 p-5 text-white shadow-book sm:p-7"
      >
        <div className="absolute -top-16 h-56 w-56 rounded-full bg-gold-400/30 blur-3xl ltr:-right-10 rtl:-left-10" aria-hidden />
        <div className="absolute -bottom-20 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl ltr:-left-10 rtl:-right-10" aria-hidden />

        <div className="relative flex items-start gap-4 sm:gap-6">
          <motion.div
            initial={{ rotate: 0, y: 10, opacity: 0 }}
            animate={{ rotate: -4, y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 16 }}
            className="w-24 shrink-0 sm:w-32"
          >
            <a href={`/d/${notebook.slug}`} target="_blank" rel="noreferrer" aria-label={t('dashboard.openNotebook')}>
              <CoverRenderer
                compact
                theme={theme}
                coverImageUrl={notebook.coverImageUrl}
                coverQuote={null}
                elements={notebook.coverElements}
                overlayOpacity={Number(notebook.coverOverlayOpacity)}
                crop={notebook.coverCrop}
                coverStyle={notebook.coverStyle}
                graduateName={name}
                graduationYear={graduate?.graduationYear}
                className="ring-2 ring-white/20"
              />
            </a>
          </motion.div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-sm text-white/70">{t('dashboard.welcomeBack')} 👋</p>
            <h1 className="mt-0.5 font-heading-auto text-2xl font-bold leading-tight text-gold-100 sm:text-3xl">{firstName}</h1>
            <p className="mt-2 text-xs text-white/60">
              {notebook.expiresAt
                ? t('dashboard.notebookExpiresOn', { date: formatDate(notebook.expiresAt, i18n.language) })
                : notebook.status === 'active'
                  ? t('dashboard.notebookLifetime')
                  : t(`dashboard.status.${notebook.status}`)}
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 ps-3.5 ring-1 ring-white/15 backdrop-blur-md">
          <span className="min-w-0 flex-1 truncate text-sm text-white/85" dir="ltr">
            {url.replace(/^https?:\/\//, '')}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 active:scale-95"
            aria-label={t('common.copy')}
          >
            <Icon name="copy" className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={share}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-gold-400 px-3.5 text-sm font-bold text-ink shadow-md transition hover:bg-gold-300 active:scale-95"
          >
            <Icon name="share" className="h-4 w-4" />
            {t('common.share')}
          </button>
        </div>
      </motion.section>

      {pending > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Link
            to="/dashboard/messages"
            className="flex items-center gap-3 rounded-2xl bg-gold-100 p-4 shadow-page ring-1 ring-gold-300/60 transition active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-400 text-ink">
              <Icon name="mail" />
            </span>
            <span className="flex-1 text-sm font-semibold text-ink">{t('dashboard.pendingCallout', { count: pending })}</span>
            <Icon name="chevron" className="h-4 w-4 text-ink/50 rtl:rotate-180" />
          </Link>
        </motion.div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-heading-auto text-lg font-bold text-ink">{t('dashboard.statsTitle')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="relative overflow-hidden rounded-2xl bg-white/85 p-4 shadow-page ring-1 ring-ink/5"
            >
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', s.tint)}>
                <Icon name={s.icon} className="h-[18px] w-[18px]" />
              </span>
              <div className="mt-3 text-3xl font-bold tabular-nums text-ink">
                <CountUp value={stats?.[s.key]} />
              </div>
              <div className="text-xs text-ink/55">{t(s.labelKey)}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-heading-auto text-lg font-bold text-ink">{t('dashboard.quickActions')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map((a, i) => (
            <motion.div key={a.to} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
              <Link
                to={a.to}
                className="group flex items-center gap-3.5 rounded-2xl bg-white/85 p-4 shadow-page ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-page-lg active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-700 transition group-hover:bg-maroon-600 group-hover:text-white">
                  <Icon name={a.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{t(a.titleKey)}</span>
                  <span className="block truncate text-xs text-ink/55">{t(a.hintKey)}</span>
                </span>
                <Icon name="chevron" className="h-4 w-4 text-ink/30 transition group-hover:text-maroon-600 rtl:rotate-180" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {notebook.type === 'class' && notebook.graduates && (
        <section>
          <h2 className="mb-3 font-heading-auto text-lg font-bold text-ink">
            {t('dashboard.classGraduatesCount', { count: notebook.graduates.length })}
          </h2>
          <div className="flex flex-wrap gap-2">
            {notebook.graduates.map((g) => (
              <span key={g.id} className="rounded-full bg-white/85 px-3 py-1.5 text-sm text-ink/70 shadow-page ring-1 ring-ink/5">
                {g.fullName}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
