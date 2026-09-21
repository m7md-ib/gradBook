import { and, desc, eq, gt, ilike, or, sql } from 'drizzle-orm';
import type { CreateMessageInput, MessageQuery, PaginationQuery } from '@daftar/shared';
import { paginate } from '@daftar/shared';
import { db } from '../../db/client.js';
import { messages, messageMedia, moderationActions } from '../../db/schema/index.js';
import type { Notebook } from '../../db/schema/notebooks.js';
import { sanitizePlainText } from '../../lib/sanitize.js';
import { containsProfanity } from '../../lib/profanity.js';
import { ApiError } from '../../lib/errors.js';
import { assignPageNumber } from './pagination.js';

export interface SubmitterMeta {
  ipHash: string;
  fingerprint: string;
}

const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export async function createMessage(notebook: Notebook, input: CreateMessageInput, meta: SubmitterMeta) {
  const authorName = sanitizePlainText(input.authorName);
  const body = sanitizePlainText(input.body);

  if (!body) throw ApiError.badRequest('لا يمكن إرسال رسالة فارغة');

  const recentDuplicate = await db.query.messages.findFirst({
    where: and(
      eq(messages.notebookId, notebook.id),
      eq(messages.submitterFingerprint, meta.fingerprint),
      eq(messages.body, body),
      gt(messages.createdAt, new Date(Date.now() - DUPLICATE_WINDOW_MS)),
    ),
  });
  if (recentDuplicate) {
    throw ApiError.conflict('تم إرسال هذه الرسالة بالفعل قبل قليل');
  }

  const flaggedByProfanity = containsProfanity(body) || containsProfanity(authorName);
  const status = notebook.approvalMode === 'auto' && !flaggedByProfanity ? 'approved' : 'pending';
  const photoUrl = notebook.allowPhotos ? (input.photoUrl ?? null) : null;

  const result = await db.transaction(async (tx) => {
    const [message] = await tx
      .insert(messages)
      .values({
        notebookId: notebook.id,
        targetGraduateId: input.targetGraduateId,
        authorName,
        body,
        relationship: input.relationship,
        reaction: input.reaction,
        status,
        submitterIpHash: meta.ipHash,
        submitterFingerprint: meta.fingerprint,
      })
      .returning();

    if (!message) throw ApiError.internal();

    if (status === 'approved') {
      await assignPageNumber(tx as unknown as typeof db, notebook.id, message.id);
    }

    return message;
  });

  if (photoUrl) {
    await db.insert(messageMedia).values({ messageId: result.id, kind: 'photo', fileKey: photoUrl });
  }

  return result;
}

export async function listPublicApproved(
  notebookId: string,
  pagination: PaginationQuery,
  targetGraduateId?: string,
) {
  const conditions = [eq(messages.notebookId, notebookId), eq(messages.status, 'approved')];
  if (targetGraduateId) conditions.push(eq(messages.targetGraduateId, targetGraduateId));

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(messages).where(where);

  const items = await db.query.messages.findMany({
    where,
    with: { media: true },
    orderBy: [messages.pageNumber],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });

  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function listForOwner(notebookId: string, query: MessageQuery, pagination: PaginationQuery) {
  const conditions = [eq(messages.notebookId, notebookId)];
  if (query.status) conditions.push(eq(messages.status, query.status));
  if (query.featured !== undefined) conditions.push(eq(messages.featured, query.featured));
  if (query.search) {
    conditions.push(
      or(ilike(messages.authorName, `%${query.search}%`), ilike(messages.body, `%${query.search}%`))!,
    );
  }

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(messages).where(where);

  const items = await db.query.messages.findMany({
    where,
    with: { media: true },
    orderBy: [desc(messages.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
  });

  return paginate(items, pagination.page, pagination.pageSize, Number(total));
}

export async function moderateMessage(
  notebookId: string,
  messageId: string,
  actorUserId: string,
  status: 'approved' | 'hidden' | 'deleted',
) {
  const message = await db.query.messages.findFirst({
    where: and(eq(messages.id, messageId), eq(messages.notebookId, notebookId)),
  });
  if (!message) throw ApiError.notFound('الرسالة غير موجودة');

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(messages)
      .set({ status, updatedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();

    if (status === 'approved' && message.pageNumber === null) {
      await assignPageNumber(tx as unknown as typeof db, notebookId, messageId);
    }

    await tx.insert(moderationActions).values({
      notebookId,
      actorUserId,
      actionType: status === 'approved' ? 'approve' : status === 'hidden' ? 'hide' : 'delete',
      targetType: 'message',
      targetId: messageId,
    });

    return row;
  });

  return updated;
}

export async function setFeatured(notebookId: string, messageId: string, actorUserId: string, featured: boolean) {
  const [message] = await db
    .update(messages)
    .set({ featured, updatedAt: new Date() })
    .where(and(eq(messages.id, messageId), eq(messages.notebookId, notebookId)))
    .returning();

  if (!message) throw ApiError.notFound('الرسالة غير موجودة');

  await db.insert(moderationActions).values({
    notebookId,
    actorUserId,
    actionType: featured ? 'feature' : 'unfeature',
    targetType: 'message',
    targetId: messageId,
  });

  return message;
}

export async function countApprovedMessages(notebookId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.notebookId, notebookId), eq(messages.status, 'approved')));
  return Number(total);
}
