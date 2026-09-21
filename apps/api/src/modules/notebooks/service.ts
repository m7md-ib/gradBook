import { eq } from 'drizzle-orm';
import {
  NOTEBOOK_DURATION_DAYS,
  type CoverCustomizationInput,
  type CreateNotebookInput,
  type GraduateInfoInput,
  type IntroPageInput,
  type NotebookDuration,
  type NotebookSettingsInput,
} from '@daftar/shared';
import { generateAccessCode } from '@daftar/shared';
import { db, type Database } from '../../db/client.js';
import { notebooks, graduates, notebookThemes } from '../../db/schema/index.js';
import type { Notebook } from '../../db/schema/notebooks.js';
import type { PackageRow } from '../../db/schema/catalog.js';
import { ApiError } from '../../lib/errors.js';
import { generateUniqueNotebookSlug } from './slug.js';
import { assertNotebookOwner } from './access.js';
import { resolveCoverImageUrl } from './cover-url.js';

export async function createNotebookWithGraduate(
  ownerUserId: string,
  input: CreateNotebookInput,
  graduate: GraduateInfoInput,
) {
  const theme = await db.query.notebookThemes.findFirst({ where: eq(notebookThemes.slug, input.themeSlug) });
  if (!theme) throw ApiError.badRequest('التصميم المختار غير موجود');

  const slug = input.slug
    ? await generateUniqueNotebookSlug(input.slug)
    : await generateUniqueNotebookSlug(`${graduate.fullName}-${graduate.graduationYear}`);

  return db.transaction(async (tx) => {
    const [notebook] = await tx
      .insert(notebooks)
      .values({
        ownerUserId,
        type: input.type,
        status: 'draft',
        slug,
        title: input.title ?? (input.type === 'class' ? `دفعة ${graduate.graduationYear}` : graduate.fullName),
        themeSlug: theme.slug,
      })
      .returning();

    if (!notebook) throw ApiError.internal();

    const [graduateRow] = await tx
      .insert(graduates)
      .values({
        notebookId: notebook.id,
        fullName: graduate.fullName,
        institution: graduate.institution,
        major: graduate.major,
        graduationYear: graduate.graduationYear,
        graduationDate: graduate.graduationDate,
        profilePhotoKey: graduate.profilePhotoUrl,
        shortMessage: graduate.shortMessage,
        slug: 'main',
      })
      .returning();

    return { notebook, graduate: graduateRow! };
  });
}

