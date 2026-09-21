import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function AccessCodeGate({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (code: string) => void;
  loading: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        className="w-full max-w-sm rounded-2xl bg-white/70 p-8 text-center shadow-page-lg"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(code);
        }}
      >
        <span className="text-4xl">🔒</span>
        <h1 className="mt-3 font-heading-auto text-xl font-bold text-ink">{t('notebook.accessCodeTitle')}</h1>
        <p className="mt-1 text-sm text-ink/60">{t('notebook.accessCodeDesc')}</p>
        <Input
          className="mt-5 text-center tracking-widest"
          placeholder={t('notebook.accessCodePlaceholder') ?? undefined}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          error={error}
          autoFocus
        />
        <Button type="submit" size="lg" loading={loading} className="mt-4 w-full">
          {t('notebook.accessCodeSubmit')}
        </Button>
      </form>
    </div>
  );
}
