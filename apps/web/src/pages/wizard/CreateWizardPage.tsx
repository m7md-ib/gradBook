import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import type { GraduateInfoInput } from '@daftar/shared';
import { Navbar } from '@/components/layout/Navbar';
import { DEFAULT_COVER_ELEMENTS } from '@/components/notebook';
import { useCreateNotebook, useUpdateCover, useUploadCoverImage } from '@/hooks/useNotebook';
import { useCreateOrder } from '@/hooks/useCommerce';
import { getApiErrorMessage } from '@/api/client';
import { StepGraduateInfo } from './steps/StepGraduateInfo';
import { StepChooseTheme } from './steps/StepChooseTheme';
import { StepCustomizeCover } from './steps/StepCustomizeCover';
import { StepPreview } from './steps/StepPreview';
import { StepPackage } from './steps/StepPackage';
import { WIZARD_STEPS, type WizardState } from './wizardTypes';
import { cn } from '@/lib/cn';

const INITIAL_STATE: WizardState = {
  notebookId: null,
  graduateId: null,
  slug: null,
  notebookType: 'individual',
  themeSlug: null,
  themeCategorySlug: null,
  graduate: { fullName: '', institution: '', major: '', graduationYear: new Date().getFullYear() },
  cover: { sourceType: 'template', quote: '', elements: DEFAULT_COVER_ELEMENTS, overlayOpacity: 0.4 },
  packageId: null,
};

const STEP_LABELS = ['stepInfo', 'stepCoverStyle', 'stepCoverCustomize', 'stepPreview', 'stepPackage'] as const;

export default function CreateWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [wizard, setWizard] = useState<WizardState>(INITIAL_STATE);

  const createNotebook = useCreateNotebook();
  const updateCover = useUpdateCover(wizard.notebookId ?? undefined);
  const uploadCoverImage = useUploadCoverImage(wizard.notebookId ?? undefined);
  const createOrder = useCreateOrder();

  const step = WIZARD_STEPS[stepIndex];

  function goTo(index: number) {
    setStepIndex(Math.max(0, Math.min(WIZARD_STEPS.length - 1, index)));
  }

  async function handleInfoSubmit(notebookType: 'individual' | 'class', info: GraduateInfoInput) {
    setWizard((w) => ({ ...w, notebookType, graduate: info }));
    goTo(1);
  }

  async function handleThemeNext() {
    if (!wizard.themeSlug) return;
    try {
      const result = await createNotebook.mutateAsync({
        notebook: { type: wizard.notebookType, themeSlug: wizard.themeSlug },
        graduate: wizard.graduate,
      });
      setWizard((w) => ({ ...w, notebookId: result.notebook.id, graduateId: result.graduate.id, slug: result.notebook.slug }));
      goTo(2);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleUploadImage(file: File): Promise<string> {
    const notebook = await uploadCoverImage.mutateAsync(file);
    return notebook.coverImageUrl ?? '';
  }

  async function handleCoverNext(cover: WizardState['cover']) {
    if (!wizard.notebookId) return;
    try {
      await updateCover.mutateAsync({
        sourceType: cover.sourceType,
        templateSlug: cover.templateSlug,
        overlayOpacity: cover.overlayOpacity,
        quote: cover.quote,
        elements: cover.elements,
      });
      setWizard((w) => ({ ...w, cover }));
      goTo(3);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handlePackageSubmit() {
    if (!wizard.notebookId || !wizard.packageId) return;
    try {
      const { order } = await createOrder.mutateAsync({ notebookId: wizard.notebookId, packageId: wizard.packageId });
      navigate(`/checkout/${order.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Helmet>
        <title>
          {t('wizard.title')} — {t('common.appName')}
        </title>
      </Helmet>
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-heading-auto text-3xl font-bold text-ink">{t('wizard.title')}</h1>

        <ol className="mx-auto mt-8 flex max-w-2xl items-center justify-between">
          {STEP_LABELS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                  i <= stepIndex ? 'bg-maroon-600 text-white' : 'bg-ink/10 text-ink/40',
                )}
              >
                {i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={cn('mx-1 h-0.5 flex-1', i < stepIndex ? 'bg-maroon-600' : 'bg-ink/10')} />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-center text-sm font-medium text-ink/60">{t(`wizard.${STEP_LABELS[stepIndex]}`)}</p>

        <div className="mt-8 rounded-2xl bg-white/70 p-6 shadow-page-lg sm:p-10">
          {step === 'info' && (
            <StepGraduateInfo value={wizard} onSubmit={handleInfoSubmit} submitting={false} />
          )}
          {step === 'cover-style' && (
            <StepChooseTheme
              selectedThemeSlug={wizard.themeSlug}
              onSelect={(slug) => setWizard((w) => ({ ...w, themeSlug: slug }))}
              onNext={handleThemeNext}
              onBack={() => goTo(0)}
            />
          )}
          {step === 'cover-customize' && (
            <StepCustomizeCover
              wizard={wizard}
              onUploadImage={handleUploadImage}
              onNext={handleCoverNext}
              onBack={() => goTo(1)}
              saving={updateCover.isPending}
            />
          )}
          {step === 'preview' && <StepPreview wizard={wizard} onNext={() => goTo(4)} onBack={() => goTo(2)} />}
          {step === 'package' && (
            <StepPackage
              notebookType={wizard.notebookType}
              selectedPackageId={wizard.packageId}
              onSelect={(id) => setWizard((w) => ({ ...w, packageId: id }))}
              onSubmit={handlePackageSubmit}
              onBack={() => goTo(3)}
              submitting={createOrder.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
