import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminNotebooks, useForceNotebookStatus } from '@/hooks/useAdmin';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';

export default function AdminNotebooksPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useAdminNotebooks(1, status || undefined);
  const forceStatus = useForceNotebookStatus();

  async function setNotebookStatus(id: string, next: 'active' | 'expired' | 'draft') {
    try {
      await forceStatus.mutateAsync({ id, status: next });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.notebooks')}</h1>
      <Select
        value={status}
        onChange={setStatus}
        className="max-w-xs"
        options={[
          { value: '', label: 'كل الحالات' },
          { value: 'draft', label: 'مسودة' },
          { value: 'pending_payment', label: 'بانتظار الدفع' },
          { value: 'active', label: 'نشط' },
          { value: 'expired', label: 'منتهي' },
        ]}
      />

      {isLoading ? (
        <PageSpinner />
      ) : (
        <div className="flex flex-col gap-3">
          {data?.items.map((nb) => (
            <div key={nb.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 p-4 shadow-page">
              <div>
                <div className="font-heading-auto font-bold text-ink">{nb.title ?? nb.slug}</div>
                <div className="text-xs text-ink/50" dir="ltr">
                  /d/{nb.slug}
                </div>
                <div className="mt-1 text-xs text-ink/60">{nb.status} · {nb.type}</div>
              </div>
              <div className="flex gap-2">
                {nb.status !== 'active' && (
                  <Button size="sm" onClick={() => setNotebookStatus(nb.id, 'active')}>
                    تفعيل
                  </Button>
                )}
                {nb.status === 'active' && (
                  <Button size="sm" variant="danger" onClick={() => setNotebookStatus(nb.id, 'expired')}>
                    إنهاء الصلاحية
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
