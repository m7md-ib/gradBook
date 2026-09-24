import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import path from 'node:path';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { csrfProtection, issueCsrfCookie } from './middleware/csrf.js';
import { generalApiLimiter } from './middleware/rate-limit.js';

import { authRouter } from './modules/auth/routes.js';
import { catalogRouter } from './modules/catalog/routes.js';
import { notebooksRouter } from './modules/notebooks/routes.js';
import { messagesRouter } from './modules/messages/routes.js';
import { galleryRouter } from './modules/gallery/routes.js';
import { timelineRouter } from './modules/timeline/routes.js';
import { reportsRouter } from './modules/moderation/routes.js';
import { ordersRouter } from './modules/commerce/routes.js';
import { paymentWebhookRouter } from './modules/commerce/webhook-route.js';
import { publicRouter } from './modules/public/routes.js';
import { adminRouter } from './modules/admin/routes.js';
import { notificationsRouter } from './modules/notifications/routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.APP_URL, credentials: true }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

  // Stripe webhook signature verification needs the exact raw bytes, so this is
  // mounted before the global express.json() body parser.
  app.use('/api/payments/webhook', paymentWebhookRouter);

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(issueCsrfCookie);
  app.use(csrfProtection);
  app.use(generalApiLimiter);

  if (env.STORAGE_PROVIDER === 'local') {
    app.use('/uploads', express.static(path.resolve(env.STORAGE_LOCAL_DIR), { maxAge: '30d' }));
  }

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // The frontend can't read the daftar_csrf cookie via document.cookie when
  // it's on a different origin from the API (cross-site cookies aren't
  // visible to page JS), so it fetches the value here instead and echoes it
  // back as the x-csrf-token header on mutating requests.
  app.get('/api/csrf-token', (req, res) => res.json({ csrfToken: req.csrfToken }));

  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/notebooks/:id/messages', messagesRouter);
  app.use('/api/notebooks/:id/gallery', galleryRouter);
  app.use('/api/notebooks/:id/timeline', timelineRouter);
  app.use('/api/notebooks/:id/reports', reportsRouter);
  app.use('/api/notebooks', notebooksRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/public/notebooks', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}
