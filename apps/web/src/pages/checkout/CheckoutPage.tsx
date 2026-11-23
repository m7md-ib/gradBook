import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { AuroraBackground } from '@/components/landing/AuroraBackground';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { useCheckout, useConfirmMockPayment } from '@/hooks/useCommerce';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/format';
import { whatsappLink } from '@/lib/contact';
import { getApiErrorMessage } from '@/api/client';
import type { OrderDto, PaymentInstructions } from '@/types/api';

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useCheckout(orderId);

  // Once paid (mock confirm, or an admin confirming a transfer while this page
  // is open), hand over to the success page with the share link and QR code.
  useEffect(() => {
    if (data?.order.status === 'paid') navigate(`/checkout/success?orderId=${data.order.id}`, { replace: true });
  }, [data?.order.status, data?.order.id, navigate]);

  if (isLoading || !data) return <PageSpinner />;

  const provider = data.order.payments?.[0]?.provider;
  const stale = data.order.status === 'pending' && provider !== data.activeProvider;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar variant="overlay" />
      <div className="relative isolate h-56 overflow-hidden sm:h-64">
        <AuroraBackground particles={10} />
      </div>
      <div className="relative mx-auto -mt-32 max-w-md px-4 pb-16 sm:-mt-36">
        {stale ? (
          <StaleOrder />
        ) : provider === 'manual' ? (
          <ManualCheckout order={data.order} instructions={data.paymentInstructions} />
        ) : (
          <MockCheckout order={data.order} />
        )}
      </div>
    </div>
  );
}

function StaleOrder() {
  const { t } = useTranslation();
  return (
    <div className="rounded-[1.75rem] bg-white p-6 text-center shadow-book ring-1 ring-ink/5 sm:p-8">
      <span className="text-4xl">🔁</span>
      <h1 className="mt-3 font-heading-auto text-2xl font-bold text-ink">{t('checkout.staleTitle')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">{t('checkout.staleDesc')}</p>
      <Link to="/dashboard/payment" className="mt-6 block">
        <Button className="w-full">{t('dashboard.completePayment')}</Button>
      </Link>
    </div>
  );
}

function MockCheckout({ order }: { order: OrderDto }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const confirmMock = useConfirmMockPayment();

  async function handlePay() {
    try {
      await confirmMock.mutateAsync(order.id);
      navigate(`/checkout/success?orderId=${order.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-book ring-1 ring-ink/5 sm:p-8">
      <h1 className="text-center font-heading-auto text-2xl font-bold text-ink">{t('wizard.paymentTitle')}</h1>

      <div className="mt-6 flex items-center justify-between border-y border-ink/10 py-4">
        <span className="text-ink/70">{t('wizard.paymentSummary')}</span>
        <span className="text-xl font-bold text-maroon-700">
          {formatCurrency(order.amountCents, order.currency, i18n.language)}
        </span>
      </div>

      <p className="mt-4 rounded-lg bg-gold-50 p-3 text-xs leading-relaxed text-ink/60">{t('wizard.mockPaymentNotice')}</p>

      <Button size="lg" className="mt-6 w-full" loading={confirmMock.isPending} onClick={handlePay}>
        💳 {t('wizard.payNow')}
      </Button>
    </div>
  );
}

function ManualCheckout({ order, instructions }: { order: OrderDto; instructions: PaymentInstructions | null }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const reference = order.payments?.[0]?.providerReference ?? '';
  const amount = formatCurrency(order.amountCents, order.currency, i18n.language);
  const packageName = order.package ? (i18n.language === 'en' ? order.package.nameEn : order.package.nameAr) : null;

  if (order.status === 'failed' || order.status === 'cancelled') {
    const failed = order.status === 'failed';
    return (
      <div className="rounded-[1.75rem] bg-white p-6 text-center shadow-book ring-1 ring-ink/5 sm:p-8">
        <span className="text-4xl">{failed ? '⚠️' : '🔁'}</span>
        <h1 className="mt-3 font-heading-auto text-2xl font-bold text-ink">
          {failed ? t('checkout.failedTitle') : t('checkout.cancelledTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {failed ? t('checkout.failedDesc') : t('checkout.cancelledDesc')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {failed && (
            <a href={whatsappLink(t('checkout.receiptMessage', { amount, reference, email: user?.email ?? '' }))} target="_blank" rel="noreferrer">
              <Button className="w-full">{t('checkout.contactUs')}</Button>
            </a>
          )}
          <Link to="/dashboard">
            <Button variant="outline" className="w-full">
              {t('checkout.backToDashboard')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const receiptText = t('checkout.receiptMessage', { amount, reference, email: user?.email ?? '' });

  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-book ring-1 ring-ink/5 sm:p-8">
      <h1 className="text-center font-heading-auto text-2xl font-bold text-ink">{t('checkout.manualTitle')}</h1>
      <p className="mt-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-ink/80">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-600" />
          {t('checkout.statusPending')}
        </span>
      </p>

      <dl className="mt-6 divide-y divide-ink/10 border-y border-ink/10 text-sm">
        {packageName && (
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink/60">{t('checkout.orderSummary')}</dt>
            <dd className="font-medium text-ink">{packageName}</dd>
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <dt className="text-ink/60">{t('checkout.amount')}</dt>
          <dd className="text-xl font-bold text-maroon-700">{amount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-ink/60">{t('checkout.reference')}</dt>
          <dd>
            <CopyValue value={reference} className="text-lg font-bold tracking-wider text-ink" />
          </dd>
        </div>
      </dl>

      <ol className="mt-6 flex flex-col gap-5">
        <Step n={1}>
          {instructions?.cliqAlias ? (
            <>
              <p>{t('checkout.step1', { amount })}</p>
              <div className="mt-2 flex flex-col gap-2 rounded-xl bg-paper p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-ink/50">{t('checkout.cliqAlias')}</span>
                  <CopyValue value={instructions.cliqAlias} className="font-bold text-ink" />
                </div>
                {instructions.accountName && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-ink/50">{t('checkout.accountName')}</span>
                    <span className="font-medium text-ink">{instructions.accountName}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>{t('checkout.step1NoDetails')}</p>
          )}
        </Step>
        <Step n={2}>
          <p>{t('checkout.step2', { reference })}</p>
        </Step>
        <Step n={3}>
          <p>{t('checkout.step3')}</p>
        </Step>
      </ol>

      {instructions?.note && (
        <p className="mt-5 whitespace-pre-line rounded-lg bg-gold-50 p-3 text-xs leading-relaxed text-ink/70">{instructions.note}</p>
      )}

      <a href={whatsappLink(receiptText)} target="_blank" rel="noreferrer" className="mt-6 block">
        <Button size="lg" className="w-full bg-[#1f9d55] hover:bg-[#188a49]">
          {t('checkout.sendReceipt')}
        </Button>
      </a>

      <p className="mt-5 text-center text-xs leading-relaxed text-ink/50">{t('checkout.pendingNote')}</p>

      <Link to="/dashboard" className="mt-4 block text-center text-sm font-medium text-maroon-600 hover:underline">
        {t('checkout.backToDashboard')}
      </Link>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-ink/80">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon-600 text-xs font-bold text-white">
        {n}
      </span>
      <div className="flex-1">{children}</div>
    </li>
  );
}

function CopyValue({ value, className }: { value: string; className?: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('common.errorGeneric'));
    }
  }

  return (
    <span className="inline-flex items-center gap-2" dir="ltr">
      <span className={className}>{value}</span>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-ink/15 px-2 py-0.5 text-[11px] font-medium text-ink/60 hover:bg-ink/5"
      >
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </span>
  );
}
