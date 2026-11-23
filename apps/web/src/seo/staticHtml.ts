import { FOOTER_LINKS, SITE_NAME, type SeoFaq, type SeoPageModel } from './pages';

/*
 * Plain HTML versions of the public pages, written into the built files so
 * search engines read the full text without running JavaScript. It's the same
 * content the React page shows (built from the same data); React replaces it
 * as soon as the app starts. Runs in Node at build time — no browser APIs.
 */

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const link = (path: string, label: string, className = 'text-maroon-700 underline') =>
  `<a href="${esc(path)}" class="${className}">${esc(label)}</a>`;

function faqHtml(faq: SeoFaq[], title = 'أسئلة شائعة'): string {
  if (faq.length === 0) return '';
  return `<section class="mt-10"><h2 class="font-heading-auto text-2xl font-bold text-ink">${esc(title)}</h2>${faq
    .map((f) => `<div class="mt-4"><h3 class="font-semibold text-ink">${esc(f.q)}</h3><p class="mt-1 text-ink/70">${esc(f.a)}</p></div>`)
    .join('')}</section>`;
}

function footerHtml(): string {
  return `<footer class="mt-16 border-t border-ink/10 py-8 text-center text-sm text-ink/60"><nav class="flex flex-wrap justify-center gap-4">${[
    { path: '/', label: SITE_NAME },
    ...FOOTER_LINKS,
    { path: '/terms', label: 'الشروط والأحكام' },
    { path: '/privacy', label: 'سياسة الخصوصية' },
  ]
    .map((l) => link(l.path, l.label, 'hover:underline'))
    .join('')}</nav></footer>`;
}

const shell = (inner: string) =>
  `<div class="min-h-screen bg-paper"><header class="bg-night-800 px-4 py-4"><a href="/" class="font-heading-auto text-2xl font-bold text-gold-200">📖 ${SITE_NAME}</a></header><main class="mx-auto max-w-3xl px-4 py-10 leading-relaxed text-ink">${inner}${footerHtml()}</main></div>`;

export function seoPageStaticHtml(page: SeoPageModel): string {
  const crumbs = page.breadcrumbs
    .map((b, i) => (i === page.breadcrumbs.length - 1 ? esc(b.label) : link(b.path, b.label, 'hover:underline')))
    .join(' › ');
  const sections = page.sections
    .map((s) => {
      let body = '';
      if (s.body) body += `<p class="mt-2 text-ink/75">${esc(s.body)}</p>`;
      if (s.steps) body += `<ol class="mt-3 list-decimal space-y-1 ps-6 text-ink/75">${s.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
      if (s.bullets) body += `<ul class="mt-3 list-disc space-y-1 ps-6 text-ink/75">${s.bullets.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      return `<section class="mt-8"><h2 class="font-heading-auto text-2xl font-bold text-ink">${esc(s.heading)}</h2>${body}</section>`;
    })
    .join('');
  const universities = page.universities
    ? `<ul class="mt-6 grid gap-2 sm:grid-cols-2">${page.universities
        .map((u) => `<li>${link(u.path, `دفتر تخرج ${u.label}`)} <span class="text-ink/50">— ${esc(u.city)}</span></li>`)
        .join('')}</ul>`
    : '';
  const related = page.related.length
    ? `<section class="mt-10"><h2 class="font-heading-auto text-xl font-bold text-ink">مواضيع قريبة</h2><ul class="mt-3 flex flex-wrap gap-3">${page.related
        .map((r) => `<li>${link(r.path, r.label)}</li>`)
        .join('')}</ul></section>`
    : '';
  return shell(
    `<nav class="text-sm text-ink/50">${crumbs}</nav><h1 class="mt-4 font-heading-auto text-4xl font-bold text-ink">${esc(page.h1)}</h1><p class="mt-4 text-lg text-ink/70">${esc(page.lead)}</p><p class="mt-6">${link('/signup', 'اعمل دفترك الآن', 'inline-block rounded-2xl bg-maroon-600 px-6 py-3 font-semibold text-white')}</p>${universities}${sections}${faqHtml(page.faq)}${related}`,
  );
}

interface LandingStrings {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  sectionHowTitle: string;
  sectionHowSubtitle: string;
  sectionFeaturesTitle: string;
  faqTitle: string;
  faq: SeoFaq[];
  paymentNote: string;
  [key: string]: unknown;
}

export function homeStaticHtml(l: LandingStrings): string {
  const steps = [1, 2, 3, 4]
    .map((i) => `<li><strong>${esc(String(l[`step${i}Title`]))}</strong> — ${esc(String(l[`step${i}Desc`]))}</li>`)
    .join('');
  const features = ['Notebook', 'Messages', 'Privacy', 'Mobile']
    .map((k) => `<li><strong>${esc(String(l[`feature${k}Title`]))}</strong> — ${esc(String(l[`feature${k}Desc`]))}</li>`)
    .join('');
  const topics = FOOTER_LINKS.map((t) => `<li>${link(t.path, t.label)}</li>`).join('');
  return shell(
    `<h1 class="font-heading-auto text-4xl font-bold text-ink">${esc(l.heroTitle)}</h1><p class="mt-4 text-lg text-ink/70">${esc(l.heroSubtitle)}</p><p class="mt-6">${link('/signup', l.ctaPrimary, 'inline-block rounded-2xl bg-maroon-600 px-6 py-3 font-semibold text-white')}</p>` +
      `<section class="mt-10"><h2 class="font-heading-auto text-2xl font-bold">${esc(l.sectionHowTitle)}</h2><p class="mt-1 text-ink/60">${esc(l.sectionHowSubtitle)}</p><ol class="mt-3 list-decimal space-y-1 ps-6 text-ink/75">${steps}</ol></section>` +
      `<section class="mt-10"><h2 class="font-heading-auto text-2xl font-bold">${esc(l.sectionFeaturesTitle)}</h2><ul class="mt-3 list-disc space-y-1 ps-6 text-ink/75">${features}</ul><p class="mt-4 text-ink/60">${esc(l.paymentNote)}</p></section>` +
      faqHtml(l.faq, l.faqTitle) +
      `<section class="mt-10"><h2 class="font-heading-auto text-xl font-bold">دفتر تخرج لكل مناسبة</h2><ul class="mt-3 flex flex-wrap gap-3">${topics}</ul></section>`,
  );
}
