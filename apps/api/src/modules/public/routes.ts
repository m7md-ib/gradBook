import { Router } from 'express';
import { z } from 'zod';
import {
  createMessageSchema,
  createReportSchema,
  paginationQuerySchema,
  slugParamSchema,
} from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { messageRateLimiter } from '../../middleware/rate-limit.js';
import { imageUpload, processAndStoreImage } from '../../lib/upload.js';
import { getStorageProvider } from '../../storage/index.js';
import { ApiError } from '../../lib/errors.js';
import * as publicService from './service.js';
import * as messageService from './../messages/service.js';
import * as galleryService from './../gallery/service.js';
import * as timelineService from './../timeline/service.js';
import * as moderationService from './../moderation/service.js';
import * as analyticsService from './../analytics/service.js';
import * as qrService from './../notebooks/qr-service.js';
import { assertViewable, assertWritable, grantAccessCookie } from './access.js';
import { hashVisitor, submitterFingerprint } from './visitor.js';

export const publicRouter = Router();

const slugParams = slugParamSchema;
const listQuery = paginationQuerySchema.extend({ targetGraduateId: z.string().uuid().optional() });

publicRouter.get(
  '/:slug',
  validateParams(slugParams),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);

    if (notebook.status === 'expired') {
      return res.json({
        expired: true,
        title: notebook.title,
        graduateNames: notebook.graduates.map((g) => g.fullName),
      });
    }

    try {
      assertViewable(req, notebook);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'access_code_required') {
        return res.status(403).json({ error: { code: err.code, message: err.message } });
      }
      throw err;
    }

    await analyticsService.trackEvent(notebook.id, 'notebook_view', hashVisitor(req));
    res.json(await publicService.buildPublicSummary(notebook));
  }),
);

publicRouter.post(
  '/:slug/access',
  validateParams(slugParams),
  validateBody(z.object({ code: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    if (!notebook.accessCode || notebook.accessCode !== req.body.code.trim()) {
      throw ApiError.forbidden('رمز الدخول غير صحيح');
    }
    grantAccessCookie(res, notebook.id);
    res.json({ granted: true });
  }),
);

publicRouter.get(
  '/:slug/messages',
  validateParams(slugParams),
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    assertViewable(req, notebook);
    const { page, pageSize, targetGraduateId } = req.query as any;
    const result = await messageService.listPublicApproved(notebook.id, { page, pageSize }, targetGraduateId);

    const storage = getStorageProvider();
    res.json({
      ...result,
      items: result.items.map((m) => ({
        id: m.id,
        authorName: m.authorName,
        body: m.body,
        relationship: m.relationship,
        reaction: m.reaction,
        featured: m.featured,
        pageNumber: m.pageNumber,
        targetGraduateId: m.targetGraduateId,
        createdAt: m.createdAt,
        photoUrl: m.media[0] ? storage.getPublicUrl(m.media[0].fileKey) : null,
      })),
    });
  }),
);

publicRouter.get(
  '/:slug/gallery',
  validateParams(slugParams),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    assertViewable(req, notebook);
    const result = await galleryService.listPublicApproved(notebook.id, req.query as any);
    const storage = getStorageProvider();
    res.json({
      ...result,
      items: result.items.map((item) => ({ ...item, imageUrl: storage.getPublicUrl(item.imageKey) })),
    });
  }),
);

publicRouter.get(
  '/:slug/timeline',
  validateParams(slugParams),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    assertViewable(req, notebook);
    const items = await timelineService.listTimeline(notebook.id);
    const storage = getStorageProvider();
    res.json({
      items: items.map((item) => ({
        ...item,
        imageUrl: item.imageKey ? storage.getPublicUrl(item.imageKey) : null,
      })),
    });
  }),
);

publicRouter.post(
  '/:slug/messages',
  messageRateLimiter,
  validateParams(slugParams),
  imageUpload.single('file'),
  validateBody(createMessageSchema.omit({ photoUrl: true })),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    assertWritable(req, notebook);

    let photoUrl: string | undefined;
    if (req.file) {
      const processed = await processAndStoreImage(req.file.buffer, 'messages', { maxWidth: 1400 });
      photoUrl = processed.url;
    }

    const message = await messageService.createMessage(notebook, { ...req.body, photoUrl }, {
      ipHash: hashVisitor(req),
      fingerprint: submitterFingerprint(req, notebook.id),
    });

    await analyticsService.trackEvent(notebook.id, 'message_submit', hashVisitor(req));
    res.status(201).json({
      message: { id: message.id, status: message.status },
      requiresApproval: message.status === 'pending',
    });
  }),
);

publicRouter.post(
  '/:slug/gallery',
  messageRateLimiter,
  validateParams(slugParams),
  imageUpload.single('file'),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    assertWritable(req, notebook);
    if (!req.file) throw ApiError.badRequest('يجب اختيار صورة');

    const processed = await processAndStoreImage(req.file.buffer, 'gallery', { maxWidth: 1600 });
    const item = await galleryService.addGalleryItem(
      notebook,
      processed.key,
      req.body.caption,
      req.body.submittedByName,
    );
    res.status(201).json({ item, requiresApproval: !item?.approved });
  }),
);

publicRouter.post(
  '/:slug/report',
  validateParams(slugParams),
  validateBody(createReportSchema),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    assertViewable(req, notebook);
    await moderationService.createReport(notebook.id, req.body, hashVisitor(req));
    res.status(201).json({ received: true });
  }),
);

const eventBodySchema = z.object({
  type: z.enum(['notebook_open', 'write_start', 'share_click', 'qr_scan']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

publicRouter.post(
  '/:slug/events',
  validateParams(slugParams),
  validateBody(eventBodySchema),
  asyncHandler(async (req, res) => {
    const notebook = await publicService.findNotebookBySlug(req.params.slug);
    assertViewable(req, notebook);

    await analyticsService.trackEvent(notebook.id, req.body.type, hashVisitor(req), req.body.metadata);
    if (req.body.type === 'qr_scan') {
      await qrService.incrementQrScan(notebook.id);
    }
    res.status(204).send();
  }),
);
