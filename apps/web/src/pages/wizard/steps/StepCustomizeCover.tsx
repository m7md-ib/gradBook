import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCoverTemplates, useThemes } from '@/hooks/useCatalog';
import type { CoverStyle } from '@daftar/shared';
import { CoverRenderer, COVER_FONT_FAMILIES, type CoverCropValue, type CoverElementsVisibility } from '@/components/notebook';
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

const DEFAULT_STYLE: CoverStyle = { nameScale: 1, textScale: 1, textColor: '#FFFFFF', nameFont: 'theme', align: 'start' };
const DEFAULT_CROP: CoverCropValue = { x: 50, y: 50, zoom: 1 };
const DEFAULT_OVERLAY = 0.4;
const TEXT_COLORS = ['#FFFFFF', '#F3E7D3', '#D9C09B', '#1A1A1A', '#6B1D2A', '#1E2A44'];
const FONT_OPTIONS: Array<{ key: CoverStyle['nameFont']; sample: string }> = [
  { key: 'theme', sample: 'Aa' },
  { key: 'ruqaa', sample: 'دفتر' },
  { key: 'amiri', sample: 'دفتر' },
  { key: 'cairo', sample: 'دفتر' },
  { key: 'tajawal', sample: 'دفتر' },
  { key: 'playfair', sample: 'Aa' },
];

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink/70">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-xs text-ink/50" dir="ltr">
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-maroon-600"
      />
    </label>
  );
}

export function StepCustomizeCover({
  wizard,
  onUploadImage,
  onNext,
  onBack,
  saving,
  nextLabel,
}: {
  wizard: Pick<WizardState, 'themeSlug' | 'graduate' | 'cover'>;
  onUploadImage: (file: File) => Promise<string>;
  onNext: (cover: WizardState['cover']) => Promise<void>;
  /** Omitted outside the wizard (e.g. the dashboard's edit page). */
  onBack?: () => void;
  saving: boolean;
  nextLabel?: string;
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

  const style: CoverStyle = { ...DEFAULT_STYLE, ...cover.style };
  const crop: CoverCropValue = cover.crop ?? DEFAULT_CROP;
  const setStyle = (patch: Partial<CoverStyle>) =>
    setCover((c) => ({ ...c, style: { ...DEFAULT_STYLE, ...c.style, ...patch } }));
  const setCrop = (patch: Partial<CoverCropValue>) =>
    setCover((c) => ({ ...c, crop: { ...DEFAULT_CROP, ...c.crop, ...patch } }));
  const previewImageUrl =
    cover.sourceType === 'custom'
      ? cover.customImageUrl
      : relevantTemplates.find((tpl) => tpl.slug === cover.templateSlug)?.imageUrl;

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

        <details className="group rounded-xl border border-ink/10 bg-white/60 p-4" open>
          <summary className="cursor-pointer list-none font-semibold text-ink">✍️ {t('wizard.textStyleTitle')}</summary>
          <div className="mt-4 flex flex-col gap-4">
            <RangeField
              label={t('wizard.nameSize')}
              value={style.nameScale}
              min={0.6}
              max={1.8}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setStyle({ nameScale: v })}
            />
            <RangeField
              label={t('wizard.textSize')}
              value={style.textScale}
              min={0.7}
              max={1.5}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setStyle({ textScale: v })}
            />
            <div>
              <p className="mb-2 text-sm text-ink/70">{t('wizard.textColor')}</p>
              <div className="flex flex-wrap items-center gap-2">
                {TEXT_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setStyle({ textColor: color })}
                    aria-label={color}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 shadow-sm transition-transform',
                      style.textColor.toLowerCase() === color.toLowerCase()
                        ? 'scale-110 border-maroon-600 ring-2 ring-maroon-200'
                        : 'border-ink/15',
                    )}
                    style={{ background: color }}
                  />
                ))}
                <label className="flex items-center gap-1.5 rounded-full border border-ink/15 px-2 py-1 text-xs text-ink/60">
                  <input
                    type="color"
                    value={style.textColor}
                    onChange={(e) => setStyle({ textColor: e.target.value.toUpperCase() })}
                    className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                  {t('wizard.customColor')}
                </label>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-ink/70">{t('wizard.nameFont')}</p>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map(({ key, sample }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setStyle({ nameFont: key })}
                    className={cn(
                      'min-w-[3.5rem] rounded-lg border px-3 py-1.5 text-lg transition-colors',
                      style.nameFont === key ? 'border-maroon-600 bg-maroon-50 text-maroon-700' : 'border-ink/15 text-ink/70',
                      key === 'theme' && 'font-heading-auto',
                    )}
                    style={COVER_FONT_FAMILIES[key] ? { fontFamily: COVER_FONT_FAMILIES[key] } : undefined}
                    title={t(`wizard.font_${key}`)}
                  >
                    {key === 'theme' ? t('wizard.font_theme') : sample}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-ink/70">{t('wizard.alignment')}</p>
              <div className="flex gap-2">
                {(['start', 'center'] as const).map((align) => (
                  <button
                    type="button"
                    key={align}
                    onClick={() => setStyle({ align })}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      style.align === align ? 'border-maroon-600 bg-maroon-600 text-white' : 'border-ink/20 text-ink/60',
                    )}
                  >
                    {align === 'start' ? t('wizard.alignStart') : t('wizard.alignCenter')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </details>

        {previewImageUrl && (
          <details className="group rounded-xl border border-ink/10 bg-white/60 p-4" open>
            <summary className="cursor-pointer list-none font-semibold text-ink">🖼️ {t('wizard.imageAdjustTitle')}</summary>
            <div className="mt-4 flex flex-col gap-4">
              <RangeField
                label={t('wizard.imageZoom')}
                value={crop.zoom}
                min={1}
                max={3}
                step={0.05}
                format={(v) => `${v.toFixed(2)}×`}
                onChange={(v) => setCrop({ zoom: v })}
              />
              <RangeField
                label={t('wizard.imagePosX')}
                value={crop.x}
                min={0}
                max={100}
                step={1}
                format={(v) => `${Math.round(v)}%`}
                onChange={(v) => setCrop({ x: v })}
              />
              <RangeField
                label={t('wizard.imagePosY')}
                value={crop.y}
                min={0}
                max={100}
                step={1}
                format={(v) => `${Math.round(v)}%`}
                onChange={(v) => setCrop({ y: v })}
              />
              <RangeField
                label={t('wizard.imageOverlay')}
                value={cover.overlayOpacity}
                min={0}
                max={0.8}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => setCover((c) => ({ ...c, overlayOpacity: v }))}
              />
            </div>
          </details>
        )}

        <button
          type="button"
          onClick={() => setCover((c) => ({ ...c, style: undefined, crop: undefined, overlayOpacity: DEFAULT_OVERLAY }))}
          className="self-start text-xs font-medium text-ink/50 underline-offset-2 hover:text-ink/70 hover:underline"
        >
          ↺ {t('wizard.resetCoverStyle')}
        </button>

        <div className="wizard-actions">
          {onBack ? (
            <Button variant="outline" onClick={onBack}>
              {t('common.back')}
            </Button>
          ) : (
            <span />
          )}
          <Button
            loading={saving}
            onClick={() =>
              onNext({
                ...cover,
                templateImageUrl: relevantTemplates.find((tpl) => tpl.slug === cover.templateSlug)?.imageUrl,
              })
            }
          >
            {nextLabel ?? t('common.next')}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[260px] lg:sticky lg:top-24 lg:self-start">
        <CoverRenderer
          theme={theme}
          coverImageUrl={previewImageUrl}
          crop={cover.crop}
          coverStyle={cover.style}
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
