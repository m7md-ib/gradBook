import { useTranslation } from 'react-i18next';
import { useThemes } from '@/hooks/useCatalog';
import { CoverRenderer } from '@/components/notebook';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

export function StepChooseTheme({
  selectedThemeSlug,
  onSelect,
  onNext,
  onBack,
}: {
  selectedThemeSlug: string | null;
  onSelect: (slug: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { data: themes, isLoading } = useThemes();

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-heading-auto text-xl font-bold text-ink">{t('wizard.chooseTheme')}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {themes?.map((theme) => (
          <button
            type="button"
            key={theme.slug}
            onClick={() => onSelect(theme.slug)}
            className={cn(
              'flex flex-col gap-2 rounded-xl border-2 p-2 transition-all',
              selectedThemeSlug === theme.slug ? 'border-maroon-600 ring-2 ring-maroon-200' : 'border-transparent hover:border-ink/15',
            )}
          >
            <CoverRenderer
              compact
              theme={theme}
              graduateName={i18n.language === 'ar' ? 'اسمك هنا' : 'Your name'}
              major=""
              institution=""
              elements={{
                showName: true,
                showMajor: false,
                showInstitution: false,
                showGraduationYear: true,
                showGraduationDate: false,
                showQuote: false,
              }}
              graduationYear={new Date().getFullYear()}
            />
            <span className="text-center text-sm font-medium text-ink/80">
              {i18n.language === 'ar' ? theme.nameAr : theme.nameEn}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button onClick={onNext} disabled={!selectedThemeSlug}>
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
