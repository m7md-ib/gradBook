import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { AuroraBackground } from '@/components/landing/AuroraBackground';
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
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  // +1 moving forward, -1 going back: the next step slides in from that side.
  const [direction, setDirection] = useState(1);
  const [wizard, setWizard] = useState<WizardState>(INITIAL_STATE);

  const createNotebook = useCreateNotebook();
  const updateCover = useUpdateCover(wizard.notebookId ?? undefined);
  const uploadCoverImage = useUploadCoverImage(wizard.notebookId ?? undefined);
  const createOrder = useCreateOrder();

  const step = WIZARD_STEPS[stepIndex];

  function goTo(index: number) {
    const next = Math.max(0, Math.min(WIZARD_STEPS.length - 1, index));
    setDirection(next >= stepIndex ? 1 : -1);
    setStepIndex(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        crop: cover.crop,
        style: cover.style,
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
      <Navbar variant="overlay" />

      <div className="relative isolate overflow-hidden px-4 pb-24 pt-24 text-center sm:pt-28">
        <AuroraBackground particles={10} />
        <h1 className="relative font-heading-auto text-3xl font-bold text-white sm:text-4xl">{t('wizard.title')}</h1>

        <ol className="relative mx-auto mt-8 flex max-w-md items-center">
          {STEP_LABELS.map((label, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <motion.span
                  animate={{ scale: current ? 1.15 : 1 }}
                  className={cn(
                    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300',
                    done && 'bg-gold-400 text-ink',
                    current && 'bg-white text-maroon-700 shadow-lg ring-4 ring-white/25',
                    !done && !current && 'bg-white/10 text-white/50 ring-1 ring-white/20',
                  )}
                >
                  {done ? '✓' : i + 1}
                </motion.span>
                {i < STEP_LABELS.length - 1 && (
                  <span className="mx-1 h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                    <motion.span
                      className="block h-full rounded-full bg-gold-400"
                      initial={false}
                      animate={{ width: done ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="relative mt-4 text-sm font-semibold text-gold-100"
          >
            {t('wizard.stepOf', { current: stepIndex + 1, total: STEP_LABELS.length })} · {t(`wizard.${STEP_LABELS[stepIndex]}`)}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto -mt-16 max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-book ring-1 ring-ink/5 sm:p-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * (isRtl ? -24 : 24) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * (isRtl ? 24 : -24) }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
