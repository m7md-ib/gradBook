import { and, eq } from 'drizzle-orm';
import { slugify, type GraduateInfoInput, type UpdateGraduateInput } from '@daftar/shared';
import { db } from '../../db/client.js';
import { graduates, notebooks } from '../../db/schema/index.js';
import { ApiError } from '../../lib/errors.js';
import { getNotebookForOwner } from './service.js';

const MAX_CLASS_GRADUATES = 200;

async function uniqueGraduateSlug(notebookId: string, base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.query.graduates.findFirst({
      where: and(eq(graduates.notebookId, notebookId), eq(graduates.slug, candidate)),
    });
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }
}

export async function listGraduates(notebookId: string) {
  return db.query.graduates.findMany({
    where: eq(graduates.notebookId, notebookId),
    orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.createdAt)],
  });
}

export async function addGraduate(notebookId: string, userId: string, input: GraduateInfoInput) {
  const notebook = await getNotebookForOwner(notebookId, userId);
  if (notebook.type !== 'class') {
    throw ApiError.badRequest('إضافة أكثر من متخرج متاحة فقط في الدفاتر الجماعية');
  }

  const currentCount = (await listGraduates(notebookId)).length;
  if (currentCount >= MAX_CLASS_GRADUATES) {
    throw ApiError.badRequest('تم الوصول للحد الأقصى لعدد المتخرجين في هذا الدفتر');
  }

  const slug = await uniqueGraduateSlug(notebookId, input.fullName);
  const [graduate] = await db
    .insert(graduates)
    .values({
      notebookId,
      fullName: input.fullName,
      institution: input.institution,
      major: input.major,
      graduationYear: input.graduationYear,
      graduationDate: input.graduationDate,
      // Set only through the photo upload endpoint, never from client input.
      profilePhotoKey: null,
      shortMessage: input.shortMessage,
      slug,
      sortOrder: currentCount,
    })
    .returning();

  return graduate;
}

export async function updateGraduate(
  notebookId: string,
  graduateId: string,
  userId: string,
  input: UpdateGraduateInput,
) {
  const notebook = await getNotebookForOwner(notebookId, userId);
  const existing = await db.query.graduates.findFirst({
    where: and(eq(graduates.id, graduateId), eq(graduates.notebookId, notebookId)),
  });
  if (!existing) throw ApiError.notFound('هذا المتخرج غير موجود في الدفتر');

  const [updated] = await db
    .update(graduates)
    .set({
      fullName: input.fullName ?? existing.fullName,
      institution: input.institution ?? existing.institution,
      major: input.major ?? existing.major,
      graduationYear: input.graduationYear ?? existing.graduationYear,
      // undefined = leave as is, null = clear
      graduationDate: input.graduationDate === undefined ? existing.graduationDate : input.graduationDate,
      shortMessage: input.shortMessage === undefined ? existing.shortMessage : input.shortMessage,
      updatedAt: new Date(),
    })
    .where(eq(graduates.id, graduateId))
    .returning();

  // An individual notebook's title is its graduate's name (set at creation and
  // used in share text), so keep it in step when the name is corrected.
  if (notebook.type === 'individual' && input.fullName && input.fullName !== existing.fullName) {
    await db.update(notebooks).set({ title: input.fullName, updatedAt: new Date() }).where(eq(notebooks.id, notebookId));
  }

  return updated;
}

export async function setGraduatePhoto(
  notebookId: string,
  graduateId: string,
  userId: string,
  profilePhotoKey: string,
) {
  await getNotebookForOwner(notebookId, userId);
  const [updated] = await db
    .update(graduates)
    .set({ profilePhotoKey, updatedAt: new Date() })
    .where(and(eq(graduates.id, graduateId), eq(graduates.notebookId, notebookId)))
    .returning();
  if (!updated) throw ApiError.notFound();
  return updated;
}

export async function removeGraduate(notebookId: string, graduateId: string, userId: string) {
  const notebook = await getNotebookForOwner(notebookId, userId);
  const remaining = await listGraduates(notebookId);
  if (notebook.type === 'individual' || remaining.length <= 1) {
    throw ApiError.badRequest('لا يمكن حذف المتخرج الوحيد في الدفتر');
  }
  await db.delete(graduates).where(and(eq(graduates.id, graduateId), eq(graduates.notebookId, notebookId)));
}
