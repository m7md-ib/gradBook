import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminOrders, useReviewOrderPayment } from '@/hooks/useAdmin';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { getApiErrorMessage } from '@/api/client';
import type { AdminOrderDto } from '@/types/api';

const STATUS_STYLES: Record<AdminOrderDto['status'], string> = {
  pending: 'bg-gold-100 text-ink',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-ink/5 text-ink/50',
  refunded: 'bg-ink/5 text-ink/50',
};

const STATUS_LABELS: Record<AdminOrderDto['status'], string> = {
  pending: 'admin.orderStatusPending',
  paid: 'admin.orderStatusPaid',
  failed: 'admin.orderStatusFailed',
  cancelled: 'admin.orderStatusCancelled',
  refunded: 'admin.orderStatusRefunded',
};

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useAdminOrders(1);
  const review = useReviewOrderPayment();

  if (isLoading) return <PageSpinner />;

  const orders = data?.items ?? [];
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  async function decide(order: AdminOrderDto, decision: 'confirm' | 'reject') {
    const reference = order.payments?.[0]?.providerReference ?? order.id.slice(0, 8);
    const amount = formatCurrency(order.amountCents, order.currency, i18n.language);
    const prompt =
      decision === 'confirm'
        ? t('admin.confirmPaymentPrompt', { amount, reference })
        : t('admin.rejectPaymentPrompt', { reference });
    if (!window.confirm(prompt)) return;
    try {
      await review.mutateAsync({ id: order.id, decision });
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.orders')}</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-gold-100 px-3 py-1 text-sm font-medium text-ink">
            {t('admin.pendingOrdersCount', { count: pendingCount })}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-8 text-center text-ink/50 shadow-page">{t('admin.ordersEmpty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white/70 shadow-page">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-ink/10 text-ink/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('admin.orderDate')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('admin.orderCustomer')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('admin.orderPackage')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('admin.orderAmount')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('admin.orderReference')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('admin.orderStatus')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('admin.orderActions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const reference = order.payments?.[0]?.providerReference;
                const canConfirm = order.status === 'pending' || order.status === 'failed' || order.status === 'cancelled';
                return (
                  <tr key={order.id} className={cn('border-b border-ink/5', order.status === 'pending' && 'bg-gold-50/60')}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(order.createdAt, i18n.language)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{order.user?.fullName}</div>
                      <div className="text-xs text-ink/50" dir="ltr">
                        {order.user?.email}
                      </div>
                      {order.notebook && (
                        <a
                          href={`/d/${order.notebook.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-xs text-maroon-600 hover:underline"
                          dir="ltr"
                        >
                          /d/{order.notebook.slug}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.package ? (i18n.language === 'en' ? order.package.nameEn : order.package.nameAr) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatCurrency(order.amountCents, order.currency, i18n.language)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs" dir="ltr">
                      {reference ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLES[order.status])}>
                        {t(STATUS_LABELS[order.status] ?? order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 whitespace-nowrap">
                        {canConfirm && (
                          <Button size="sm" disabled={review.isPending} onClick={() => decide(order, 'confirm')}>
                            {t('admin.confirmPayment')}
                          </Button>
                        )}
                        {order.status === 'pending' && (
                          <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => decide(order, 'reject')}>
                            {t('admin.rejectPayment')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
