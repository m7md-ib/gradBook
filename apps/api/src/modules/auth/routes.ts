import { Router } from 'express';
import { loginSchema, signupSchema, type AuthUser } from '@daftar/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import { requireAuth } from '../../middleware/auth-guard.js';
import { clearAuthCookies, getRefreshTokenFromRequest, setAuthCookies } from '../../auth/cookies.js';
import { ApiError } from '../../lib/errors.js';
import * as authService from './service.js';
import type { User } from '../../db/schema/identity.js';

export const authRouter = Router();

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    locale: user.locale,
    createdAt: user.createdAt.toISOString(),
  };
}

authRouter.post(
  '/signup',
  authRateLimiter,
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { user, tokens } = await authService.signup(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(201).json({ user: toAuthUser(user) });
  }),
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { user, tokens } = await authService.login(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ user: toAuthUser(user) });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) await authService.revokeRefreshToken(refreshToken);
    clearAuthCookies(res);
    res.status(204).send();
  }),
);

authRouter.post(
  '/refresh',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) throw ApiError.unauthorized();
    const { user, tokens } = await authService.rotateRefreshToken(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ user: toAuthUser(user) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user!.sub);
    if (!user) throw ApiError.unauthorized();
    res.json({ user: toAuthUser(user) });
  }),
);