export async function listMyNotebooks(ownerUserId: string) {
  return db.query.notebooks.findMany({
    where: eq(notebooks.ownerUserId, ownerUserId),
    with: { graduates: true },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
}

export async function getNotebookForOwner(id: string, userId: string, isAdmin = false) {
  const notebook = await db.query.notebooks.findFirst({
    where: eq(notebooks.id, id),
    with: { graduates: true, qrCode: true },
  });
  return assertNotebookOwner(notebook, userId, isAdmin);
}

/** Like {@link getNotebookForOwner}, plus the resolved cover image URL — for the
 *  single "fetch this notebook" read path the dashboard/wizard render from. */
export async function getNotebookForOwnerWithCoverUrl(id: string, userId: string, isAdmin = false) {
  const notebook = await getNotebookForOwner(id, userId, isAdmin);
  const coverImageUrl = await resolveCoverImageUrl(notebook);
  return { ...notebook, coverImageUrl };
}

export async function updateCover(
  notebookId: string,
  userId: string,
  input: CoverCustomizationInput,
) {
  await getNotebookForOwner(notebookId, userId);

  const [updated] = await db
    .update(notebooks)
    .set({
      coverSourceType: input.sourceType,
      coverTemplateSlug: input.templateSlug ?? null,
      coverCrop: input.crop ?? null,
      coverOverlayOpacity: String(input.overlayOpacity),
      coverQuote: input.quote ?? null,
      coverElements: input.elements,
      updatedAt: new Date(),
    })
    .where(eq(notebooks.id, notebookId))
    .returning();

  return updated;
}

export async function setCoverImage(notebookId: string, userId: string, coverImageKey: string) {
  await getNotebookForOwner(notebookId, userId);
  const [updated] = await db
    .update(notebooks)
    .set({ coverImageKey, coverSourceType: 'custom', updatedAt: new Date() })
    .where(eq(notebooks.id, notebookId))
    .returning();
  return updated;
}

export async function updateSettings(notebookId: string, userId: string, input: NotebookSettingsInput) {
  await getNotebookForOwner(notebookId, userId);

  const needsAccessCode = input.visibility !== 'public';
  const accessCode = needsAccessCode ? input.accessCode ?? generateAccessCode() : null;

  const [updated] = await db
    .update(notebooks)
    .set({
      visibility: input.visibility,
      accessCode,
      approvalMode: input.approvalMode,
      allowPhotos: input.allowPhotos,
      allowGallery: input.allowGallery,
      musicEnabled: input.musicEnabled,
      musicTrackId: input.musicTrackId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(notebooks.id, notebookId))
    .returning();

  return updated;
}

export async function updateIntro(notebookId: string, userId: string, input: IntroPageInput) {
  await getNotebookForOwner(notebookId, userId);
  const [updated] = await db
    .update(notebooks)
    .set({
      welcomeMessage: input.welcomeMessage ?? null,
      showProfilePhoto: input.showProfilePhoto,
      updatedAt: new Date(),
    })
    .where(eq(notebooks.id, notebookId))
    .returning();
  return updated;
}

export async function updateSlug(notebookId: string, userId: string, requestedSlug: string) {
  await getNotebookForOwner(notebookId, userId);

  const existing = await db.query.notebooks.findFirst({ where: eq(notebooks.slug, requestedSlug) });
  if (existing && existing.id !== notebookId) {
    throw ApiError.conflict('هذا الرابط مستخدم بالفعل، جرّب رابطاً آخر');
  }

  const [updated] = await db
    .update(notebooks)
    .set({ slug: requestedSlug, updatedAt: new Date() })
    .where(eq(notebooks.id, notebookId))
    .returning();
  return updated;
}

/** Called by the commerce module once a payment is verified server-side. `executor` lets the
 *  caller run this inside its own transaction so notebook activation and the order/payment
 *  rows commit or roll back together. */
export async function activateNotebook(notebookId: string, pkg: PackageRow, executor: Database = db) {
  const durationDays = NOTEBOOK_DURATION_DAYS[pkg.duration as NotebookDuration];
  const now = new Date();
  const expiresAt = durationDays ? new Date(now.getTime() + durationDays * 86_400_000) : null;

  const [updated] = await executor
    .update(notebooks)
    .set({
      status: 'active',
      packageTier: pkg.tier,
      duration: pkg.duration,
      activatedAt: now,
      expiresAt,
      updatedAt: now,
    })
    .where(eq(notebooks.id, notebookId))
    .returning();

  return updated;
}

/** Extends an already-active (or expired) notebook's expiry — used for renewals. */
export async function renewNotebook(notebookId: string, pkg: PackageRow, executor: Database = db) {
  const notebook = await executor.query.notebooks.findFirst({ where: eq(notebooks.id, notebookId) });
  if (!notebook) throw ApiError.notFound();

  const durationDays = NOTEBOOK_DURATION_DAYS[pkg.duration as NotebookDuration];
  const base = notebook.expiresAt && notebook.expiresAt > new Date() ? notebook.expiresAt : new Date();
  const expiresAt = durationDays ? new Date(base.getTime() + durationDays * 86_400_000) : null;

  const [updated] = await executor
    .update(notebooks)
    .set({ status: 'active', expiresAt, updatedAt: new Date() })
    .where(eq(notebooks.id, notebookId))
    .returning();

  return updated;
}

/** Lazily flips an active notebook past its expiry date to `expired`. Data is never deleted.
 *  Generic over `T` so callers that fetched relations (e.g. `with: { graduates: true }`)
 *  don't lose them from the return type. */
export function withExpiryCheck<T extends Notebook>(notebook: T): T {
  if (notebook.status === 'active' && notebook.expiresAt && notebook.expiresAt.getTime() < Date.now()) {
    void db.update(notebooks).set({ status: 'expired' }).where(eq(notebooks.id, notebook.id));
    return { ...notebook, status: 'expired' };
  }
  return notebook;
}
