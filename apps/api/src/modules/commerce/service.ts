import { eq } from 'drizzle-orm';
import { PaymentStatus, OrderStatus, type CreateOrderInput } from '@daftar/shared';
import { db, type Database } from '../../db/client.js';
import { orders, payments, packages, subscriptions, notifications, notebooks } from '../../db/schema/index.js';
import { getNotebookForOwner, activateNotebook, renewNotebook } from '../notebooks/service.js';
import { getPaymentProvider } from '../../payments/index.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/errors.js';
import type { WebhookResult } from '../../payments/types.js';

export async function createOrder(userId: string, userEmail: string, input: CreateOrderInput) {
  const notebook = await getNotebookForOwner(input.notebookId, userId);

  const pkg = await db.query.packages.findFirst({ where: eq(packages.id, input.packageId) });
  if (!pkg || !pkg.active) throw ApiError.badRequest('الباقة المختارة غير متاحة');

  if (notebook.type === 'class' && pkg.tier !== 'class') {
    throw ApiError.badRequest('الدفاتر الجماعية تتطلب باقة "الدفعة"');
  }

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      notebookId: notebook.id,
      packageId: pkg.id,
      status: 'pending',
      amountCents: pkg.priceCents,
      currency: pkg.currency,
    })
    .returning();
  if (!order) throw ApiError.internal();

  const provider = getPaymentProvider();
  const checkout = await provider.createCheckoutSession({
    orderId: order.id,
    amountCents: pkg.priceCents,
    currency: pkg.currency,
    description: `دفتر تخرج — باقة ${pkg.nameAr}`,
    customerEmail: userEmail,
    successUrl: `${env.APP_URL}/checkout/success`,
    cancelUrl: `${env.APP_URL}/checkout/cancel`,
  });

  await db.insert(payments).values({
    orderId: order.id,
    provider: provider.id,
    providerReference: checkout.providerReference,
    status: 'pending',
    amountCents: pkg.priceCents,
    currency: pkg.currency,
  });

  return { order, checkout };
}

export async function getOrder(orderId: string, userId: string, isAdmin = false) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { payments: true, package: true },
  });
  if (!order) throw ApiError.notFound('الطلب غير موجود');
  if (order.userId !== userId && !isAdmin) throw ApiError.forbidden();
  return order;
}

async function finalizePayment(orderId: string, result: WebhookResult) {
  return db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw ApiError.notFound('الطلب غير موجود');
    if (order.status === 'paid') return order; // idempotent: already processed

    await tx
      .update(payments)
      .set({
        status: result.status,
        providerReference: result.providerReference || undefined,
        rawPayload: result.rawPayload as object | undefined,
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, orderId));

    const newOrderStatus = result.status === PaymentStatus.SUCCEEDED ? OrderStatus.PAID : OrderStatus.FAILED;
    const [updatedOrder] = await tx
      .update(orders)
      .set({ status: newOrderStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    if (result.status === PaymentStatus.SUCCEEDED) {
      const pkg = await tx.query.packages.findFirst({ where: eq(packages.id, order.packageId) });
      if (!pkg) throw ApiError.internal();

      const notebook = await tx.query.notebooks.findFirst({ where: eq(notebooks.id, order.notebookId) });
      const executor = tx as unknown as Database;
      const activated =
        notebook?.status === 'active' || notebook?.status === 'expired'
          ? await renewNotebook(order.notebookId, pkg, executor)
          : await activateNotebook(order.notebookId, pkg, executor);

      await tx.insert(subscriptions).values({
        notebookId: order.notebookId,
        orderId: order.id,
        startsAt: new Date(),
        endsAt: activated?.expiresAt ?? null,
      });

      await tx.insert(notifications).values({
        userId: order.userId,
        type: 'payment_succeeded',
        title: 'تم تفعيل دفترك بنجاح 🎓',
        body: 'رابط دفترك جاهز الآن للمشاركة مع أصدقائك وعائلتك.',
      });
    } else {
      await tx.insert(notifications).values({
        userId: order.userId,
        type: 'payment_failed',
        title: 'فشلت عملية الدفع',
        body: 'حاول مرة أخرى أو استخدم وسيلة دفع مختلفة.',
      });
    }

    return updatedOrder;
  });
}

/**
 * Dev/demo-only confirmation path for the mock provider. It still calls the
 * provider's own `verifyPayment` rather than trusting the request body, so the
 * "backend verifies, frontend never activates" rule holds even without a real gateway.
 */
export async function confirmMockPayment(orderId: string, userId: string) {
  if (env.PAYMENT_PROVIDER !== 'mock') {
    throw ApiError.notFound();
  }
  const order = await getOrder(orderId, userId);
  const payment = order.payments[0];
  if (!payment?.providerReference) throw ApiError.badRequest('لا توجد عملية دفع مرتبطة بهذا الطلب');

  const provider = getPaymentProvider();
  const verification = await provider.verifyPayment({ orderId, providerReference: payment.providerReference });

  return finalizePayment(orderId, {
    orderId,
    providerReference: payment.providerReference,
    status: verification.status,
    rawPayload: verification.rawPayload,
  });
}

export async function handleProviderWebhook(rawBody: Buffer, signature: string | undefined) {
  const provider = getPaymentProvider();
  const result = await provider.parseWebhook(rawBody, signature);
  if (!result.orderId) return; // non-actionable event type (e.g. Stripe event we don't handle)
  await finalizePayment(result.orderId, result);
}
