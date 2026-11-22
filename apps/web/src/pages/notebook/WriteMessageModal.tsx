import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createMessageSchema, RelationshipType, type CreateMessageInput } from '@daftar/shared';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';
import type { PublicGraduate } from '@/types/api';

const REACTIONS = ['❤️', '🎉', '💛', '🌟', '🤍', '😂'];

export function WriteMessageModal({
  open,
  onClose,
  onSubmit,
  graduates,
  defaultTargetGraduateId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateMessageInput & { photoFile?: File | null }) => Promise<void>;
  graduates: PublicGraduate[];
  defaultTargetGraduateId?: string;
}) {
  const { t } = useTranslation();
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
    formState: { errors, isSubmitting },
  } = useForm<CreateMessageInput>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      relationship: RelationshipType.FRIEND,
      targetGraduateId: defaultTargetGraduateId,
      website: '',
    },
  });

  async function submit(values: CreateMessageInput) {
    try {
      await onSubmit({ ...values, reaction, photoFile });
      setSubmitted('approved');
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

  const relationshipOptions = Object.values(RelationshipType).map((value) => ({
    value,
    label: t(`notebook.relationship.${value}`),
  }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-paper p-6 shadow-book sm:rounded-2xl sm:p-8"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-5xl">{submitted === 'approved' ? '💌' : '⏳'}</span>
                <p className="font-heading-auto text-xl font-bold text-ink">
                  {submitted === 'approved' ? t('notebook.writeFormSuccess') : t('notebook.writeFormPending')}
                </p>
                <Button className="mt-2" onClick={handleClose}>
                  {t('common.close')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <h3 className="font-heading-auto text-xl font-bold text-ink">✍️ {t('notebook.writeButton')}</h3>

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

                <Input
                  label={t('notebook.writeFormName') ?? undefined}
                  required
                  autoFocus
                  error={errors.authorName?.message}
                  {...register('authorName')}
                />

                <Controller
                  control={control}
                  name="relationship"
                  render={({ field }) => (
                    <Select
                      label={t('notebook.writeFormRelationship') ?? undefined}
                      value={field.value}
                      onChange={field.onChange}
                      options={relationshipOptions}
                    />
                  )}
                />

                <Textarea
                  label={t('notebook.writeFormMessage') ?? undefined}
                  required
                  rows={5}
                  maxLength={1200}
                  error={errors.body?.message}
                  {...register('body')}
                />

                <div className="flex gap-2">
                  {REACTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setReaction((r) => (r === emoji ? undefined : emoji))}
                      className={`rounded-full border-2 px-2.5 py-1 text-lg transition-transform ${
                        reaction === emoji ? 'scale-110 border-maroon-500 bg-maroon-50' : 'border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink/80">{t('notebook.writeFormPhoto')}</span>
                  {/* Styled picker: the browser's own file input shows English
                      "Choose File / No file chosen" inside the Arabic form. */}
                  {photoFile ? (
                    <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 p-2">
                      <img src={photoPreview ?? ''} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/70" dir="auto">
                        {photoFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhotoFile(null)}
                        className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        {t('notebook.removePhoto')}
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/15 bg-white/50 px-4 py-4 text-sm font-medium text-ink/60 transition-colors hover:border-maroon-300 hover:text-maroon-700">
                      <span className="text-lg">📷</span>
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

                <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
                  {t('notebook.writeFormSubmit')}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
