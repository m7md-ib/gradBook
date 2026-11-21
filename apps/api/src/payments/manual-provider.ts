import crypto from 'node:crypto';
import { PaymentProviderId, PaymentStatus } from '@daftar/shared';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookResult,
} from './types.js';

// No 0/O or 1/I/L: buyers type this reference into their bank app's transfer
// note by hand, and the admin matches it against the bank statement by eye.
const REFERENCE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generatePaymentReference(): string {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (const byte of bytes) code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  return `DF-${code}`;
}

/**
 * Offline payment (CliQ / bank transfer / wallet): the buyer is shown the
 * platform's transfer details plus a short reference code to put in the
 * transfer note, and an admin confirms the order by hand once the money
 * arrives (see confirmManualPayment in modules/commerce/service.ts). There is
 * no gateway to ask, so verifyPayment never reports success on its own, and
 * there are no webhooks.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly id = PaymentProviderId.MANUAL;

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    return {
      redirectUrl: `${env.APP_URL}/checkout/${params.orderId}`,
      providerReference: generatePaymentReference(),
    };
  }

  async verifyPayment(_params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    return { status: PaymentStatus.PENDING };
  }

  async parseWebhook(): Promise<WebhookResult> {
    throw ApiError.notFound();
  }
}
