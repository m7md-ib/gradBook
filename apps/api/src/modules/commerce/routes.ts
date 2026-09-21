import { Router } from 'express';
import { z } from 'zod';
import { createOrderSchema } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { getUserById } from '../auth/service.js';
import { ApiError } from '../../lib/errors.js';
import * as commerceService from './service.js';

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
  '/:id',
  validateParams(orderParams),
  asyncHandler(async (req, res) => {
    const order = await commerceService.getOrder(req.params.id, req.user!.sub, req.user!.role === 'admin');
    res.json({ order });
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
