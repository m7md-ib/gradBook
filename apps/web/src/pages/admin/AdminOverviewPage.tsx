import { useTranslation } from 'react-i18next';
import { useAdminStats } from '@/hooks/useAdmin';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';

export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) return <PageSpinner />;

  const cards = [
    { label: t('admin.statTotalNotebooks'), value: stats.totalNotebooks, icon: '📖' },
    { label: t('admin.statActiveNotebooks'), value: stats.activeNotebooks, icon: '✅' },
    { label: t('admin.statTotalGraduates'), value: stats.totalGraduates, icon: '🎓' },
    { label: t('admin.statTotalMessages'), value: stats.totalMessages, icon: '💌' },
    { label: t('admin.statTotalVisitors'), value: stats.totalVisitors, icon: '👀' },
    { label: t('admin.statRevenue'), value: formatCurrency(stats.revenueCents, 'SAR', i18n.language), icon: '💰' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.overview')}</h1>
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
