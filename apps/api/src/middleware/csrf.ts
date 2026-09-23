import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env, isProduction } from '../config/env.js';
import { ApiError } from '../lib/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie CSRF protection: the SPA reads the non-httpOnly
 * `daftar_csrf` cookie (set on session start) and echoes it back in the
 * `x-csrf-token` header on every mutating request. A cross-site page cannot
 * read our cookie (browser same-origin policy), so it cannot forge the header.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.daftar_csrf;
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(ApiError.forbidden('فشل التحقق من الجلسة (CSRF)، أعد تحميل الصفحة'));
  }
  next();
}

export function issueCsrfCookie(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.daftar_csrf) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('daftar_csrf', token, {
      httpOnly: false,
      // Must match the SameSite policy of the auth cookies (see
      // apps/api/src/auth/cookies.ts) — otherwise the browser drops this
      // cookie on cross-site requests and every mutating request fails
      // CSRF validation in production.
      sameSite: isProduction ? 'none' : 'lax',
      secure: env.COOKIE_SECURE,
      path: '/',
    });
  }
  next();
}
