import crypto from 'node:crypto';
import type { Request } from 'express';

/** Privacy-preserving pseudo-identifier: not reversible to the visitor's real IP. */
export function hashVisitor(req: Request): string {
  const ip = req.ip ?? 'unknown';
  const ua = req.get('user-agent') ?? 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${ip}:${ua}:${day}`).digest('hex');
}

/** Stable across a submitter's session (not date-bound) — used for duplicate-submission checks. */
export function submitterFingerprint(req: Request, notebookId: string): string {
  const ip = req.ip ?? 'unknown';
  const ua = req.get('user-agent') ?? 'unknown';
  return crypto.createHash('sha256').update(`${ip}:${ua}:${notebookId}`).digest('hex');
}
