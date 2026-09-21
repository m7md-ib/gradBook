import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { signupSchema, type SignupInput } from '@daftar/shared';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';

export default function SignupPage() {
  const { t, i18n } = useTranslation();
  const { signup, isSigningUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { locale: i18n.language === 'en' ? 'en' : 'ar' },
  });

  async function onSubmit(values: SignupInput) {
    try {
      await signup(values);
      navigate('/create', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 shadow-page-lg">
        <Link to="/" className="mb-6 flex justify-center font-heading-auto text-3xl font-bold text-maroon-700">
          📖 {t('common.appName')}
        </Link>
        <h1 className="text-center font-heading-auto text-2xl font-bold text-ink">{t('auth.signupTitle')}</h1>
        <p className="mt-1 text-center text-sm text-ink/60">{t('auth.signupSubtitle')}</p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register('locale')} />
          <Input
            label={t('auth.fullName') ?? undefined}
            autoComplete="name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label={t('auth.email') ?? undefined}
            type="email"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('auth.password') ?? undefined}
            type="password"
            autoComplete="new-password"
            required
            hint="8 أحرف على الأقل، حرف ورقم"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" size="lg" loading={isSigningUp} className="mt-2">
            {t('auth.signupButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-maroon-600 hover:underline">
            {t('auth.loginInstead')}
          </Link>
        </p>
      </div>
    </div>
  );
}
