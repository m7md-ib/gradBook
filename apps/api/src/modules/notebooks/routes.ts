import { Router } from 'express';
import {
  coverCustomizationSchema,
  createNotebookSchema,
  graduateInfoSchema,
  introPageSchema,
  notebookSettingsSchema,
  updateNotebookSlugSchema,
} from '@daftar/shared';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { imageUpload, processAndStoreImage } from '../../lib/upload.js';
import { ApiError } from '../../lib/errors.js';
import * as notebookService from './service.js';
import * as graduatesService from './graduates-service.js';
import * as qrService from './qr-service.js';
import * as statsService from './stats-service.js';

export const notebooksRouter = Router();

notebooksRouter.use(requireAuth);

const notebookIdParams = z.object({ id: z.string().uuid() });
const graduateParams = z.object({ id: z.string().uuid(), graduateId: z.string().uuid() });

notebooksRouter.post(
  '/',
  validateBody(z.object({ notebook: createNotebookSchema, graduate: graduateInfoSchema })),
  asyncHandler(async (req, res) => {
    const { notebook, graduate } = req.body as {
      notebook: z.infer<typeof createNotebookSchema>;
      graduate: z.infer<typeof graduateInfoSchema>;
    };
    const result = await notebookService.createNotebookWithGraduate(req.user!.sub, notebook, graduate);
    res.status(201).json(result);
  }),
);

notebooksRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    res.json({ notebooks: await notebookService.listMyNotebooks(req.user!.sub) });
  }),
);

notebooksRouter.get(
  '/:id',
  validateParams(notebookIdParams),
  asyncHandler(async (req, res) => {
    const notebook = await notebookService.getNotebookForOwnerWithCoverUrl(
      req.params.id,
      req.user!.sub,
      req.user!.role === 'admin',
    );
    res.json({ notebook });
  }),
);

notebooksRouter.patch(
  '/:id/slug',
  validateParams(notebookIdParams),
  validateBody(updateNotebookSlugSchema),
  asyncHandler(async (req, res) => {
    const notebook = await notebookService.updateSlug(req.params.id, req.user!.sub, req.body.slug);
    res.json({ notebook });
  }),
);

notebooksRouter.patch(
  '/:id/cover',
  validateParams(notebookIdParams),
  validateBody(coverCustomizationSchema),
  asyncHandler(async (req, res) => {
    const notebook = await notebookService.updateCover(req.params.id, req.user!.sub, req.body);
    res.json({ notebook });
  }),
);

notebooksRouter.post(
  '/:id/cover/upload',
  validateParams(notebookIdParams),
  imageUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('يجب اختيار صورة');
    const processed = await processAndStoreImage(req.file.buffer, 'covers', { maxWidth: 1920 });
    const notebook = await notebookService.setCoverImage(req.params.id, req.user!.sub, processed.key);
    res.json({ notebook, image: processed });
  }),
);

notebooksRouter.patch(
  '/:id/settings',
  validateParams(notebookIdParams),
  validateBody(notebookSettingsSchema),
  asyncHandler(async (req, res) => {
    const notebook = await notebookService.updateSettings(req.params.id, req.user!.sub, req.body);
    res.json({ notebook });
  }),
);

notebooksRouter.patch(
  '/:id/intro',
  validateParams(notebookIdParams),
  validateBody(introPageSchema),
  asyncHandler(async (req, res) => {
    const notebook = await notebookService.updateIntro(req.params.id, req.user!.sub, req.body);
    res.json({ notebook });
  }),
);

notebooksRouter.get(
  '/:id/stats',
  validateParams(notebookIdParams),
  asyncHandler(async (req, res) => {
    res.json({ stats: await statsService.getNotebookStats(req.params.id, req.user!.sub) });
  }),
);

notebooksRouter.get(
  '/:id/qr',
  validateParams(notebookIdParams),
  asyncHandler(async (req, res) => {
    res.json({ qr: await qrService.getOrCreateQrCode(req.params.id, req.user!.sub) });
  }),
);

notebooksRouter.post(
  '/:id/qr/regenerate',
  validateParams(notebookIdParams),
  asyncHandler(async (req, res) => {
    res.json({ qr: await qrService.regenerateQrCode(req.params.id, req.user!.sub) });
  }),
);

// ── Graduates (class mode) ────────────────────────────────────────────────

notebooksRouter.get(
  '/:id/graduates',
  validateParams(notebookIdParams),
  asyncHandler(async (req, res) => {
    await notebookService.getNotebookForOwner(req.params.id, req.user!.sub, req.user!.role === 'admin');
    res.json({ graduates: await graduatesService.listGraduates(req.params.id) });
  }),
);

notebooksRouter.post(
  '/:id/graduates',
  validateParams(notebookIdParams),
  validateBody(graduateInfoSchema),
  asyncHandler(async (req, res) => {
    const graduate = await graduatesService.addGraduate(req.params.id, req.user!.sub, req.body);
    res.status(201).json({ graduate });
  }),
);

notebooksRouter.patch(
  '/:id/graduates/:graduateId',
  validateParams(graduateParams),
  validateBody(graduateInfoSchema.partial()),
  asyncHandler(async (req, res) => {
    const graduate = await graduatesService.updateGraduate(
      req.params.id,
      req.params.graduateId,
      req.user!.sub,
      req.body,
    );
    res.json({ graduate });
  }),
);

notebooksRouter.post(
  '/:id/graduates/:graduateId/photo',
  validateParams(graduateParams),
  imageUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('يجب اختيار صورة');
    const processed = await processAndStoreImage(req.file.buffer, 'profiles', { maxWidth: 800 });
    const graduate = await graduatesService.setGraduatePhoto(
      req.params.id,
      req.params.graduateId,
      req.user!.sub,
      processed.key,
    );
    res.json({ graduate, image: processed });
  }),
);

notebooksRouter.delete(
  '/:id/graduates/:graduateId',
  validateParams(graduateParams),
  asyncHandler(async (req, res) => {
    await graduatesService.removeGraduate(req.params.id, req.params.graduateId, req.user!.sub);
    res.status(204).send();
  }),
);
