import { useState } from 'react';
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
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">{t('notebook.writeFormPhoto')}</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-ink/60 file:me-3 file:rounded-lg file:border-0 file:bg-gold-200 file:px-3 file:py-1.5 file:text-ink"
                  />
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
