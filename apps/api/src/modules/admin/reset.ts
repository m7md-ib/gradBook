import { eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  galleryItems,
  graduates,
  messageMedia,
  notebooks,
  platformSettings,
  qrCodes,
  timelineItems,
  users,
} from '../../db/schema/index.js';
import { getStorageProvider } from '../../storage/index.js';
import { env } from '../../config/env.js';

/** RESET_ALL_DATA must start with this, so a stray value can't wipe production. */
export const RESET_TOKEN_PREFIX = 'delete-all-users';
const MARKER_KEY = 'data_reset_token';

export type ResetOutcome =
  | { ran: true; users: number; notebooks: number; filesDeleted: number }
  | { ran: false; reason: 'invalid-token' | 'already-done' };

/** Stored keys are normally storage keys; a few legacy rows hold full public URLs. */
function toStorageKey(value: string): string {
  const base = env.STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, '');
  if (value.startsWith(`${base}/`)) return value.slice(base.length + 1);
  return value;
}

/**
 * Wipes every user account and everything that belongs to users — notebooks,
 * graduates, messages, gallery, timeline, orders and payments, QR codes,
 * analytics, reports, notifications, audit log — plus their uploaded files.
 * The catalog (themes, packages, cover templates) and platform settings stay.
 *
 * Runs once per token: the token is remembered in platform_settings, so a
 * RESET_ALL_DATA left set on the host doesn't wipe again on the next boot.
 * Use a new token (e.g. delete-all-users-2) to wipe again.
 */
export async function resetAllUserData(token: string): Promise<ResetOutcome> {
  if (!token.startsWith(RESET_TOKEN_PREFIX)) return { ran: false, reason: 'invalid-token' };

  const marker = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, MARKER_KEY) });
  if (marker?.value === token) return { ran: false, reason: 'already-done' };

  // Collected before the wipe: the rows that point at uploaded files go with it.
  const keyRows = await Promise.all([
    db.select({ key: notebooks.coverImageKey }).from(notebooks).where(isNotNull(notebooks.coverImageKey)),
    db.select({ key: graduates.profilePhotoKey }).from(graduates).where(isNotNull(graduates.profilePhotoKey)),
    db.select({ key: messageMedia.fileKey }).from(messageMedia),
    db.select({ key: galleryItems.imageKey }).from(galleryItems),
    db.select({ key: timelineItems.imageKey }).from(timelineItems).where(isNotNull(timelineItems.imageKey)),
    db.select({ key: qrCodes.imageKey }).from(qrCodes),
  ]);
  const keys = new Set<string>();
  for (const rows of keyRows) {
    for (const { key } of rows) {
      if (!key) continue;
      const storageKey = toStorageKey(key);
      keys.add(storageKey);
      // processAndStoreImage writes a "-thumb" variant next to some uploads.
      if (storageKey.endsWith('.webp')) keys.add(storageKey.replace(/\.webp$/, '-thumb.webp'));
    }
  }

  const [{ userCount }] = await db.select({ userCount: sql<number>`count(*)::int` }).from(users);
  const [{ notebookCount }] = await db.select({ notebookCount: sql<number>`count(*)::int` }).from(notebooks);

  await db.transaction(async (tx) => {
    // CASCADE empties every table that references these (refresh tokens,
    // orders, payments, subscriptions, graduates, pages, messages and media,
    // gallery, timeline, QR codes, analytics, reports, moderation actions,
    // notifications). Tables they reference — themes, packages, cover
    // templates — are untouched.
    await tx.execute(sql`TRUNCATE TABLE users, notebooks, audit_logs, password_reset_tokens CASCADE`);
    await tx
      .insert(platformSettings)
      .values({ key: MARKER_KEY, value: token })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value: token, updatedAt: new Date() } });
  });

  // Best effort, after the data is gone: a file that's already missing or a
  // storage hiccup must not undo or block the reset.
  const storage = getStorageProvider();
  let filesDeleted = 0;
  for (const key of keys) {
    try {
      await storage.delete(key);
      filesDeleted += 1;
    } catch {
      // ignore
    }
  }

  return { ran: true, users: Number(userCount), notebooks: Number(notebookCount), filesDeleted };
}
