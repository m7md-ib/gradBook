import { useTranslation } from 'react-i18next';
import { useThemes } from '@/hooks/useCatalog';
import { CoverRenderer } from '@/components/notebook';
import { Button } from '@/components/ui/Button';
import type { WizardState } from '../wizardTypes';

export function StepPreview({ wizard, onNext, onBack }: { wizard: WizardState; onNext: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const { data: themes } = useThemes();
  const theme = themes?.find((th) => th.slug === wizard.themeSlug);

  const coverImageUrl = wizard.cover.sourceType === 'custom' ? wizard.cover.customImageUrl : wizard.cover.templateImageUrl;

  return (
    <div className="flex flex-col items-center gap-6">
      <div>
        <h3 className="text-center font-heading-auto text-xl font-bold text-ink">{t('wizard.previewTitle')}</h3>
        <p className="text-center text-sm text-ink/60">{t('wizard.previewSubtitle')}</p>
      </div>

      <div className="w-full max-w-xs">
        <CoverRenderer
          theme={theme}
          coverImageUrl={coverImageUrl}
          coverQuote={wizard.cover.quote}
          elements={wizard.cover.elements}
          overlayOpacity={wizard.cover.overlayOpacity}
          graduateName={wizard.graduate.fullName}
          major={wizard.graduate.major}
          institution={wizard.graduate.institution}
          graduationYear={wizard.graduate.graduationYear}
          graduationDate={wizard.graduate.graduationDate}
        />
      </div>

      <div className="flex w-full justify-between">
        <Button variant="outline" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button onClick={onNext}>{t('common.next')}</Button>
      </div>
    </div>
  );
}
