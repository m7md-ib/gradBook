import { Router } from 'express';
import express from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import * as commerceService from './service.js';

export const paymentWebhookRouter = Router();

/**
 * Mounted with express.raw() (not json()) because Stripe's signature verification
 * needs the exact raw request bytes — parsing to JSON first would invalidate it.
 */
paymentWebhookRouter.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    await commerceService.handleProviderWebhook(req.body, req.get('stripe-signature'));
    res.json({ received: true });
  }),
);
