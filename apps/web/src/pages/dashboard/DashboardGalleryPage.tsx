import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useModerateGalleryItem, useOwnerGallery } from '@/hooks/useGallery';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';
import type { NotebookDto } from '@/types/api';

export default function DashboardGalleryPage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t } = useTranslation();
  const { data, isLoading } = useOwnerGallery(notebook.id);
  const { approve, hide, remove } = useModerateGalleryItem(notebook.id);

  async function act(promise: Promise<unknown>) {
    try {
      await promise;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('dashboard.galleryTitle')}</h1>

      {data?.items.length === 0 ? (
        <p className="py-10 text-center text-ink/50">{t('dashboard.noMessagesFound')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data?.items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl bg-white/70 shadow-page">
              <img src={item.imageUrl} alt={item.caption ?? ''} className="aspect-square w-full object-cover" />
              <div className="p-2">
                {item.caption && <p className="truncate text-xs text-ink/60">{item.caption}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {!item.approved && (
                    <Button size="sm" onClick={() => act(approve.mutateAsync(item.id))}>
                      {t('dashboard.approve')}
                    </Button>
                  )}
                  {item.approved && (
                    <Button size="sm" variant="outline" onClick={() => act(hide.mutateAsync(item.id))}>
                      {t('dashboard.hide')}
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => act(remove.mutateAsync(item.id))}>
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
