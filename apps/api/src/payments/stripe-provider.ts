import Stripe from 'stripe';
import { PaymentProviderId, PaymentStatus } from '@daftar/shared';
import { env } from '../config/env.js';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookResult,
} from './types.js';

/**
 * Real payment gateway integration via Stripe Checkout. Requires STRIPE_SECRET_KEY
 * and STRIPE_WEBHOOK_SECRET to be configured; the app fails fast at construction
 * time otherwise rather than silently accepting unverifiable payments.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly id = PaymentProviderId.STRIPE;
  private readonly stripe: Stripe;

  constructor() {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe');
    }
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: params.amountCents,
            product_data: { name: params.description },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: params.orderId },
      success_url: `${params.successUrl}?orderId=${params.orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }

    return { redirectUrl: session.url, providerReference: session.id };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const session = await this.stripe.checkout.sessions.retrieve(params.providerReference);
    return {
      status: session.payment_status === 'paid' ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING,
      rawPayload: session,
    };
  }

  async parseWebhook(rawBody: Buffer, signatureHeader: string | undefined): Promise<WebhookResult> {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required to verify webhooks');
    }
    if (!signatureHeader) {
      throw new Error('Missing Stripe-Signature header');
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type !== 'checkout.session.completed') {
      return {
        orderId: '',
        providerReference: '',
        status: PaymentStatus.PENDING,
        rawPayload: event,
      };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      throw new Error('Stripe webhook missing orderId metadata');
    }

    return {
      orderId,
      providerReference: session.id,
      status: session.payment_status === 'paid' ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
      rawPayload: event,
    };
  }
}
