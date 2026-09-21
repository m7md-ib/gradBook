import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCoverTemplates, useThemes } from '@/hooks/useCatalog';
import { CoverRenderer, type CoverElementsVisibility } from '@/components/notebook';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import type { WizardState } from '../wizardTypes';

const TOGGLE_KEYS: Array<{ key: keyof CoverElementsVisibility; labelKey: string }> = [
  { key: 'showName', labelKey: 'wizard.showName' },
  { key: 'showMajor', labelKey: 'wizard.showMajor' },
  { key: 'showInstitution', labelKey: 'wizard.showInstitution' },
  { key: 'showGraduationYear', labelKey: 'wizard.showGraduationYear' },
  { key: 'showGraduationDate', labelKey: 'wizard.showGraduationDate' },
  { key: 'showQuote', labelKey: 'wizard.showQuote' },
];

export function StepCustomizeCover({
  wizard,
  onUploadImage,
  onNext,
  onBack,
  saving,
}: {
  wizard: WizardState;
  onUploadImage: (file: File) => Promise<string>;
  onNext: (cover: WizardState['cover']) => Promise<void>;
  onBack: () => void;
  saving: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { data: templates } = useCoverTemplates();
  const { data: themes } = useThemes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [cover, setCover] = useState<WizardState['cover']>(wizard.cover);
  const theme = themes?.find((th) => th.slug === wizard.themeSlug);

  const relevantTemplates = templates?.filter((tpl) => tpl.category === theme?.category) ?? templates ?? [];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      setCover((c) => ({ ...c, sourceType: 'custom', customImageUrl: url, templateSlug: undefined }));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  function toggleElement(key: keyof CoverElementsVisibility) {
    setCover((c) => ({ ...c, elements: { ...c.elements, [key]: !c.elements[key] } }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-3 font-heading-auto text-xl font-bold text-ink">{t('wizard.customizeCoverTitle')}</h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {relevantTemplates.slice(0, 12).map((tpl) => (
              <button
                type="button"
                key={tpl.id}
                onClick={() =>
                  setCover((c) => ({ ...c, sourceType: 'template', templateSlug: tpl.slug, customImageUrl: undefined }))
                }
                className={cn(
                  'aspect-[3/4] overflow-hidden rounded-lg border-2 bg-cover bg-center transition-all',
                  cover.templateSlug === tpl.slug ? 'border-maroon-600 ring-2 ring-maroon-200' : 'border-transparent hover:border-ink/15',
                )}
                style={{ backgroundImage: `url(${tpl.thumbnailUrl})` }}
                aria-label={i18n.language === 'ar' ? tpl.nameAr : tpl.nameEn}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink/70">{t('wizard.uploadOwnCover')}</p>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            📷 {t('wizard.uploadCoverButton')}
          </Button>
        </div>

        <Input
          label={t('wizard.coverQuote') ?? undefined}
          placeholder={t('wizard.coverQuotePlaceholder') ?? undefined}
          maxLength={160}
          value={cover.quote}
          onChange={(e) => setCover((c) => ({ ...c, quote: e.target.value }))}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-ink/70">{t('wizard.coverElementsTitle')}</p>
          <div className="flex flex-wrap gap-2">
            {TOGGLE_KEYS.map(({ key, labelKey }) => (
              <button
                type="button"
                key={key}
                onClick={() => toggleElement(key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  cover.elements[key] ? 'border-maroon-600 bg-maroon-600 text-white' : 'border-ink/20 text-ink/60',
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            {t('common.back')}
          </Button>
          <Button
            loading={saving}
            onClick={() =>
              onNext({
                ...cover,
                templateImageUrl: relevantTemplates.find((tpl) => tpl.slug === cover.templateSlug)?.imageUrl,
              })
            }
          >
            {t('common.next')}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[260px] lg:sticky lg:top-24 lg:self-start">
        <CoverRenderer
          theme={theme}
          coverImageUrl={
            cover.sourceType === 'custom'
              ? cover.customImageUrl
              : relevantTemplates.find((tpl) => tpl.slug === cover.templateSlug)?.imageUrl
          }
          coverQuote={cover.quote}
          elements={cover.elements}
          overlayOpacity={cover.overlayOpacity}
          graduateName={wizard.graduate.fullName || (i18n.language === 'ar' ? 'اسمك هنا' : 'Your name')}
          major={wizard.graduate.major}
          institution={wizard.graduate.institution}
          graduationYear={wizard.graduate.graduationYear}
          graduationDate={wizard.graduate.graduationDate}
        />
      </div>
    </div>
  );
}
