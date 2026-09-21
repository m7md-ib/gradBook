import { and, desc, eq, sql } from 'drizzle-orm';
import type { CreateReportInput, PaginationQuery } from '@daftar/shared';
import { paginate } from '@daftar/shared';
import { db } from '../../db/client.js';
import { reports, moderationActions } from '../../db/schema/index.js';
import { sanitizePlainText } from '../../lib/sanitize.js';
import { ApiError } from '../../lib/errors.js';

export async function createReport(notebookId: string, input: CreateReportInput, reporterIpHash: string) {
  const [report] = await db
    .insert(reports)
    .values({
      notebookId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: sanitizePlainText(input.reason),
      reporterIpHash,
    })
    .returning();
  return report;
}

export async function listReportsForOwner(notebookId: string, pagination: PaginationQuery) {
  const where = eq(reports.notebookId, notebookId);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(reports).where(where);
  const items = await db.query.reports.findMany({
    where,
    orderBy: [desc(reports.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });
  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function resolveReport(
  notebookId: string,
  reportId: string,
  actorUserId: string,
  status: 'dismissed' | 'actioned',
) {
  const [report] = await db
    .update(reports)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(reports.id, reportId), eq(reports.notebookId, notebookId)))
    .returning();
  if (!report) throw ApiError.notFound('البلاغ غير موجود');

  await db.insert(moderationActions).values({
    notebookId,
    actorUserId,
    actionType: status === 'dismissed' ? 'dismiss_report' : 'hide',
    targetType: report.targetType,
    targetId: report.targetId,
  });

  return report;
}
