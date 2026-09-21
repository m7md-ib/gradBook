import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminSettings, useUpdateAdminSetting } from '@/hooks/useAdmin';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateAdminSetting();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  async function save(key: string, value: string) {
    try {
      await update.mutateAsync({ key, value });
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.settings')}</h1>
      <div className="flex flex-col gap-3">
        {data?.map((setting) => (
          <SettingRow key={setting.key} settingKey={setting.key} value={setting.value} onSave={save} />
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-ink/10 pt-4">
        <Input label="مفتاح جديد" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        <Input label="القيمة" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
        <Button
          onClick={() => {
            if (!newKey) return;
            void save(newKey, newValue);
            setNewKey('');
            setNewValue('');
          }}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  settingKey,
  value,
  onSave,
}: {
  settingKey: string;
  value: unknown;
  onSave: (key: string, value: string) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(typeof value === 'string' ? value : JSON.stringify(value));

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white/70 p-3 shadow-page">
      <Input label={settingKey} value={draft} onChange={(e) => setDraft(e.target.value)} className="min-w-[240px] flex-1" />
      <Button size="sm" onClick={() => onSave(settingKey, draft)}>
        {t('common.save')}
      </Button>
    </div>
  );
}
