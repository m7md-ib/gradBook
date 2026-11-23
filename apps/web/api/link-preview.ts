/**
 * Link previews for crawlers (WhatsApp, Telegram, iMessage, Facebook, X…).
 *
 * The app is a client-rendered SPA, so its per-notebook <meta> tags are
 * written by JavaScript that link-preview crawlers never run — every shared
 * notebook link used to preview as the generic site title. vercel.json routes
 * crawler user agents (only) here: we return a tiny HTML page carrying the
 * notebook's Open Graph tags, and proxy its preview image through the CDN.
 * Regular visitors never hit this function.
 *
 *   /d/:slug  → /api/link-preview?slug=:slug               (HTML with OG tags)
 *   og:image  → /api/link-preview?slug=:slug&image=1&v=…   (JPEG, CDN-cached)
 *   /         → /api/link-preview                          (site-wide card)
 */
export const config = { runtime: 'edge' };

// Edge runtime exposes project env vars on process.env; declared here because
// the web app doesn't depend on @types/node.
declare const process: { env: Record<string, string | undefined> };

const SITE_NAME = 'دفتر';
const SITE_TITLE = 'دفتر تخرج إلكتروني في الأردن | دفتر — رسائل وذكريات من حبايبك';
const SITE_DESCRIPTION =
  'اعمل دفتر تخرج إلكتروني بتصميم فاخر: شارك الرابط أو رمز QR وخلّي أهلك وأصحابك يكتبولك رسائل وذكريات بصفحات بتتقلب متل الدفتر الحقيقي. أحلى هدية تخرج لطلاب الجامعات في الأردن.';
const DEFAULT_IMAGE_PATH = '/og-image.jpg';
const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;

export interface LinkPreview {
  slug: string;
  type: 'individual' | 'class';
  name: string;
  institution: string | null;
  graduationYear: number | null;
  graduateCount: number;
  expired: boolean;
  imageVersion: number;
}

interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  noindex: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderPreviewHtml(meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const u = escapeHtml(meta.url);
  const i = escapeHtml(meta.image);
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
${meta.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${u}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="ar_AR">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${i}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
</head>
<body>
<h1>${t}</h1>
<p>${d}</p>
<p><a href="${u}">${u}</a></p>
</body>
</html>`;
}

export function notebookMeta(preview: LinkPreview, origin: string): PageMeta {
  const url = `${origin}/d/${preview.slug}`;
  const title = preview.type === 'class' ? `${preview.name} — ${SITE_NAME}` : `دفتر تخرج ${preview.name}`;
  const where = [preview.institution, preview.graduationYear].filter(Boolean).join(' · ');
  const description = `${where ? `${where} — ` : ''}افتح الدفتر واكتب رسالة تبقى ذكرى 📖`;
  return {
    title,
    description,
    url,
    image: `${origin}/api/link-preview?slug=${preview.slug}&image=1&v=${preview.imageVersion}`,
    noindex: true,
  };
}

function siteMeta(origin: string, path = '/', noindex = false): PageMeta {
  return { title: SITE_TITLE, description: SITE_DESCRIPTION, url: `${origin}${path}`, image: `${origin}${DEFAULT_IMAGE_PATH}`, noindex };
}

function apiBase(): string {
  return (process.env.VITE_API_URL ?? '').replace(/\/+$/, '');
}

async function fetchPreview(slug: string): Promise<LinkPreview | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    // Render's free tier sleeps; crawlers won't wait long, so fall back to
    // the site-wide card rather than hang.
    const response = await fetch(`${base}/api/public/notebooks/${slug}/preview`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return (await response.json()) as LinkPreview;
  } catch {
    return null;
  }
}

function html(meta: PageMeta, cacheSeconds: number): Response {
  return new Response(renderPreviewHtml(meta), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    },
  });
}

async function proxyImage(slug: string, origin: string): Promise<Response> {
  const base = apiBase();
  try {
    const response = await fetch(`${base}/api/public/notebooks/${slug}/preview.jpg`, { signal: AbortSignal.timeout(9000) });
    if (response.ok && base) {
      return new Response(response.body, {
        headers: {
          'content-type': 'image/jpeg',
          // The URL carries a version (v=…) that changes with the notebook,
          // so the CDN can keep each version for a long time.
          'cache-control': 'public, max-age=86400, s-maxage=604800, immutable',
        },
      });
    }
  } catch {
    // fall through to the default image
  }
  return Response.redirect(`${origin}${DEFAULT_IMAGE_PATH}`, 302);
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  const slug = url.searchParams.get('slug');

  if (!slug) return html(siteMeta(origin), 3600);
  if (!SLUG_PATTERN.test(slug)) return html(siteMeta(origin), 300);
  if (url.searchParams.has('image')) return proxyImage(slug, origin);

  const preview = await fetchPreview(slug);
  if (!preview || preview.expired) return html(siteMeta(origin, `/d/${slug}`, true), 60);
  return html(notebookMeta(preview, origin), 300);
}
