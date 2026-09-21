import { and, desc, eq, sql } from 'drizzle-orm';
import type { PaginationQuery } from '@daftar/shared';
import { paginate } from '@daftar/shared';
import { db } from '../../db/client.js';
import { galleryItems, moderationActions } from '../../db/schema/index.js';
import type { Notebook } from '../../db/schema/notebooks.js';
import { sanitizePlainText } from '../../lib/sanitize.js';
import { ApiError } from '../../lib/errors.js';

export async function addGalleryItem(
  notebook: Notebook,
  imageKey: string,
  caption: string | undefined,
  submittedByName: string | undefined,
) {
  if (!notebook.allowGallery) {
    throw ApiError.badRequest('معرض الذكريات غير مفعّل لهذا الدفتر');
  }

  const [item] = await db
    .insert(galleryItems)
    .values({
      notebookId: notebook.id,
      imageKey,
      caption: caption ? sanitizePlainText(caption) : null,
      submittedByName: submittedByName ? sanitizePlainText(submittedByName) : null,
      approved: notebook.approvalMode === 'auto',
    })
    .returning();

  return item;
}

export async function listPublicApproved(notebookId: string, pagination: PaginationQuery) {
  const where = and(eq(galleryItems.notebookId, notebookId), eq(galleryItems.approved, true));
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(galleryItems).where(where);
  const items = await db.query.galleryItems.findMany({
    where,
    orderBy: [desc(galleryItems.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });
  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function listForOwner(notebookId: string, pagination: PaginationQuery) {
  const where = eq(galleryItems.notebookId, notebookId);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(galleryItems).where(where);
  const items = await db.query.galleryItems.findMany({
    where,
    orderBy: [desc(galleryItems.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });
  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function setApproved(notebookId: string, itemId: string, actorUserId: string, approved: boolean) {
  const [item] = await db
    .update(galleryItems)
    .set({ approved })
    .where(and(eq(galleryItems.id, itemId), eq(galleryItems.notebookId, notebookId)))
    .returning();
  if (!item) throw ApiError.notFound();

  await db.insert(moderationActions).values({
    notebookId,
    actorUserId,
    actionType: approved ? 'approve' : 'hide',
    targetType: 'gallery_item',
    targetId: itemId,
  });

  return item;
}

export async function deleteItem(notebookId: string, itemId: string, actorUserId: string) {
  await db.delete(galleryItems).where(and(eq(galleryItems.id, itemId), eq(galleryItems.notebookId, notebookId)));
  await db.insert(moderationActions).values({
    notebookId,
    actorUserId,
    actionType: 'delete',
    targetType: 'gallery_item',
    targetId: itemId,
  });
}
