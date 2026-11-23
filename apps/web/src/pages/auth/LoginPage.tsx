import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@daftar/shared';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';
import { CONTACT_WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const typedEmail = watch('email') ?? '';

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
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
          {/* No outgoing email yet: recovery goes through the admin, who issues
              a temporary password from Admin → Users. */}
          <a
            href={whatsappLink(t('auth.forgotPasswordMessage', { email: typedEmail }))}
            target="_blank"
            rel="noreferrer"
            className="-mt-2 self-end text-xs font-medium text-maroon-600 hover:underline"
          >
            {t('auth.forgotPassword')}
          </a>
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

        <p className="mt-4 text-center text-xs text-ink/40">
          {t('auth.contactHint')}{' '}
          <a href={whatsappLink()} className="underline hover:text-ink/60" dir="ltr">
            {CONTACT_WHATSAPP_DISPLAY}
          </a>
        </p>
    </AuthShell>
  );
}
