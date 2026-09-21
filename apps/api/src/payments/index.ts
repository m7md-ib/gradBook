import { env } from '../config/env.js';
import { MockPaymentProvider } from './mock-provider.js';
import { StripePaymentProvider } from './stripe-provider.js';
import type { PaymentProvider } from './types.js';

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;

  switch (env.PAYMENT_PROVIDER) {
    case 'mock':
      instance = new MockPaymentProvider();
      break;
    case 'stripe':
      instance = new StripePaymentProvider();
      break;
    default:
      throw new Error(`Unsupported payment provider: ${env.PAYMENT_PROVIDER satisfies never}`);
  }

  return instance;
}

export type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookResult,
} from './types.js';
