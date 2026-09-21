import { and, count, countDistinct, eq, sql } from 'drizzle-orm';
import type { NotebookStats } from '@daftar/shared';
import { db } from '../../db/client.js';
import { messages, analyticsEvents, qrCodes } from '../../db/schema/index.js';
import { getNotebookForOwner } from './service.js';

export async function getNotebookStats(notebookId: string, userId: string): Promise<NotebookStats> {
  await getNotebookForOwner(notebookId, userId);

  const [messageCounts] = await db
    .select({
      total: count(),
      pending: count(sql`CASE WHEN ${messages.status} = 'pending' THEN 1 END`),
      approved: count(sql`CASE WHEN ${messages.status} = 'approved' THEN 1 END`),
    })
    .from(messages)
    .where(eq(messages.notebookId, notebookId));

  const [visitorRow] = await db
    .select({ visitors: countDistinct(analyticsEvents.visitorHash) })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.notebookId, notebookId), eq(analyticsEvents.type, 'notebook_view')));

  const [shareRow] = await db
    .select({ clicks: count() })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.notebookId, notebookId), eq(analyticsEvents.type, 'share_click')));

  const qrRow = await db.query.qrCodes.findFirst({ where: eq(qrCodes.notebookId, notebookId) });

  const [mostActiveRow] = await db
    .select({
      day: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`,
      total: count(),
    })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.notebookId, notebookId))
    .groupBy(sql`1`)
    .orderBy(sql`2 DESC`)
    .limit(1);

  return {
    totalMessages: messageCounts?.total ?? 0,
    pendingMessages: messageCounts?.pending ?? 0,
    approvedMessages: messageCounts?.approved ?? 0,
    totalVisitors: visitorRow?.visitors ?? 0,
    qrScans: qrRow?.scanCount ?? 0,
    shareClicks: shareRow?.clicks ?? 0,
    mostActiveDay: mostActiveRow?.day ?? null,
  };
}
