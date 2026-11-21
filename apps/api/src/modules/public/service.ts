import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { notebooks } from '../../db/schema/index.js';
import { getStorageProvider } from '../../storage/index.js';
import { withExpiryCheck } from '../notebooks/service.js';
import { resolveCoverImageUrl } from '../notebooks/cover-url.js';
import { countApprovedMessages } from '../messages/service.js';
import { ApiError } from '../../lib/errors.js';
import { renderPreviewCard } from './link-preview-image.js';

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

/**
 * What a link preview (WhatsApp, Telegram, iMessage…) may show for a notebook.
 * Deliberately minimal and side-effect free: no analytics, no access check
 * beyond publication. Private notebooks expose their name (already public on
 * the "expired" screen) but never their cover, which may be a personal photo.
 */
export async function buildLinkPreview(slug: string) {
  const notebook = await findNotebookBySlug(slug);
  const main = notebook.graduates[0];
  // Bumps whenever anything drawn on the preview card changes, so caches
  // (the CDN, messengers) pick up a new cover or a corrected name.
  const imageVersion = Math.max(
    notebook.updatedAt.getTime(),
    ...notebook.graduates.map((g) => g.updatedAt.getTime()),
  );
  return {
    slug: notebook.slug,
    type: notebook.type,
    name: notebook.type === 'class' ? notebook.title ?? main?.fullName ?? '' : main?.fullName ?? notebook.title ?? '',
    institution: main?.institution ?? null,
    graduationYear: main?.graduationYear ?? null,
    graduateCount: notebook.graduates.length,
    expired: notebook.status === 'expired',
    imageVersion,
  };
}

/** The 1200×630 JPEG behind og:image (covers are stored as WebP, which WhatsApp won't preview). */
export async function renderLinkPreviewImage(slug: string): Promise<Buffer> {
  const preview = await buildLinkPreview(slug);
  if (preview.expired) throw ApiError.notFound();
  const notebook = await findNotebookBySlug(slug);

  let cover: Buffer | null = null;
  const coverUrl = notebook.visibility === 'private' ? null : await resolveCoverImageUrl(notebook);
  if (coverUrl) {
    try {
      const response = await fetch(coverUrl, { signal: AbortSignal.timeout(8000) });
      if (response.ok) cover = Buffer.from(await response.arrayBuffer());
    } catch {
      // Fall back to the text-only card rather than failing the preview.
    }
  }

  const subtitle = [preview.institution, preview.graduationYear].filter(Boolean).join(' · ') || null;
  return renderPreviewCard({
    brand: 'دفتر',
    name: preview.name,
    subtitle,
    callToAction: 'افتح الدفتر واكتب رسالتك',
    cover,
  });
}
