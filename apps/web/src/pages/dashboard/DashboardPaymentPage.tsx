import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { StepPackage } from '@/pages/wizard/steps/StepPackage';
import { useCreateOrder } from '@/hooks/useCommerce';
import { getApiErrorMessage } from '@/api/client';
import type { NotebookDto } from '@/types/api';

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
      <h1 className="font-heading-auto text-2xl font-bold text-ink">
        {notebook.status === 'expired' ? t('checkout.renewTitle') : t('checkout.choosePackageTitle')}
      </h1>
      <div className="rounded-2xl bg-white/70 p-6 shadow-page">
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
