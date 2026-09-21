import { useTranslation } from 'react-i18next';
import { usePackages } from '@/hooks/useCatalog';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

export function StepPackage({
  notebookType,
  selectedPackageId,
  onSelect,
  onSubmit,
  onBack,
  submitting,
}: {
  notebookType: 'individual' | 'class';
  selectedPackageId: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { data: packages, isLoading } = usePackages();

  if (isLoading) return <PageSpinner />;

  const available = packages?.filter((p) => (notebookType === 'class' ? p.tier === 'class' : p.tier !== 'class')) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-center font-heading-auto text-xl font-bold text-ink">{t('wizard.choosePackage')}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((pkg) => (
          <button
            type="button"
            key={pkg.id}
            onClick={() => onSelect(pkg.id)}
            className={cn(
              'flex flex-col gap-3 rounded-2xl border-2 p-6 text-start transition-all',
              selectedPackageId === pkg.id ? 'border-maroon-600 bg-maroon-50 shadow-page-lg' : 'border-ink/10 hover:border-ink/25',
            )}
          >
            <h4 className="font-heading-auto text-xl font-bold text-ink">
              {i18n.language === 'ar' ? pkg.nameAr : pkg.nameEn}
            </h4>
            <p className="text-2xl font-bold text-maroon-700">{formatCurrency(pkg.priceCents, pkg.currency, i18n.language)}</p>
            <p className="text-sm text-ink/60">{i18n.language === 'ar' ? pkg.descriptionAr : pkg.descriptionEn}</p>
            <ul className="flex flex-col gap-1.5 text-sm text-ink/70">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-maroon-600">✓</span>
                  {t(`packageFeatures.${f}`, f)}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button loading={submitting} disabled={!selectedPackageId} onClick={onSubmit}>
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
}
