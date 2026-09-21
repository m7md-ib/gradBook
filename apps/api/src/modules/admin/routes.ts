import { Router } from 'express';
import { z } from 'zod';
import { paginationQuerySchema } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth-guard.js';
import * as adminService from './service.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

const idParams = z.object({ id: z.string().uuid() });
const slugParams = z.object({ slug: z.string() });

adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    res.json(await adminService.getPlatformStats());
  }),
);

adminRouter.get(
  '/users',
  validateQuery(paginationQuerySchema.extend({ search: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const { page, pageSize, search } = req.query as any;
    res.json(await adminService.listUsers({ page, pageSize }, search));
  }),
);

adminRouter.patch(
  '/users/:id/block',
  validateParams(idParams),
  validateBody(z.object({ blocked: z.boolean() })),
  asyncHandler(async (req, res) => {
    res.json({ user: await adminService.setUserBlocked(req.params.id, req.body.blocked) });
  }),
);

adminRouter.get(
  '/notebooks',
  validateQuery(paginationQuerySchema.extend({ status: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const { page, pageSize, status } = req.query as any;
    res.json(await adminService.listNotebooks({ page, pageSize }, status));
  }),
);

adminRouter.patch(
  '/notebooks/:id/status',
  validateParams(idParams),
  validateBody(z.object({ status: z.enum(['active', 'expired', 'draft']) })),
  asyncHandler(async (req, res) => {
    const notebook = await adminService.forceNotebookStatus(req.params.id, req.body.status, req.user!.sub);
    res.json({ notebook });
  }),
);

adminRouter.get(
  '/orders',
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminService.listOrders(req.query as any));
  }),
);

adminRouter.get(
  '/reports',
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await adminService.listAllReports(req.query as any));
  }),
);

adminRouter.patch(
  '/reports/:id',
  validateParams(idParams),
  validateBody(z.object({ status: z.enum(['dismissed', 'actioned']) })),
  asyncHandler(async (req, res) => {
    const report = await adminService.adminResolveReport(req.params.id, req.user!.sub, req.body.status);
    res.json({ report });
  }),
);

adminRouter.get(
  '/packages',
  asyncHandler(async (_req, res) => {
    res.json({ packages: await adminService.listPackagesAdmin() });
  }),
);

adminRouter.patch(
  '/packages/:id',
  validateParams(idParams),
  validateBody(
    z.object({
      priceCents: z.number().int().nonnegative().optional(),
      active: z.boolean().optional(),
      nameAr: z.string().optional(),
      nameEn: z.string().optional(),
      sortOrder: z.number().int().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    res.json({ package: await adminService.updatePackage(req.params.id, req.body) });
  }),
);

adminRouter.get(
  '/themes',
  asyncHandler(async (_req, res) => {
    res.json({ themes: await adminService.listThemesAdmin() });
  }),
);

adminRouter.patch(
  '/themes/:slug',
  validateParams(slugParams),
  validateBody(z.object({ active: z.boolean().optional(), nameAr: z.string().optional(), nameEn: z.string().optional() })),
  asyncHandler(async (req, res) => {
    res.json({ theme: await adminService.updateTheme(req.params.slug, req.body) });
  }),
);

adminRouter.get(
  '/cover-templates',
  asyncHandler(async (_req, res) => {
    res.json({ coverTemplates: await adminService.listCoverTemplatesAdmin() });
  }),
);

adminRouter.patch(
  '/cover-templates/:id',
  validateParams(idParams),
  validateBody(
    z.object({
      active: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      nameAr: z.string().optional(),
      nameEn: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    res.json({ coverTemplate: await adminService.updateCoverTemplate(req.params.id, req.body) });
  }),
);

adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({ settings: await adminService.getSettings() });
  }),
);

adminRouter.put(
  '/settings/:key',
  validateBody(z.object({ value: z.unknown() })),
  asyncHandler(async (req, res) => {
    res.json({ setting: await adminService.upsertSetting(req.params.key, req.body.value) });
  }),
);
