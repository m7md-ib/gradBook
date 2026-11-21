import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { graduateInfoSchema, type GraduateInfoInput } from '@daftar/shared';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { GraduateDto } from '@/types/api';

/** Graduate details form shared by "edit graduate" and "add graduate" on the dashboard. */
export function GraduateForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Pick<GraduateDto, 'fullName' | 'institution' | 'major' | 'graduationYear' | 'graduationDate' | 'shortMessage'>;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: GraduateInfoInput) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GraduateInfoInput>({
    resolver: zodResolver(graduateInfoSchema),
    defaultValues: {
      fullName: initial?.fullName ?? '',
      institution: initial?.institution ?? '',
      major: initial?.major ?? '',
      graduationYear: initial?.graduationYear ?? new Date().getFullYear(),
      graduationDate: initial?.graduationDate ?? undefined,
      shortMessage: initial?.shortMessage ?? '',
    },
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => onSubmit(v))}>
      <Input label={t('wizard.infoFullName') ?? undefined} required error={errors.fullName?.message} {...register('fullName')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('wizard.infoInstitution') ?? undefined}
          required
          error={errors.institution?.message}
          {...register('institution')}
        />
        <Input label={t('wizard.infoMajor') ?? undefined} required error={errors.major?.message} {...register('major')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
          {...register('graduationDate', { setValueAs: (v: string) => v || undefined })}
        />
      </div>
      <Textarea
        label={t('wizard.infoShortMessage') ?? undefined}
        placeholder={t('wizard.infoShortMessagePlaceholder') ?? undefined}
        rows={2}
        error={errors.shortMessage?.message}
        {...register('shortMessage')}
      />
      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
