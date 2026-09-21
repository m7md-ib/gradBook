import { count, desc, eq, ilike, sql, sum } from 'drizzle-orm';
import type { PaginationQuery } from '@daftar/shared';
import { paginate } from '@daftar/shared';
import { db } from '../../db/client.js';
import {
  users,
  notebooks,
  graduates,
  messages,
  orders,
  reports,
  packages,
  notebookThemes,
  coverTemplates,
  platformSettings,
  analyticsEvents,
  moderationActions,
} from '../../db/schema/index.js';
import { ApiError } from '../../lib/errors.js';

export async function getPlatformStats() {
  const [[notebookTotals], [graduateTotals], [messageTotals], [visitorTotals], [revenueTotals]] =
    await Promise.all([
      db
        .select({
          total: count(),
          active: count(sql`CASE WHEN ${notebooks.status} = 'active' THEN 1 END`),
        })
        .from(notebooks),
      db.select({ total: count() }).from(graduates),
      db.select({ total: count() }).from(messages),
      db.select({ total: count(sql`DISTINCT ${analyticsEvents.visitorHash}`) }).from(analyticsEvents),
      db
        .select({ total: sum(orders.amountCents) })
        .from(orders)
        .where(eq(orders.status, 'paid')),
    ]);

  const popularThemes = await db
    .select({ themeSlug: notebooks.themeSlug, total: count() })
    .from(notebooks)
    .groupBy(notebooks.themeSlug)
    .orderBy(desc(count()))
    .limit(5);

  return {
    totalNotebooks: notebookTotals?.total ?? 0,
    activeNotebooks: notebookTotals?.active ?? 0,
    totalGraduates: graduateTotals?.total ?? 0,
    totalMessages: messageTotals?.total ?? 0,
    totalVisitors: visitorTotals?.total ?? 0,
    revenueCents: Number(revenueTotals?.total ?? 0),
    popularThemes,
  };
}

export async function listUsers(pagination: PaginationQuery, search?: string) {
  const where = search ? ilike(users.email, `%${search}%`) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(users).where(where);
  const items = await db.query.users.findMany({
    where,
    orderBy: [desc(users.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
    columns: { passwordHash: false },
  });
  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function setUserBlocked(userId: string, blocked: boolean) {
  const [user] = await db
    .update(users)
    .set({ blockedAt: blocked ? new Date() : null, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email, blockedAt: users.blockedAt });
  if (!user) throw ApiError.notFound('المستخدم غير موجود');
  return user;
}

type NotebookStatusValue = 'draft' | 'pending_payment' | 'active' | 'expired';

export async function listNotebooks(pagination: PaginationQuery, status?: string) {
  const where = status ? eq(notebooks.status, status as NotebookStatusValue) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(notebooks).where(where);
  const items = await db.query.notebooks.findMany({
    where,
    with: { graduates: true, owner: { columns: { email: true, fullName: true } } },
    orderBy: [desc(notebooks.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });
  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function forceNotebookStatus(
  notebookId: string,
  status: 'active' | 'expired' | 'draft',
  actorUserId: string,
) {
  const [notebook] = await db
    .update(notebooks)
    .set({ status, updatedAt: new Date() })
    .where(eq(notebooks.id, notebookId))
    .returning();
  if (!notebook) throw ApiError.notFound('الدفتر غير موجود');

  await db.insert(moderationActions).values({
    notebookId,
    actorUserId,
    actionType: status === 'active' ? 'approve' : 'hide',
    targetType: 'notebook',
    targetId: notebookId,
    reason: `admin_force_status:${status}`,
  });

  return notebook;
}

export async function listOrders(pagination: PaginationQuery) {
  const [{ total }] = await db.select({ total: count() }).from(orders);
  const items = await db.query.orders.findMany({
    with: { package: true, payments: true, user: { columns: { email: true, fullName: true } } },
    orderBy: [desc(orders.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });
  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function listAllReports(pagination: PaginationQuery) {
  const [{ total }] = await db.select({ total: count() }).from(reports);
  const items = await db.query.reports.findMany({
    orderBy: [desc(reports.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });
  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function adminResolveReport(reportId: string, actorUserId: string, status: 'dismissed' | 'actioned') {
  const report = await db.query.reports.findFirst({ where: eq(reports.id, reportId) });
  if (!report) throw ApiError.notFound('البلاغ غير موجود');

  const [updated] = await db
    .update(reports)
    .set({ status, updatedAt: new Date() })
    .where(eq(reports.id, reportId))
    .returning();

  await db.insert(moderationActions).values({
    notebookId: report.notebookId,
    actorUserId,
    actionType: status === 'dismissed' ? 'dismiss_report' : 'hide',
    targetType: report.targetType,
    targetId: report.targetId,
  });

  return updated;
}

export async function listPackagesAdmin() {
  return db.query.packages.findMany({ orderBy: (t, { asc }) => [asc(t.sortOrder)] });
}

export async function updatePackage(
  packageId: string,
  input: Partial<{ priceCents: number; active: boolean; nameAr: string; nameEn: string; sortOrder: number }>,
) {
  const [updated] = await db
    .update(packages)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(packages.id, packageId))
    .returning();
  if (!updated) throw ApiError.notFound('الباقة غير موجودة');
  return updated;
}

export async function listThemesAdmin() {
  return db.query.notebookThemes.findMany();
}

export async function updateTheme(slug: string, input: Partial<{ active: boolean; nameAr: string; nameEn: string }>) {
  const [updated] = await db
    .update(notebookThemes)
    .set(input)
    .where(eq(notebookThemes.slug, slug))
    .returning();
  if (!updated) throw ApiError.notFound('التصميم غير موجود');
  return updated;
}

export async function listCoverTemplatesAdmin() {
  return db.query.coverTemplates.findMany();
}

export async function updateCoverTemplate(
  id: string,
  input: Partial<{ active: boolean; sortOrder: number; nameAr: string; nameEn: string }>,
) {
  const [updated] = await db
    .update(coverTemplates)
    .set(input)
    .where(eq(coverTemplates.id, id))
    .returning();
  if (!updated) throw ApiError.notFound('القالب غير موجود');
  return updated;
}

export async function getSettings() {
  return db.query.platformSettings.findMany();
}

export async function upsertSetting(key: string, value: unknown) {
  const [row] = await db
    .insert(platformSettings)
    .values({ key, value: value as object })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value: value as object, updatedAt: new Date() } })
    .returning();
  return row;
}
