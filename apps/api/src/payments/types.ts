import type { PaymentProviderId, PaymentStatus } from '@daftar/shared';

export interface CreateCheckoutParams {
  orderId: string;
  amountCents: number;
  currency: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  redirectUrl: string;
  providerReference: string;
  clientSecret?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  providerReference: string;
}

export interface VerifyPaymentResult {
  status: PaymentStatus;
  rawPayload?: unknown;
}

export interface WebhookResult {
  orderId: string;
  providerReference: string;
  status: PaymentStatus;
  rawPayload?: unknown;
}

/**
 * Every payment gateway integration implements this interface. Business logic
 * (order/notebook activation) never talks to a gateway SDK directly — only
 * through this contract — so swapping or adding a provider never touches core logic.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  parseWebhook(rawBody: Buffer, signatureHeader: string | undefined): Promise<WebhookResult>;
}
