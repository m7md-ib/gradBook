import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/errors.js';
import type { Notebook } from '../../db/schema/notebooks.js';

const ACCESS_COOKIE_PREFIX = 'nb_access_';

export function grantAccessCookie(res: Response, notebookId: string) {
  res.cookie(`${ACCESS_COOKIE_PREFIX}${notebookId}`, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    maxAge: 90 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function hasAccessCookie(req: Request, notebookId: string): boolean {
  return req.cookies?.[`${ACCESS_COOKIE_PREFIX}${notebookId}`] === '1';
}

export function assertViewable(req: Request, notebook: Notebook) {
  if (notebook.visibility === 'private' && !hasAccessCookie(req, notebook.id)) {
    throw new ApiError(403, 'access_code_required', 'يتطلب فتح هذا الدفتر رمز دخول سرّي');
  }
}

export function assertWritable(req: Request, notebook: Notebook) {
  assertViewable(req, notebook);
  if (notebook.visibility === 'invite_only' && !hasAccessCookie(req, notebook.id)) {
    throw new ApiError(403, 'invite_code_required', 'الكتابة في هذا الدفتر تتطلب رمز دعوة');
  }
}
