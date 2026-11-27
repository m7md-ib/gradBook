import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { toast } from 'sonner';
import { createMessageSchema, RelationshipType, type CreateMessageInput } from '@daftar/shared';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getApiErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import type { PublicGraduate } from '@/types/api';

const REACTIONS = ['❤️', '🎉', '💛', '🌟', '🤍', '😂', '🎓', '🥹'];
const RELATIONSHIP_ICON: Record<string, string> = {
  friend: '🤍',
  family: '👨‍👩‍👧',
  classmate: '🎒',
  teacher: '🍎',
  colleague: '💼',
  other: '✨',
};
const BODY_MAX = 1200;

export interface WriteResult {
  requiresApproval: boolean;
}

/**
 * Where visitors write their page: a bottom sheet on phones (drag down to
 * close), a dialog on wider screens, ending on a thank-you screen.
 */
export function WriteMessageModal({
  open,
  onClose,
  onSubmit,
  graduates,
  defaultTargetGraduateId,
  recipientName,
  onShare,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateMessageInput & { photoFile?: File | null }) => Promise<WriteResult>;
  graduates: PublicGraduate[];
  defaultTargetGraduateId?: string;
  /** Shown in the title: "اكتب لسارة". */
  recipientName?: string;
  onShare?: () => void;
}) {
  const { t } = useTranslation();
  const desktop = useMediaQuery('(min-width: 640px) and (hover: hover)');
  const dragControls = useDragControls();
  const [reaction, setReaction] = useState<string | undefined>();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoPreview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile]);
  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);
  const [submitted, setSubmitted] = useState<'approved' | 'pending' | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMessageInput>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      relationship: RelationshipType.FRIEND,
      targetGraduateId: defaultTargetGraduateId,
      website: '',
    },
  });
  const bodyLength = (watch('body') ?? '').length;

  // The page behind shouldn't scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function submit(values: CreateMessageInput) {
    try {
      const result = await onSubmit({ ...values, reaction, photoFile });
      setSubmitted(result.requiresApproval ? 'pending' : 'approved');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function handleClose() {
    reset();
    setReaction(undefined);
    setPhotoFile(null);
    setSubmitted(null);
    onClose();
  }

  const title = recipientName ? t('notebook.writeTo', { name: recipientName }) : t('notebook.writeButton');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night-900/50 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-paper shadow-2xl sm:rounded-[1.75rem]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            drag={desktop ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            // Only the header starts a drag, so the form inside scrolls normally.
            dragListener={false}
            dragControls={dragControls}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 600) handleClose();
            }}
          >
            {/* Header: also the drag handle on phones */}
            <motion.div
              className="relative shrink-0 overflow-hidden bg-gradient-to-br from-night-800 via-maroon-700 to-maroon-600 px-5 pb-5 pt-3 text-white"
              onPointerDown={(e) => {
                if (!desktop) dragControls.start(e);
              }}
              style={{ touchAction: desktop ? undefined : 'none' }}
            >
              <div className="absolute -top-10 h-32 w-32 rounded-full bg-gold-400/30 blur-2xl ltr:-right-6 rtl:-left-6" aria-hidden />
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/30 sm:hidden" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading-auto text-2xl font-bold text-gold-100">✍️ {title}</h3>
                  {!submitted && <p className="mt-1 text-sm text-white/70">{t('notebook.writeSubtitle')}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                  aria-label={t('common.close')}
                >
                  <Icon name="x" className="h-5 w-5" />
                </button>
              </div>
            </motion.div>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 px-6 pb-10 pt-8 text-center" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
                <motion.span
                  initial={{ scale: 0, rotate: -20, y: 20 }}
                  animate={{ scale: 1, rotate: 0, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                  className="text-7xl"
                >
                  {submitted === 'approved' ? '💌' : '⏳'}
                </motion.span>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-heading-auto text-2xl font-bold text-ink"
                >
                  {submitted === 'approved' ? t('notebook.writeFormSuccess') : t('notebook.writeFormPending')}
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-xs text-sm text-ink/60">
                  {submitted === 'approved' ? t('notebook.writeThanksHint') : t('notebook.writePendingHint')}
                </motion.p>
                <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
                  <Button size="lg" onClick={handleClose}>
                    📖 {t('notebook.backToNotebook')}
                  </Button>
                  {onShare && (
                    <Button size="lg" variant="outline" onClick={onShare}>
                      <Icon name="share" className="h-4 w-4" /> {t('notebook.shareWithOthers')}
                    </Button>
                  )}
                </div>
                <Link to="/" className="mt-4 rounded-2xl bg-gold-100 px-4 py-3 text-sm font-semibold text-ink ring-1 ring-gold-300/60">
                  🎓 {t('notebook.makeYourOwn')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
                <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5 [overscroll-behavior:contain]">
                  {graduates.length > 1 && (
                    <Controller
                      control={control}
                      name="targetGraduateId"
                      render={({ field }) => (
                        <Select
                          label={t('notebook.chooseGraduate') ?? undefined}
                          value={field.value}
                          onChange={field.onChange}
                          options={graduates.map((g) => ({ value: g.id, label: g.fullName }))}
                        />
                      )}
                    />
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="authorName" className="text-sm font-semibold text-ink/80">
                      {t('notebook.writeFormName')} <span className="text-maroon-600">*</span>
                    </label>
                    <input
                      id="authorName"
                      autoComplete="name"
                      // On phones the keyboard would cover half the sheet before it's even read.
                      autoFocus={desktop}
                      placeholder={t('notebook.writeNamePlaceholder') ?? undefined}
                      className="h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-maroon-400 focus:ring-4 focus:ring-maroon-100"
                      aria-invalid={Boolean(errors.authorName)}
                      {...register('authorName')}
                    />
                    {errors.authorName && <p className="text-sm text-red-600">{errors.authorName.message}</p>}
                  </div>

                  <Controller
                    control={control}
                    name="relationship"
                    render={({ field }) => (
                      <fieldset className="flex flex-col gap-2">
                        <legend className="mb-2 text-sm font-semibold text-ink/80">{t('notebook.writeFormRelationship')}</legend>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(RelationshipType).map((value) => {
                            const active = field.value === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => field.onChange(value)}
                                aria-pressed={active}
                                className={cn(
                                  'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95',
                                  active ? 'bg-maroon-600 text-white shadow-md' : 'bg-white text-ink/70 ring-1 ring-ink/10',
                                )}
                              >
                                <span>{RELATIONSHIP_ICON[value]}</span>
                                {t(`notebook.relationship.${value}`)}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="body" className="text-sm font-semibold text-ink/80">
                      {t('notebook.writeFormMessage')} <span className="text-maroon-600">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        id="body"
                        rows={6}
                        maxLength={BODY_MAX}
                        dir="auto"
                        placeholder={t('notebook.writeBodyPlaceholder', { name: recipientName ?? '' }) ?? undefined}
                        className="w-full resize-none rounded-2xl border border-ink/15 bg-[#FFFEF9] px-4 pb-7 pt-3 text-base leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-maroon-400 focus:ring-4 focus:ring-maroon-100"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(184,144,90,0.15) 27px, rgba(184,144,90,0.15) 28px)',
                          backgroundPositionY: '11px',
                        }}
                        aria-invalid={Boolean(errors.body)}
                        {...register('body')}
                      />
                      <span className="pointer-events-none absolute bottom-2 text-[11px] tabular-nums text-ink/35 ltr:right-3 rtl:left-3">
                        {bodyLength}/{BODY_MAX}
                      </span>
                    </div>
                    {errors.body && <p className="text-sm text-red-600">{errors.body.message}</p>}
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-ink/80">{t('notebook.writeReaction')}</span>
                    <div className="flex flex-wrap gap-2">
                      {REACTIONS.map((emoji) => {
                        const active = reaction === emoji;
                        return (
                          <motion.button
                            type="button"
                            key={emoji}
                            whileTap={{ scale: 0.85 }}
                            animate={{ scale: active ? 1.15 : 1 }}
                            onClick={() => setReaction((r) => (r === emoji ? undefined : emoji))}
                            aria-pressed={active}
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-full text-xl transition-colors',
                              active ? 'bg-maroon-50 ring-2 ring-maroon-500' : 'bg-white ring-1 ring-ink/10',
                            )}
                          >
                            {emoji}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-ink/80">{t('notebook.writeFormPhoto')}</span>
                    {/* Styled picker: the browser's own file input shows English
                        "Choose File / No file chosen" inside the Arabic form. */}
                    {photoFile ? (
                      <div className="relative overflow-hidden rounded-2xl ring-1 ring-ink/10">
                        <img src={photoPreview ?? ''} alt="" className="max-h-48 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotoFile(null)}
                          className="absolute top-2 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-red-600 shadow ltr:right-2 rtl:left-2"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                          {t('notebook.removePhoto')}
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm font-semibold text-ink/60 transition-colors hover:border-maroon-300 hover:text-maroon-700">
                        <Icon name="image" className="h-5 w-5" />
                        {t('notebook.choosePhoto')}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  {/* Honeypot field — hidden from real visitors, filled only by bots */}
                  <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register('website')} />
                </div>

                <div
                  className="shrink-0 border-t border-ink/5 bg-paper/95 px-5 pt-3 backdrop-blur"
                  style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
                >
                  <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                    💌 {t('notebook.writeFormSubmit')}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
