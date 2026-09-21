import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { graduateInfoSchema, type GraduateInfoInput } from '@daftar/shared';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { getApiErrorMessage } from '@/api/client';
import type { WizardState } from '../wizardTypes';

export function StepGraduateInfo({
  value,
  onSubmit,
  submitting,
}: {
  value: WizardState;
  onSubmit: (notebookType: 'individual' | 'class', info: GraduateInfoInput) => Promise<void>;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const [notebookType, setNotebookType] = useState<'individual' | 'class'>(value.notebookType);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GraduateInfoInput>({
    resolver: zodResolver(graduateInfoSchema),
    defaultValues: {
      fullName: value.graduate.fullName,
      institution: value.graduate.institution,
      major: value.graduate.major,
      graduationYear: value.graduate.graduationYear || new Date().getFullYear(),
      graduationDate: value.graduate.graduationDate,
      shortMessage: value.graduate.shortMessage,
    },
  });

  async function submit(values: GraduateInfoInput) {
    try {
      await onSubmit(notebookType, values);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(submit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink/80">{t('wizard.notebookType')}</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(['individual', 'class'] as const).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setNotebookType(type)}
              className={cn(
                'rounded-xl border-2 p-4 text-start transition-colors',
                notebookType === type ? 'border-maroon-600 bg-maroon-50' : 'border-ink/10 hover:border-ink/25',
              )}
            >
              <div className="font-heading-auto text-lg font-bold text-ink">
                {type === 'individual' ? t('wizard.notebookTypeIndividual') : t('wizard.notebookTypeClass')}
              </div>
              <div className="text-sm text-ink/60">
                {type === 'individual' ? t('wizard.notebookTypeIndividualDesc') : t('wizard.notebookTypeClassDesc')}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Input label={t('wizard.infoFullName') ?? undefined} required error={errors.fullName?.message} {...register('fullName')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('wizard.infoInstitution') ?? undefined}
          required
          error={errors.institution?.message}
          {...register('institution')}
        />
        <Input label={t('wizard.infoMajor') ?? undefined} required error={errors.major?.message} {...register('major')} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="graduationYear"
          render={({ field }) => (
            <Input
              label={t('wizard.infoYear') ?? undefined}
              type="number"
              required
              error={errors.graduationYear?.message}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />
        <Input
          label={t('wizard.infoDateOptional') ?? undefined}
          type="date"
          error={errors.graduationDate?.message}
          {...register('graduationDate')}
        />
      </div>
      <Textarea
        label={t('wizard.infoShortMessage') ?? undefined}
        placeholder={t('wizard.infoShortMessagePlaceholder') ?? undefined}
        rows={3}
        maxLength={400}
        error={errors.shortMessage?.message}
        {...register('shortMessage')}
      />

      <Button type="submit" size="lg" loading={submitting} className="self-end">
        {t('common.next')}
      </Button>
    </form>
  );
}
