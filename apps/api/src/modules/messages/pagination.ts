import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { notebookPages, messages } from '../../db/schema/index.js';

/** Each approved message becomes its own notebook page, in the order it was approved. */
export async function assignPageNumber(
  tx: Database,
  notebookId: string,
  messageId: string,
): Promise<number> {
  const [row] = await tx
    .select({ maxPage: sql<number>`COALESCE(MAX(${notebookPages.pageNumber}), 0)` })
    .from(notebookPages)
    .where(eq(notebookPages.notebookId, notebookId));

  const nextPage = (row?.maxPage ?? 0) + 1;
  const [page] = await tx.insert(notebookPages).values({ notebookId, pageNumber: nextPage }).returning();

  await tx
    .update(messages)
    .set({ pageId: page!.id, pageNumber: nextPage })
    .where(eq(messages.id, messageId));

  return nextPage;
}
