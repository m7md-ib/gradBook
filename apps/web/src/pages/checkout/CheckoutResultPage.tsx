import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { ShareBar } from '@/components/ShareBar';
import { useOrder } from '@/hooks/useCommerce';
import { useNotebook, useNotebookQr } from '@/hooks/useNotebook';

export default function CheckoutResultPage({ variant }: { variant: 'success' | 'cancel' }) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const orderId = params.get('orderId') ?? undefined;

  const { data: order, isLoading: orderLoading } = useOrder(orderId, {
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1500 : false),
  });
  const notebookId = variant === 'success' ? order?.notebookId : undefined;
  const { data: notebook } = useNotebook(notebookId);
  const { data: qr } = useNotebookQr(notebookId);

  const notebookUrl = notebook ? `${window.location.origin}/d/${notebook.slug}` : '';

  if (variant === 'success' && (orderLoading || order?.status === 'pending')) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="flex flex-col items-center gap-4 py-24">
          <PageSpinner />
          <p className="text-ink/60">{t('wizard.processingPayment')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        {variant === 'success' ? (
          <>
            <h1 className="font-heading-auto text-3xl font-bold text-ink">{t('wizard.doneTitle')}</h1>
            <p className="mt-2 text-ink/60">{t('wizard.doneSubtitle')}</p>

            {qr && (
              <img
                src={qr.imageUrl}
                alt="QR"
                className="mx-auto mt-6 h-40 w-40 rounded-lg border border-ink/10 bg-white p-2 shadow-page"
              />
            )}

            <div className="mt-6 text-start">
              <p className="mb-2 text-center text-sm font-medium text-ink/70">{t('wizard.notebookLink')}</p>
              {notebook && <ShareBar url={notebookUrl} text={t('notebook.sharePreviewText', { name: notebook.title ?? '' }) ?? ''} />}
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {notebook && (
                <a href={`/d/${notebook.slug}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">
                    {t('wizard.viewNotebook')}
                  </Button>
                </a>
              )}
              <Link to="/dashboard">
                <Button className="w-full">{t('wizard.goToDashboard')}</Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-heading-auto text-3xl font-bold text-ink">{t('checkout.cancelTitle')}</h1>
            <p className="mt-2 text-ink/60">{t('checkout.cancelDesc')}</p>
            <Link to="/dashboard">
              <Button className="mt-6">{t('checkout.backToDashboard')}</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
