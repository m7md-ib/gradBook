import type { NextFunction, Request, Response } from 'express';
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
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    res.cookie('daftar_csrf', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: req.secure,
      path: '/',
    });
  }
  next();
}
