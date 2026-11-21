import { Router } from 'express';
import { z } from 'zod';
import { createOrderSchema } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { getUserById } from '../auth/service.js';
import { ApiError } from '../../lib/errors.js';
import * as commerceService from './service.js';
import { getPaymentProvider } from '../../payments/index.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const orderParams = z.object({ id: z.string().uuid() });

ordersRouter.post(
  '/',
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user!.sub);
    if (!user) throw ApiError.unauthorized();
    const { order, checkout } = await commerceService.createOrder(req.user!.sub, user.email, req.body);
    res.status(201).json({ order, checkout });
  }),
);

ordersRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    res.json({ orders: await commerceService.listMyOrders(req.user!.sub) });
  }),
);

ordersRouter.get(
  '/:id',
  validateParams(orderParams),
  asyncHandler(async (req, res) => {
    const order = await commerceService.getOrder(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const paymentInstructions =
      order.payments[0]?.provider === 'manual' ? await commerceService.getPaymentInstructions() : null;
    // Lets checkout spot a pending order left over from a provider that's no
    // longer configured (e.g. a mock order from before payments went live),
    // which can't be completed and needs a fresh order instead.
    res.json({ order, paymentInstructions, activeProvider: getPaymentProvider().id });
  }),
);

ordersRouter.post(
  '/:id/confirm-mock',
  validateParams(orderParams),
  asyncHandler(async (req, res) => {
    const order = await commerceService.confirmMockPayment(req.params.id, req.user!.sub);
    res.json({ order });
  }),
);
