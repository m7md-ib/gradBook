import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminThemes, useUpdateAdminTheme } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';

export default function AdminThemesPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useAdminThemes();
  const update = useUpdateAdminTheme();

  async function toggleActive(slug: string, active: boolean) {
    try {
      await update.mutateAsync({ slug, payload: { active } });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.themes')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((theme) => (
          <div key={theme.slug} className="flex items-center justify-between rounded-xl p-4 shadow-page" style={{ backgroundColor: theme.paperColor }}>
            <div>
              <div className="font-heading-auto font-bold" style={{ color: theme.inkColor }}>
                {i18n.language === 'ar' ? theme.nameAr : theme.nameEn}
              </div>
              <div className="text-xs opacity-60" style={{ color: theme.inkColor }}>
                {theme.category}
              </div>
            </div>
            <Button size="sm" variant={theme.active ? 'outline' : 'secondary'} onClick={() => toggleActive(theme.slug, !theme.active)}>
              {theme.active ? t('admin.block') : t('admin.unblock')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
