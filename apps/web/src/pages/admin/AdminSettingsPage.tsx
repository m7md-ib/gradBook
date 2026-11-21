import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminSettings, useUpdateAdminSetting } from '@/hooks/useAdmin';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { ChangePasswordCard } from '@/components/ChangePasswordCard';
import { getApiErrorMessage } from '@/api/client';

// Must match PAYMENT_SETTING_KEYS in apps/api/src/modules/commerce/service.ts.
const PAYMENT_KEYS = {
  cliqAlias: 'payment_cliq_alias',
  accountName: 'payment_account_name',
  note: 'payment_note',
} as const;
const PAYMENT_KEY_SET = new Set<string>(Object.values(PAYMENT_KEYS));

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

      <PaymentSettingsCard settings={data ?? []} />

      <ChangePasswordCard />

      <h2 className="font-heading-auto text-lg font-bold text-ink">{t('admin.otherSettings')}</h2>
      <div className="flex flex-col gap-3">
        {data?.filter((setting) => !PAYMENT_KEY_SET.has(setting.key)).map((setting) => (
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

function PaymentSettingsCard({ settings }: { settings: { key: string; value: unknown }[] }) {
  const { t } = useTranslation();
  const update = useUpdateAdminSetting();
  const initial = (key: string) => {
    const value = settings.find((s) => s.key === key)?.value;
    return typeof value === 'string' ? value : '';
  };
  const [cliqAlias, setCliqAlias] = useState(() => initial(PAYMENT_KEYS.cliqAlias));
  const [accountName, setAccountName] = useState(() => initial(PAYMENT_KEYS.accountName));
  const [note, setNote] = useState(() => initial(PAYMENT_KEYS.note));

  async function save() {
    try {
      await update.mutateAsync({ key: PAYMENT_KEYS.cliqAlias, value: cliqAlias.trim() });
      await update.mutateAsync({ key: PAYMENT_KEYS.accountName, value: accountName.trim() });
      await update.mutateAsync({ key: PAYMENT_KEYS.note, value: note.trim() });
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white/70 p-5 shadow-page">
      <div>
        <h2 className="font-heading-auto text-lg font-bold text-ink">{t('admin.paymentSettingsTitle')}</h2>
        <p className="text-sm text-ink/60">{t('admin.paymentSettingsDesc')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('admin.paymentCliqAlias') ?? undefined} value={cliqAlias} onChange={(e) => setCliqAlias(e.target.value)} dir="ltr" />
        <Input label={t('admin.paymentAccountName') ?? undefined} value={accountName} onChange={(e) => setAccountName(e.target.value)} />
      </div>
      <Textarea label={t('admin.paymentNote') ?? undefined} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      <Button className="self-start" loading={update.isPending} onClick={save}>
        {t('common.save')}
      </Button>
    </div>
  );
}
