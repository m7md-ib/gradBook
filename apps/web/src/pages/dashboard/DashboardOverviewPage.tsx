import { useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { CoverRenderer } from '@/components/notebook';
import { useThemes } from '@/hooks/useCatalog';
import { useNotebookStats } from '@/hooks/useNotebook';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import type { NotebookDto } from '@/types/api';

const STAT_KEYS = [
  { key: 'totalMessages', labelKey: 'dashboard.statTotalMessages', icon: '💌' },
  { key: 'pendingMessages', labelKey: 'dashboard.statPending', icon: '⏳' },
  { key: 'totalVisitors', labelKey: 'dashboard.statVisitors', icon: '👀' },
  { key: 'qrScans', labelKey: 'dashboard.statQrScans', icon: '📱' },
] as const;

export default function DashboardOverviewPage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t, i18n } = useTranslation();
  const { data: themes } = useThemes();
  const { data: stats } = useNotebookStats(notebook.id);
  const theme = themes?.find((th) => th.slug === notebook.themeSlug);
  const graduate = notebook.graduates?.[0];

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{t('dashboard.myNotebook')} — {t('common.appName')}</title>
      </Helmet>

      <div>
        <h1 className="font-heading-auto text-2xl font-bold text-ink">
          {t('dashboard.welcomeBack')}, {graduate?.fullName}
        </h1>
        {notebook.expiresAt ? (
          <p className="text-sm text-ink/50">
            {t('dashboard.notebookExpiresOn', { date: formatDate(notebook.expiresAt, i18n.language) })}
          </p>
        ) : notebook.status === 'active' ? (
          <p className="text-sm text-ink/50">{t('dashboard.notebookLifetime')}</p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="mx-auto w-full max-w-[260px]">
          <CoverRenderer
            theme={theme}
            coverImageUrl={notebook.coverImageUrl}
            coverQuote={notebook.coverQuote}
            elements={notebook.coverElements}
            overlayOpacity={Number(notebook.coverOverlayOpacity)}
            graduateName={notebook.type === 'class' ? notebook.title ?? '' : graduate?.fullName ?? ''}
            major={graduate?.major}
            institution={graduate?.institution}
            graduationYear={graduate?.graduationYear}
          />
          <div className="mt-4 flex flex-col gap-2">
            <a href={`/d/${notebook.slug}`} target="_blank" rel="noreferrer">
              <Button className="w-full" variant="outline">
                {t('dashboard.openNotebook')}
              </Button>
            </a>
            <Link to="/dashboard/share">
              <Button className="w-full">{t('dashboard.shareAndQr')}</Button>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-heading-auto text-lg font-bold text-ink">{t('dashboard.statsTitle')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STAT_KEYS.map((s) => (
              <div key={s.key} className="rounded-xl bg-white/70 p-4 text-center shadow-page">
                <div className="text-2xl">{s.icon}</div>
                <div className="mt-1 text-2xl font-bold text-maroon-700">{stats?.[s.key] ?? '—'}</div>
                <div className="text-xs text-ink/50">{t(s.labelKey)}</div>
              </div>
            ))}
          </div>

          {notebook.type === 'class' && notebook.graduates && (
            <div className="mt-8">
              <h2 className="mb-3 font-heading-auto text-lg font-bold text-ink">{notebook.graduates.length} متخرج</h2>
              <div className="flex flex-wrap gap-2">
                {notebook.graduates.map((g) => (
                  <span key={g.id} className="rounded-full bg-white/70 px-3 py-1.5 text-sm text-ink/70 shadow-page">
                    {g.fullName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
