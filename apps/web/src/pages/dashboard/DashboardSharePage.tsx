import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useNotebookQr, useRegenerateQr } from '@/hooks/useNotebook';
import { Button } from '@/components/ui/Button';
import { ShareBar } from '@/components/ShareBar';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';
import type { NotebookDto } from '@/types/api';

export default function DashboardSharePage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t } = useTranslation();
  const { data: qr, isLoading } = useNotebookQr(notebook.id);
  const regenerate = useRegenerateQr(notebook.id);

  const notebookUrl = `${window.location.origin}/d/${notebook.slug}`;
  const graduate = notebook.graduates?.[0];

  async function handleRegenerate() {
    try {
      await regenerate.mutateAsync();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('dashboard.shareTitle')}</h1>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/70 p-6 shadow-page">
          {isLoading ? (
            <PageSpinner />
          ) : (
            qr && <img src={qr.imageUrl} alt="QR" className="h-48 w-48 rounded-lg border border-ink/10 bg-white p-2" />
          )}
          <div className="flex gap-2">
            {qr && (
              <a href={qr.imageUrl} download={`daftar-${notebook.slug}-qr.png`}>
                <Button variant="outline" size="sm">
                  {t('dashboard.shareQrDownload')}
                </Button>
              </a>
            )}
            <Button size="sm" variant="ghost" loading={regenerate.isPending} onClick={handleRegenerate}>
              {t('dashboard.shareQrRegenerate')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-heading-auto text-lg font-bold text-ink">{t('wizard.notebookLink')}</h2>
          <ShareBar url={notebookUrl} text={t('notebook.sharePreviewText', { name: graduate?.fullName ?? '' }) ?? ''} />
        </div>
      </div>
    </div>
  );
}
