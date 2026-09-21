import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';

function rateLimitedResponder() {
  return (_req: Request, _res: unknown, next: (err: unknown) => void) => {
    next(ApiError.tooMany());
  };
}

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponder(),
});

export const messageRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_MESSAGES,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.params.notebookId ?? req.params.slug ?? 'unknown'}`,
  handler: rateLimitedResponder(),
});

export const generalApiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponder(),
});
