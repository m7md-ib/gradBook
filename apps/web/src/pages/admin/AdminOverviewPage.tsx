import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAdminAttention, useAdminStats } from '@/hooks/useAdmin';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';

export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading } = useAdminStats();
  const { data: attention } = useAdminAttention();

  if (isLoading || !stats) return <PageSpinner />;

  const cards = [
    { label: t('admin.statTotalNotebooks'), value: stats.totalNotebooks, icon: '📖' },
    { label: t('admin.statActiveNotebooks'), value: stats.activeNotebooks, icon: '✅' },
    { label: t('admin.statTotalGraduates'), value: stats.totalGraduates, icon: '🎓' },
    { label: t('admin.statTotalMessages'), value: stats.totalMessages, icon: '💌' },
    { label: t('admin.statTotalVisitors'), value: stats.totalVisitors, icon: '👀' },
    { label: t('admin.statRevenue'), value: formatCurrency(stats.revenueCents, stats.revenueCurrency, i18n.language), icon: '💰' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.overview')}</h1>

      {attention && (attention.pendingOrders > 0 || attention.openReports > 0) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {attention.pendingOrders > 0 && (
            <Link
              to="/admin/orders"
              className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-medium text-ink hover:bg-gold-100"
            >
              <span>💳 {t('admin.pendingOrdersCount', { count: attention.pendingOrders })}</span>
              <span aria-hidden className="ltr:rotate-180">←</span>
            </Link>
          )}
          {attention.openReports > 0 && (
            <Link
              to="/admin/reports"
              className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              <span>🚩 {t('admin.openReportsCount', { count: attention.openReports })}</span>
              <span aria-hidden className="ltr:rotate-180">←</span>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white/70 p-5 text-center shadow-page">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-1 text-xl font-bold text-maroon-700">{c.value}</div>
            <div className="text-xs text-ink/50">{c.label}</div>
          </div>
        ))}
      </div>

      {stats.popularThemes.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading-auto text-lg font-bold text-ink">التصاميم الأكثر استخداماً</h2>
          <div className="flex flex-wrap gap-2">
            {stats.popularThemes.map((th) => (
              <span key={th.themeSlug} className="rounded-full bg-white/70 px-3 py-1.5 text-sm text-ink/70 shadow-page">
                {th.themeSlug} · {th.total}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
