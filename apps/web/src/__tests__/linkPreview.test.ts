import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler, { renderPreviewHtml, type LinkPreview } from '../../api/link-preview';

const PREVIEW: LinkPreview = {
  slug: 'sara-2026',
  type: 'individual',
  name: 'سارة الحربي',
  institution: 'الجامعة الأردنية',
  graduationYear: 2026,
  graduateCount: 1,
  expired: false,
  imageVersion: 123,
};

const ORIGIN = 'https://daftar.example';
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;

function respondWith(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
}

describe('link-preview edge function', () => {
  beforeEach(() => {
    env.VITE_API_URL = 'https://api.example/';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the notebook's name, a versioned preview image and noindex", async () => {
    const fetchMock = respondWith(PREVIEW);
    vi.stubGlobal('fetch', fetchMock);

    const res = await handler(new Request(`${ORIGIN}/api/link-preview?slug=sara-2026`));
    const html = await res.text();

    expect(fetchMock).toHaveBeenCalledWith('https://api.example/api/public/notebooks/sara-2026/preview', expect.anything());
    expect(html).toContain('<meta property="og:title" content="دفتر تخرج سارة الحربي">');
    expect(html).toContain(`<meta property="og:url" content="${ORIGIN}/d/sara-2026">`);
    expect(html).toContain(`content="${ORIGIN}/api/link-preview?slug=sara-2026&amp;image=1&amp;v=123"`);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('falls back to the site card when the API is down or the notebook is expired', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('timeout'); }));
    let html = await (await handler(new Request(`${ORIGIN}/api/link-preview?slug=sara-2026`))).text();
    expect(html).toContain(`content="${ORIGIN}/og-image.jpg"`);

    vi.stubGlobal('fetch', respondWith({ ...PREVIEW, expired: true }));
    html = await (await handler(new Request(`${ORIGIN}/api/link-preview?slug=sara-2026`))).text();
    expect(html).toContain('دفتر — دفتر تخرجك الرقمي');
    expect(html).not.toContain('سارة');
  });

  it('serves the site card for the homepage and never calls the API for a malformed slug', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const home = await (await handler(new Request(`${ORIGIN}/api/link-preview`))).text();
    expect(home).toContain(`<meta property="og:url" content="${ORIGIN}/">`);
    expect(home).not.toContain('noindex');

    await handler(new Request(`${ORIGIN}/api/link-preview?slug=../../etc`));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('proxies the preview image, or redirects to the default image on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([0xff, 0xd8]), { status: 200 })));
    const ok = await handler(new Request(`${ORIGIN}/api/link-preview?slug=sara-2026&image=1&v=1`));
    expect(ok.headers.get('content-type')).toBe('image/jpeg');
    expect(ok.headers.get('cache-control')).toContain('s-maxage');

    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    const fallback = await handler(new Request(`${ORIGIN}/api/link-preview?slug=sara-2026&image=1&v=1`));
    expect(fallback.status).toBe(302);
    expect(fallback.headers.get('location')).toBe(`${ORIGIN}/og-image.jpg`);
  });

  it('escapes names so they cannot inject markup', () => {
    const html = renderPreviewHtml({
      title: '"><script>alert(1)</script>',
      description: 'x',
      url: `${ORIGIN}/d/x`,
      image: `${ORIGIN}/og-image.jpg`,
      noindex: true,
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });
});
