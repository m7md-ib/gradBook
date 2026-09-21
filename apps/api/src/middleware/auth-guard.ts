import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@daftar/shared';
import { getAccessTokenFromRequest } from '../auth/cookies.js';
import { verifyAccessToken } from '../auth/jwt.js';
import { ApiError } from '../lib/errors.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    return next(ApiError.unauthorized());
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('انتهت صلاحية الجلسة، سجّل الدخول مرة أخرى'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getAccessTokenFromRequest(req);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Ignore invalid/expired tokens on optional routes.
    }
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
