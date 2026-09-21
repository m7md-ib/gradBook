import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminPackages, useUpdateAdminPackage } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';
import { getApiErrorMessage } from '@/api/client';

export default function AdminPackagesPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useAdminPackages();
  const update = useUpdateAdminPackage();
  const [edits, setEdits] = useState<Record<string, string>>({});

  async function savePrice(id: string) {
    const raw = edits[id];
    if (raw === undefined) return;
    const priceCents = Math.round(Number(raw) * 100);
    if (Number.isNaN(priceCents)) return;
    try {
      await update.mutateAsync({ id, payload: { priceCents } });
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await update.mutateAsync({ id, payload: { active } });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.packages')}</h1>
      <div className="flex flex-col gap-3">
        {data?.map((pkg) => (
          <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 p-4 shadow-page">
            <div>
              <div className="font-heading-auto font-bold text-ink">{i18n.language === 'ar' ? pkg.nameAr : pkg.nameEn}</div>
              <div className="text-xs text-ink/50">
                {t('admin.active')}: {pkg.active ? '✓' : '✗'} — {formatCurrency(pkg.priceCents, pkg.currency, i18n.language)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-28"
                placeholder={String(pkg.priceCents / 100)}
                value={edits[pkg.id] ?? ''}
                onChange={(e) => setEdits((s) => ({ ...s, [pkg.id]: e.target.value }))}
              />
              <Button size="sm" onClick={() => savePrice(pkg.id)}>
                {t('common.save')}
              </Button>
              <Button size="sm" variant={pkg.active ? 'outline' : 'secondary'} onClick={() => toggleActive(pkg.id, !pkg.active)}>
                {pkg.active ? t('admin.block') : t('admin.unblock')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
