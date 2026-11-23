import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import ar from './src/i18n/locales/ar.json';
import { CONTACT_WHATSAPP } from './src/lib/contact';
import { HOME_META, allSeoPages, homeJsonLd, seoPageJsonLd } from './src/seo/pages';
import { homeStaticHtml, seoPageStaticHtml } from './src/seo/staticHtml';

/**
 * After `vite build`: gives every public page its own HTML file with its
 * title, description, canonical URL, schema.org data and full text, so search
 * engines index real content instead of an empty app shell. Also writes
 * sitemap.xml and robots.txt.
 *
 *   dist/index.html            the home page
 *   dist/<page>.html           each search page (served at /<page>, cleanUrls)
 *   dist/app.html              the bare app shell every other route uses
 */
export function prerenderSeo(siteUrl: string): Plugin {
  let outDir = 'dist';
  return {
    name: 'daftar-prerender-seo',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const templatePath = path.join(outDir, 'index.html');
      if (!fs.existsSync(templatePath)) return;
      const template = fs.readFileSync(templatePath, 'utf8');
      const year = new Date().getFullYear();

      fs.writeFileSync(path.join(outDir, 'app.html'), template);

      const write = (route: string, html: string) => {
        const file = route === '/' ? path.join(outDir, 'index.html') : path.join(outDir, `${route.slice(1)}.html`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, html);
      };

      write(
        '/',
        withPage(template, {
          title: HOME_META.title,
          description: HOME_META.description,
          url: `${siteUrl}/`,
          jsonLd: homeJsonLd(siteUrl, ar.landing.faq, `+${CONTACT_WHATSAPP}`),
          body: homeStaticHtml(ar.landing),
        }),
      );

      const pages = allSeoPages(year);
      for (const page of pages) {
        write(
          page.path,
          withPage(template, {
            title: page.title,
            description: page.description,
            url: siteUrl + page.path,
            jsonLd: seoPageJsonLd(page, siteUrl),
            body: seoPageStaticHtml(page),
          }),
        );
      }

      const today = new Date().toISOString().slice(0, 10);
      const urls = [
        { loc: '/', priority: '1.0' },
        ...pages.map((p) => ({ loc: p.path, priority: p.kind === 'university' ? '0.6' : '0.8' })),
        { loc: '/terms', priority: '0.2' },
        { loc: '/privacy', priority: '0.2' },
      ];
      fs.writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${siteUrl}${u.loc === '/' ? '/' : u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`)
          .join('\n')}\n</urlset>\n`,
      );
      fs.writeFileSync(
        path.join(outDir, 'robots.txt'),
        [
          'User-agent: *',
          'Allow: /',
          'Disallow: /dashboard',
          'Disallow: /admin',
          'Disallow: /checkout',
          'Disallow: /create',
          'Disallow: /api/',
          '',
          `Sitemap: ${siteUrl}/sitemap.xml`,
          '',
        ].join('\n'),
      );
    },
  };
}

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function withPage(
  template: string,
  page: { title: string; description: string; url: string; jsonLd: object[]; body: string },
): string {
  const title = esc(page.title);
  const description = esc(page.description);
  const head = [
    `<link rel="canonical" href="${esc(page.url)}" data-prerender />`,
    `<meta property="og:url" content="${esc(page.url)}" data-prerender />`,
    `<meta property="og:locale" content="ar_JO" />`,
    ...page.jsonLd.map((data) => `<script type="application/ld+json" data-prerender>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ');

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+data-prerender\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta\s+property="og:title"\s+data-prerender\s+content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+property="og:description"\s+data-prerender\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
}
