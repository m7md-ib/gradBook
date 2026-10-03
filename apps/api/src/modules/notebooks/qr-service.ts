import QRCode from 'qrcode';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { qrCodes } from '../../db/schema/index.js';
import { getStorageProvider } from '../../storage/index.js';
import { env } from '../../config/env.js';
import { getNotebookForOwner } from './service.js';

function notebookPublicUrl(slug: string): string {
  return `${env.APP_URL.replace(/\/$/, '')}/d/${slug}`;
}

async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 640,
    margin: 2,
    color: { dark: '#1B1812', light: '#FFFFFFFF' },
  });
}

export async function getOrCreateQrCode(notebookId: string, userId: string) {
  const notebook = await getNotebookForOwner(notebookId, userId);
  const existing = await db.query.qrCodes.findFirst({ where: eq(qrCodes.notebookId, notebookId) });
  if (existing) return withImageUrl(existing);

  return regenerateQrCode(notebook.id, userId);
}

export async function regenerateQrCode(notebookId: string, userId: string) {
  const notebook = await getNotebookForOwner(notebookId, userId);
  const storage = getStorageProvider();
  const buffer = await generateQrBuffer(notebookPublicUrl(notebook.slug));
  const { key } = await storage.upload({
    key: `qr/${notebook.id}.png`,
    buffer,
    contentType: 'image/png',
  });

  const [row] = await db
    .insert(qrCodes)
    .values({ notebookId, imageKey: key })
    .onConflictDoUpdate({
      target: qrCodes.notebookId,
      set: { imageKey: key, updatedAt: new Date() },
    })
    .returning();

  return withImageUrl(row!);
}

function withImageUrl<T extends { imageKey: string }>(row: T) {
  return { ...row, imageUrl: getStorageProvider().getPublicUrl(row.imageKey) };
}

export async function incrementQrScan(notebookId: string) {
  // Atomic SQL increment, not read-then-write — a batch of QR scans arriving
  // at once (e.g. at a graduation ceremony) would otherwise lose counts to
  // the race between concurrent requests reading the same stale value.
  await db
    .update(qrCodes)
    .set({ scanCount: sql`${qrCodes.scanCount} + 1` })
    .where(eq(qrCodes.notebookId, notebookId));
}
