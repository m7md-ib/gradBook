import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import * as catalogService from './service.js';

export const catalogRouter = Router();

catalogRouter.get(
  '/themes',
  asyncHandler(async (_req, res) => {
    res.json({ themes: await catalogService.listThemes() });
  }),
);

catalogRouter.get(
  '/cover-templates',
  asyncHandler(async (_req, res) => {
    res.json({ coverTemplates: await catalogService.listCoverTemplates() });
  }),
);

catalogRouter.get(
  '/packages',
  asyncHandler(async (_req, res) => {
    res.json({ packages: await catalogService.listPackages() });
  }),
);
