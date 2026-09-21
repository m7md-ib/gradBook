import { Router } from 'express';
import { z } from 'zod';
import { paginationQuerySchema } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { getNotebookForOwner } from '../notebooks/service.js';
import * as galleryService from './service.js';

export const galleryRouter = Router({ mergeParams: true });
const params = z.object({ id: z.string().uuid(), itemId: z.string().uuid().optional() });

galleryRouter.use(requireAuth);

galleryRouter.get(
  '/',
  validateParams(params),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    res.json(await galleryService.listForOwner(req.params.id, req.query as any));
  }),
);

galleryRouter.patch(
  '/:itemId/approve',
  validateParams(params),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const item = await galleryService.setApproved(req.params.id, req.params.itemId!, req.user!.sub, true);
    res.json({ item });
  }),
);

galleryRouter.patch(
  '/:itemId/hide',
  validateParams(params),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const item = await galleryService.setApproved(req.params.id, req.params.itemId!, req.user!.sub, false);
    res.json({ item });
  }),
);

galleryRouter.delete(
  '/:itemId',
  validateParams(params),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    await galleryService.deleteItem(req.params.id, req.params.itemId!, req.user!.sub);
    res.status(204).send();
  }),
);
