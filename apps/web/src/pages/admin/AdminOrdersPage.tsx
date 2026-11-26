import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminOrders, useReviewOrderPayment } from '@/hooks/useAdmin';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
        <p className="rounded-3xl bg-white/80 p-8 text-center text-ink/50 shadow-page">{t('admin.ordersEmpty')}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {/* Waiting for confirmation first: that's what the admin opens this page for. */}
          {[...orders]
            .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))
            .map((order) => {
              const reference = order.payments?.[0]?.providerReference;
              const canConfirm = order.status === 'pending' || order.status === 'failed' || order.status === 'cancelled';
              return (
                <li
                  key={order.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-page ring-1 sm:p-5',
                    order.status === 'pending' ? 'ring-gold-300' : 'ring-ink/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-ink">{order.user?.fullName}</div>
                      <div className="truncate text-xs text-ink/50" dir="ltr">
                        {order.user?.email}
                      </div>
                    </div>
                    <span className={cn('shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_STYLES[order.status])}>
                      {t(STATUS_LABELS[order.status] ?? order.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-paper p-3 text-sm">
                    <div>
                      <div className="text-[11px] text-ink/45">{t('admin.orderAmount')}</div>
                      <div className="text-lg font-bold text-maroon-700">{formatCurrency(order.amountCents, order.currency, i18n.language)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-ink/45">{t('admin.orderPackage')}</div>
                      <div className="font-semibold text-ink">
                        {order.package ? (i18n.language === 'en' ? order.package.nameEn : order.package.nameAr) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-ink/45">{t('admin.orderReference')}</div>
                      {reference ? (
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard.writeText(reference).then(() => toast.success(t('common.copied')))}
                          className="flex max-w-full items-center gap-1 font-mono text-sm font-bold text-ink"
                          dir="ltr"
                        >
                          <span className="truncate">{reference}</span>
                          <Icon name="copy" className="h-3.5 w-3.5 text-ink/40" />
                        </button>
                      ) : (
                        <div className="text-ink/40">—</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] text-ink/45">{t('admin.orderDate')}</div>
                      <div className="text-ink/80">{formatDate(order.createdAt, i18n.language)}</div>
                    </div>
                  </div>

                  {order.notebook && (
                    <a
                      href={`/d/${order.notebook.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 self-start text-xs font-semibold text-maroon-600 hover:underline"
                      dir="ltr"
                    >
                      <Icon name="external" className="h-3.5 w-3.5" />
                      /d/{order.notebook.slug}
                    </a>
                  )}

                  {(canConfirm || order.status === 'pending') && (
                    <div className="flex gap-2">
                      {canConfirm && (
                        <Button className="flex-1" disabled={review.isPending} onClick={() => decide(order, 'confirm')}>
                          <Icon name="check" className="h-4 w-4" />
                          {t('admin.confirmPayment')}
                        </Button>
                      )}
                      {order.status === 'pending' && (
                        <Button variant="outline" disabled={review.isPending} onClick={() => decide(order, 'reject')}>
                          {t('admin.rejectPayment')}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
