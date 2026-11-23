import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { StepPackage } from '@/pages/wizard/steps/StepPackage';
import { useCreateOrder } from '@/hooks/useCommerce';
import { getApiErrorMessage } from '@/api/client';
import type { NotebookDto } from '@/types/api';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Picks a package and opens checkout for the dashboard's notebook — the way
 * back in for a buyer who left the wizard at the payment step, and the
 * renewal path for an expired notebook.
 */
export default function DashboardPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const createOrder = useCreateOrder();
  const [packageId, setPackageId] = useState<string | null>(null);

  async function submit() {
    if (!packageId) return;
    try {
      const { order } = await createOrder.mutateAsync({ notebookId: notebook.id, packageId });
      navigate(`/checkout/${order.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon="card" title={notebook.status === 'expired' ? t('checkout.renewTitle') : t('checkout.choosePackageTitle')} />
      <div className="rounded-3xl border border-ink/5 bg-white/85 p-5 shadow-page sm:p-6">
        <StepPackage
          notebookType={notebook.type === 'class' ? 'class' : 'individual'}
          selectedPackageId={packageId}
          onSelect={setPackageId}
          onSubmit={submit}
          onBack={() => navigate('/dashboard')}
          submitting={createOrder.isPending}
        />
      </div>
    </div>
  );
}
