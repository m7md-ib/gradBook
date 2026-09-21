import { Router } from 'express';
import { z } from 'zod';
import { paginationQuerySchema } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { getNotebookForOwner } from '../notebooks/service.js';
import * as moderationService from './service.js';

export const reportsRouter = Router({ mergeParams: true });
const params = z.object({ id: z.string().uuid(), reportId: z.string().uuid().optional() });

reportsRouter.use(requireAuth);

reportsRouter.get(
  '/',
  validateParams(params),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    res.json(await moderationService.listReportsForOwner(req.params.id, req.query as any));
  }),
);

reportsRouter.patch(
  '/:reportId',
  validateParams(params),
  validateBody(z.object({ status: z.enum(['dismissed', 'actioned']) })),
  asyncHandler(async (req, res) => {
    await getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    const report = await moderationService.resolveReport(
      req.params.id,
      req.params.reportId!,
      req.user!.sub,
      req.body.status,
    );
    res.json({ report });
  }),
);
