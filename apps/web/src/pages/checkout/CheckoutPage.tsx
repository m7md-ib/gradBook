import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { useConfirmMockPayment, useOrder } from '@/hooks/useCommerce';
import { formatCurrency } from '@/lib/format';
import { getApiErrorMessage } from '@/api/client';

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(orderId);
  const confirmMock = useConfirmMockPayment();

  async function handlePay() {
    if (!orderId) return;
    try {
      await confirmMock.mutateAsync(orderId);
      navigate(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading || !order) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-white/70 p-8 shadow-page-lg">
          <h1 className="text-center font-heading-auto text-2xl font-bold text-ink">{t('wizard.paymentTitle')}</h1>

          <div className="mt-6 flex items-center justify-between border-y border-ink/10 py-4">
            <span className="text-ink/70">{t('wizard.paymentSummary')}</span>
            <span className="text-xl font-bold text-maroon-700">
              {formatCurrency(order.amountCents, order.currency, i18n.language)}
            </span>
          </div>

          <p className="mt-4 rounded-lg bg-gold-50 p-3 text-xs leading-relaxed text-ink/60">
            {t('wizard.mockPaymentNotice')}
          </p>

          <Button size="lg" className="mt-6 w-full" loading={confirmMock.isPending} onClick={handlePay}>
            💳 {t('wizard.payNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
