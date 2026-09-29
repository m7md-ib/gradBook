import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';

export function ChangePasswordCard() {
  const { t } = useTranslation();
  const { changePassword, isChangingPassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success(t('account.changePasswordSuccess'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-white/70 p-4 shadow-page">
      <h2 className="font-heading-auto text-lg font-bold text-ink">{t('account.changePasswordTitle')}</h2>
      <Input
        type="password"
        label={t('account.currentPassword')}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <Input
        type="password"
        label={t('account.newPassword')}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
        error={error}
      />
      <Button type="submit" loading={isChangingPassword} className="self-start">
        {t('account.changePasswordButton')}
      </Button>
    </form>
  );
}
