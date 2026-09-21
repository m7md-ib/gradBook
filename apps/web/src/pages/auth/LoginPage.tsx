import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@daftar/shared';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    try {
      await login(values);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/dashboard', { replace: true });
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
        <h1 className="text-center font-heading-auto text-2xl font-bold text-ink">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-center text-sm text-ink/60">{t('auth.loginSubtitle')}</p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" size="lg" loading={isLoggingIn} className="mt-2">
            {t('auth.loginButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="font-semibold text-maroon-600 hover:underline">
            {t('auth.createOne')}
          </Link>
        </p>
      </div>
    </div>
  );
}
