import crypto from 'node:crypto';
import { PaymentProviderId, PaymentStatus } from '@daftar/shared';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookResult,
} from './types.js';

/**
 * Simulates a hosted checkout for local development and demos, without requiring
 * real payment gateway credentials. It never trusts the browser: "payment" is
 * only considered successful once this module's own `confirm` endpoint is called
 * server-side (see modules/commerce/routes.ts), mirroring how a real gateway
 * would call our webhook after processing the card on its own servers.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = PaymentProviderId.MOCK;

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const providerReference = `mock_${crypto.randomBytes(12).toString('hex')}`;
    const redirectUrl = `${params.successUrl}?orderId=${params.orderId}&ref=${providerReference}`;
    return { redirectUrl, providerReference };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    if (params.providerReference.endsWith('_forcefail')) {
      return { status: PaymentStatus.FAILED };
    }
    return { status: PaymentStatus.SUCCEEDED };
  }

  async parseWebhook(rawBody: Buffer): Promise<WebhookResult> {
    const payload = JSON.parse(rawBody.toString('utf-8')) as {
      orderId: string;
      providerReference: string;
      simulate?: 'succeed' | 'fail';
    };
    return {
      orderId: payload.orderId,
      providerReference: payload.providerReference,
      status: payload.simulate === 'fail' ? PaymentStatus.FAILED : PaymentStatus.SUCCEEDED,
      rawPayload: payload,
    };
  }
}
