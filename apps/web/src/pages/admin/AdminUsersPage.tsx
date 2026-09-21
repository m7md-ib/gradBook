import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminUsers, useSetUserBlocked } from '@/hooks/useAdmin';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminUsers(1, search || undefined);
  const setBlocked = useSetUserBlocked();

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
                    <Button size="sm" variant={u.blockedAt ? 'outline' : 'danger'} onClick={() => toggle(u.id, !u.blockedAt)}>
                      {u.blockedAt ? t('admin.unblock') : t('admin.block')}
                    </Button>
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
