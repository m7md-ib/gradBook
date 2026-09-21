import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env.js';

const ACCESS_COOKIE = 'daftar_access';
const REFRESH_COOKIE = 'daftar_refresh';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  domain: env.NODE_ENV === 'production' ? env.COOKIE_DOMAIN : undefined,
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseCookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_COOKIE, { ...baseCookieOptions, path: '/api/auth' });
}

export function getAccessTokenFromRequest(req: Request): string | undefined {
  return req.cookies?.[ACCESS_COOKIE];
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE];
}
