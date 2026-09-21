import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { ExpiredNotebookView } from '@/types/api';

export function ExpiredScreen({ data }: { data: ExpiredNotebookView }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
      <span className="text-5xl">📕</span>
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('notebook.expiredTitle')}</h1>
      {data.title && <p className="text-ink/70">{data.title}</p>}
      <p className="max-w-sm text-sm text-ink/50">{t('notebook.expiredDesc')}</p>
      <Link to="/">
        <Button className="mt-2" variant="outline">
          {t('errors.backHome')}
        </Button>
      </Link>
    </div>
  );
}
