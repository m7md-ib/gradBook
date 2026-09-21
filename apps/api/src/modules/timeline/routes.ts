import { Router } from 'express';
import { z } from 'zod';
import { createTimelineItemSchema } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { getNotebookForOwner } from '../notebooks/service.js';
import * as timelineService from './service.js';

export const timelineRouter = Router({ mergeParams: true });
const params = z.object({ id: z.string().uuid(), itemId: z.string().uuid().optional() });

timelineRouter.use(requireAuth);

timelineRouter.get(
  '/',
  validateParams(params),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    res.json({ items: await timelineService.listTimeline(req.params.id) });
  }),
);

timelineRouter.post(
  '/',
  validateParams(params),
  validateBody(createTimelineItemSchema),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const item = await timelineService.createTimelineItem(req.params.id, req.body);
    res.status(201).json({ item });
  }),
);

timelineRouter.patch(
  '/:itemId',
  validateParams(params),
  validateBody(createTimelineItemSchema.partial()),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const item = await timelineService.updateTimelineItem(req.params.id, req.params.itemId!, req.body);
    res.json({ item });
  }),
);

timelineRouter.delete(
  '/:itemId',
  validateParams(params),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    await timelineService.deleteTimelineItem(req.params.id, req.params.itemId!);
    res.status(204).send();
  }),
);
