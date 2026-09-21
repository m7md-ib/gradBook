import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminReports, useResolveReport } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminReports(1);
  const resolve = useResolveReport();

  async function act(id: string, status: 'dismissed' | 'actioned') {
    try {
      await resolve.mutateAsync({ id, status });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.reports')}</h1>
      {!data?.items.length ? (
        <p className="text-ink/50">{t('dashboard.noReports')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 p-4 shadow-page">
              <div>
                <p className="text-sm text-ink/80">{r.reason}</p>
                <p className="text-xs text-ink/40">
                  {r.targetType} · {r.status}
                </p>
              </div>
              {r.status === 'open' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => act(r.id, 'dismissed')}>
                    {t('dashboard.dismiss')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => act(r.id, 'actioned')}>
                    اتخاذ إجراء
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
