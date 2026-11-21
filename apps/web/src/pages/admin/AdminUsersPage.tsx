import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminUsers, useResetUserPassword, useSetUserBlocked } from '@/hooks/useAdmin';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminUsers(1, search || undefined);
  const setBlocked = useSetUserBlocked();
  const resetPassword = useResetUserPassword();
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  async function issueTemporaryPassword(id: string, email: string) {
    if (!window.confirm(t('admin.resetPasswordConfirm', { email }))) return;
    try {
      const { temporaryPassword } = await resetPassword.mutateAsync(id);
      setIssued({ email, password: temporaryPassword });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function toggle(id: string, blocked: boolean) {
    try {
      await setBlocked.mutateAsync({ id, blocked });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.users')}</h1>
      <Input placeholder={t('common.search') ?? undefined} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {issued && (
        <div className="flex flex-col gap-2 rounded-xl border border-gold-300 bg-gold-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ink">{t('admin.temporaryPasswordTitle', { email: issued.email })}</p>
            <button type="button" onClick={() => setIssued(null)} className="text-ink/40 hover:text-ink/70" aria-label={t('common.close')}>
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2" dir="ltr">
            <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-ink">{issued.password}</code>
            <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(issued.password).then(() => toast.success(t('common.copied')))}>
              {t('common.copy')}
            </Button>
          </div>
          <p className="text-xs text-ink/60">{t('admin.temporaryPasswordHint')}</p>
        </div>
      )}

      {isLoading ? (
        <PageSpinner />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white/70 shadow-page">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-ink/10 text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">الاسم</th>
                <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                <th className="px-4 py-3 font-medium">الدور</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => (
                <tr key={u.id} className="border-b border-ink/5">
                  <td className="px-4 py-3">{u.fullName}</td>
                  <td className="px-4 py-3 text-ink/60" dir="ltr">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={u.blockedAt ? 'text-red-600' : 'text-green-600'}>
                      {u.blockedAt ? t('admin.blocked') : t('admin.active')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.role !== 'admin' && (
                        <Button size="sm" variant="outline" disabled={resetPassword.isPending} onClick={() => issueTemporaryPassword(u.id, u.email)}>
                          {t('admin.resetPassword')}
                        </Button>
                      )}
                      <Button size="sm" variant={u.blockedAt ? 'outline' : 'danger'} onClick={() => toggle(u.id, !u.blockedAt)}>
                        {u.blockedAt ? t('admin.unblock') : t('admin.block')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
