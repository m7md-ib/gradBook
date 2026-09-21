import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { notebooks } from '../../db/schema/index.js';
import { getStorageProvider } from '../../storage/index.js';
import { withExpiryCheck } from '../notebooks/service.js';
import { resolveCoverImageUrl } from '../notebooks/cover-url.js';
import { countApprovedMessages } from '../messages/service.js';
import { ApiError } from '../../lib/errors.js';

export async function findNotebookBySlug(slug: string) {
  const notebook = await db.query.notebooks.findFirst({
    where: eq(notebooks.slug, slug),
    with: { graduates: true },
  });
  if (!notebook) throw ApiError.notFound('لا يوجد دفتر بهذا الرابط');
  if (notebook.status === 'draft' || notebook.status === 'pending_payment') {
    throw ApiError.notFound('هذا الدفتر غير منشور بعد');
  }
  return withExpiryCheck(notebook);
}

export async function buildPublicSummary(notebook: Awaited<ReturnType<typeof findNotebookBySlug>>) {
  const storage = getStorageProvider();
  const [messageCount, coverImageUrl] = await Promise.all([
    countApprovedMessages(notebook.id),
    resolveCoverImageUrl(notebook),
  ]);

  return {
    id: notebook.id,
    slug: notebook.slug,
    type: notebook.type,
    status: notebook.status,
    title: notebook.title,
    themeSlug: notebook.themeSlug,
    coverImageUrl,
    coverTemplateSlug: notebook.coverTemplateSlug,
    coverQuote: notebook.coverQuote,
    coverElements: notebook.coverElements,
    coverOverlayOpacity: Number(notebook.coverOverlayOpacity),
    visibility: notebook.visibility,
    approvalMode: notebook.approvalMode,
    allowPhotos: notebook.allowPhotos,
    allowGallery: notebook.allowGallery,
    musicEnabled: notebook.musicEnabled,
    musicTrackId: notebook.musicTrackId,
    welcomeMessage: notebook.welcomeMessage,
    showProfilePhoto: notebook.showProfilePhoto,
    expiresAt: notebook.expiresAt,
    graduates: notebook.graduates.map((g) => ({
      id: g.id,
      fullName: g.fullName,
      institution: g.institution,
      major: g.major,
      graduationYear: g.graduationYear,
      graduationDate: g.graduationDate,
      shortMessage: g.shortMessage,
      slug: g.slug,
      profilePhotoUrl: g.profilePhotoKey ? storage.getPublicUrl(g.profilePhotoKey) : null,
    })),
    messageCount,
  };
}
