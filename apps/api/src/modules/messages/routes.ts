import { Router } from 'express';
import { z } from 'zod';
import { featureMessageSchema, messageQuerySchema, moderateMessageSchema, paginationQuerySchema } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { getNotebookForOwner } from '../notebooks/service.js';
import * as messageService from './service.js';

export const messagesRouter = Router({ mergeParams: true });

const params = z.object({ id: z.string().uuid(), messageId: z.string().uuid().optional() });

messagesRouter.use(requireAuth);

messagesRouter.get(
  '/',
  validateParams(params),
  validateQuery(messageQuerySchema.merge(paginationQuerySchema)),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const { status, search, featured, page, pageSize } = req.query as any;
    const result = await messageService.listForOwner(
      req.params.id,
      { status, search, featured },
      { page, pageSize },
    );
    res.json(result);
  }),
);

messagesRouter.patch(
  '/:messageId',
  validateParams(params),
  validateBody(moderateMessageSchema),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const message = await messageService.moderateMessage(
      req.params.id,
      req.params.messageId!,
      req.user!.sub,
      req.body.status,
    );
    res.json({ message });
  }),
);

messagesRouter.patch(
  '/:messageId/feature',
  validateParams(params),
  validateBody(featureMessageSchema),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const message = await messageService.setFeatured(
      req.params.id,
      req.params.messageId!,
      req.user!.sub,
      req.body.featured,
    );
    res.json({ message });
  }),
);

messagesRouter.delete(
  '/:messageId',
  validateParams(params),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    await messageService.moderateMessage(req.params.id, req.params.messageId!, req.user!.sub, 'deleted');
    res.status(204).send();
  }),
);
