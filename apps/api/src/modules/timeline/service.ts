import { and, asc, eq } from 'drizzle-orm';
import type { CreateTimelineItemInput } from '@daftar/shared';
import { db } from '../../db/client.js';
import { timelineItems } from '../../db/schema/index.js';
import { ApiError } from '../../lib/errors.js';
import { sanitizePlainText } from '../../lib/sanitize.js';

export async function listTimeline(notebookId: string) {
  return db.query.timelineItems.findMany({
    where: eq(timelineItems.notebookId, notebookId),
    orderBy: [asc(timelineItems.sortOrder), asc(timelineItems.date)],
  });
}

export async function createTimelineItem(notebookId: string, input: CreateTimelineItemInput) {
  const [item] = await db
    .insert(timelineItems)
    .values({
      notebookId,
      type: input.type,
      title: sanitizePlainText(input.title),
      description: input.description ? sanitizePlainText(input.description) : null,
      date: input.date,
      imageKey: input.imageUrl,
      sortOrder: input.sortOrder,
    })
    .returning();
  return item;
}

export async function updateTimelineItem(
  notebookId: string,
  itemId: string,
  input: Partial<CreateTimelineItemInput>,
) {
  const existing = await db.query.timelineItems.findFirst({
    where: and(eq(timelineItems.id, itemId), eq(timelineItems.notebookId, notebookId)),
  });
  if (!existing) throw ApiError.notFound('عنصر الخط الزمني غير موجود');

  const [updated] = await db
    .update(timelineItems)
    .set({
      type: input.type ?? existing.type,
      title: input.title ? sanitizePlainText(input.title) : existing.title,
      description:
        input.description !== undefined ? sanitizePlainText(input.description ?? '') : existing.description,
      date: input.date ?? existing.date,
      imageKey: input.imageUrl ?? existing.imageKey,
      sortOrder: input.sortOrder ?? existing.sortOrder,
    })
    .where(eq(timelineItems.id, itemId))
    .returning();

  return updated;
}

export async function deleteTimelineItem(notebookId: string, itemId: string) {
  await db.delete(timelineItems).where(and(eq(timelineItems.id, itemId), eq(timelineItems.notebookId, notebookId)));
}
