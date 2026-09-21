import { useTranslation } from 'react-i18next';
import { useAdminOrders } from '@/hooks/useAdmin';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/format';

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useAdminOrders(1);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.orders')}</h1>
      <div className="overflow-x-auto rounded-xl bg-white/70 shadow-page">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-ink/10 text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">المبلغ</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((order) => (
              <tr key={order.id} className="border-b border-ink/5">
                <td className="px-4 py-3">{formatDate(order.createdAt, i18n.language)}</td>
                <td className="px-4 py-3">{formatCurrency(order.amountCents, order.currency, i18n.language)}</td>
                <td className="px-4 py-3">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
