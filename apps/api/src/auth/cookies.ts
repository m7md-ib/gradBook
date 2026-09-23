import type { CookieOptions, Request, Response } from 'express';
import { env, isProduction } from '../config/env.js';

const ACCESS_COOKIE = 'daftar_access';
const REFRESH_COOKIE = 'daftar_refresh';

// The frontend and API are typically deployed on different registrable
// domains (e.g. a Vercel app and a Render service). `SameSite=Lax` cookies
// are not sent on cross-site XHR/fetch requests, so auth would silently
// break after deployment unless the two share a root domain. `None`
// (which requires `Secure`) works in both the shared-domain and
// separate-domain cases, so it's the safer production default; CSRF is
// still enforced independently via the double-submit cookie above.
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: isProduction ? 'none' : 'lax',
  // Only set an explicit Domain when one was actually configured for a
  // shared-root-domain deployment; otherwise let the browser default to
  // the exact API host (setting a mismatched Domain makes the browser
  // reject the cookie entirely).
  domain: isProduction && env.COOKIE_DOMAIN !== 'localhost' ? env.COOKIE_DOMAIN : undefined,
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
