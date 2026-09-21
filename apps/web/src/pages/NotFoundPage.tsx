import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
      <div className="font-heading-auto text-7xl">📖</div>
      <h1 className="font-heading-auto text-3xl font-bold text-ink">{t('errors.notFoundTitle')}</h1>
      <p className="text-ink/60">{t('errors.notFoundDesc')}</p>
      <Link to="/">
        <Button className="mt-2">{t('errors.backHome')}</Button>
      </Link>
    </div>
  );
}
