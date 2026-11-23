import content from './content.json';

/*
 * Search-landing pages: the data behind both the React pages (SeoPage.tsx)
 * and the static HTML written for crawlers at build time (vite.config.ts →
 * prerender). Keep this file free of browser and Vite-only APIs: it also runs
 * in Node during the build.
 */

export interface SeoSection {
  heading: string;
  body?: string;
  steps?: string[];
  bullets?: string[];
}

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoLink {
  path: string;
  label: string;
}

export interface SeoPageModel {
  path: string;
  kind: 'topic' | 'hub' | 'university';
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: SeoSection[];
  faq: SeoFaq[];
  related: SeoLink[];
  breadcrumbs: SeoLink[];
  /** Hub only: the university pages it lists. */
  universities?: Array<SeoLink & { city: string }>;
}

type Topic = (typeof content.topics)[number];
type University = (typeof content.universities)[number];

export const HOME_META = content.home;
export const SITE_NAME = 'دفتر';

const HOME: SeoLink = { path: '/', label: 'الرئيسية' };
const HUB: SeoLink = { path: '/universities', label: 'الجامعات الأردنية' };

const topicPath = (slug: string) => (slug === content.universitiesHub.slug ? '/universities' : `/${slug}`);
const topicLabel = (slug: string) =>
  slug === content.universitiesHub.slug ? content.universitiesHub.h1 : content.topics.find((t) => t.slug === slug)?.keyword ?? slug;

function topicPage(topic: Topic): SeoPageModel {
  return {
    path: `/${topic.slug}`,
    kind: 'topic',
    title: topic.title,
    description: topic.description,
    h1: topic.h1,
    lead: topic.lead,
    sections: topic.sections as SeoSection[],
    faq: topic.faq,
    related: topic.related.map((slug) => ({ path: topicPath(slug), label: topicLabel(slug) })),
    breadcrumbs: [HOME, { path: `/${topic.slug}`, label: topic.keyword }],
  };
}

function universityPage(u: University, year: number): SeoPageModel {
  const path = `/universities/${u.slug}`;
  return {
    path,
    kind: 'university',
    title: `دفتر تخرج ${u.name} ${year} | ${SITE_NAME}`,
    description: `دفتر تخرج إلكتروني لخريجي ${u.name} في ${u.city}: اجمع رسائل أهلك وأصحابك ودكاترتك بدفتر بتتقلب صفحاته، وشارك رابطه مع دفعة ${year}.`,
    h1: `دفتر تخرج ${u.name}`,
    lead: `${u.note} اعمل دفتر تخرجك الإلكتروني، وخلّي كل اللي رافقوك بـ${u.short} يكتبولك كلمة بتضل معك.`,
    sections: [
      {
        heading: `كيف تعمل دفتر تخرجك من ${u.short}؟`,
        steps: [
          `سجّل واكتب اسمك وتخصصك و«${u.name}» وسنة التخرج ${year}.`,
          'اختار تصميم الغلاف أو ارفع صورتك بروب التخرج.',
          'شارك الرابط على مجموعات الدفعة، واطبع رمز QR لحفلة التخرج.',
          'اقرأ الرسائل أول بأول، ونزّل الدفتر كامل PDF.',
        ],
      },
      {
        heading: `دفتر لدفعتك كاملة بـ${u.short}`,
        body: `إذا إنتو لجنة تخرج أو شعبة بدها ذكرى مشتركة، اعملوا دفتر «دفعة» واحد لكل خريجي التخصص في ${u.name}. كل خريج إله صفحاته، والأهل والأصحاب بيختاروا لمين يكتبوا.`,
      },
      {
        heading: `ليش دفتر إلكتروني لخريجي ${u.city}؟`,
        bullets: [
          'بيوصل للأهل والأصحاب وين ما كانوا، داخل الأردن وبرّاه.',
          'كل رسالة بصفحة لحالها ومع صورة ذكرى إذا حبّوا.',
          'إنت بتتحكم مين بيشوف الدفتر ومين بيكتب فيه.',
          'الدفع سهل عبر CliQ من أي بنك أردني.',
        ],
      },
    ],
    faq: [
      { q: `بقدر أكتب اسم ${u.name} على غلاف الدفتر؟`, a: 'نعم، اسم الجامعة والتخصص وسنة التخرج بيظهروا على الغلاف، وبتقدر تخفي أي واحد منهم.' },
      { q: `بنفع نعمل دفتر لدفعة كاملة من ${u.short}؟`, a: 'أكيد، باقة «الدفعة» بتجمع كل الخريجين بدفتر واحد، ولكل خريج صفحاته.' },
      { q: `كيف بدفع من ${u.city}؟`, a: 'عبر CliQ أو تحويل بنكي من أي بنك بالأردن، ومنفعّل دفترك فور تأكيد التحويل.' },
    ],
    related: [
      { path: '/daftar-takharoj', label: 'دفتر تخرج إلكتروني' },
      { path: '/daftar-dofaa', label: 'دفتر الدفعة' },
      { path: '/hadiyat-takharoj', label: 'هدية تخرج' },
    ],
    breadcrumbs: [HOME, HUB, { path, label: u.name }],
  };
}

function hubPage(): SeoPageModel {
  const hub = content.universitiesHub;
  return {
    path: '/universities',
    kind: 'hub',
    title: hub.title,
    description: hub.description,
    h1: hub.h1,
    lead: hub.lead,
    sections: [],
    faq: [],
    related: content.topics.map((t) => ({ path: `/${t.slug}`, label: t.keyword })),
    breadcrumbs: [HOME, HUB],
    universities: content.universities.map((u) => ({ path: `/universities/${u.slug}`, label: u.name, city: u.city })),
  };
}

export function allSeoPages(year: number): SeoPageModel[] {
  return [...content.topics.map(topicPage), hubPage(), ...content.universities.map((u) => universityPage(u, year))];
}

export function seoPageByPath(path: string, year: number): SeoPageModel | undefined {
  return allSeoPages(year).find((p) => p.path === path);
}

/** Links shown in the footer on every page (internal links help both visitors and crawlers). */
export const FOOTER_LINKS: SeoLink[] = [
  ...content.topics.map((t) => ({ path: `/${t.slug}`, label: t.keyword })),
  HUB,
];

/** schema.org data for a search page: breadcrumbs, the page itself, and its FAQ. */
export function seoPageJsonLd(page: SeoPageModel, siteUrl: string): object[] {
  const url = siteUrl + page.path;
  const items: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.label,
        item: siteUrl + b.path,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      description: page.description,
      url,
      inLanguage: 'ar-JO',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: siteUrl },
    },
  ];
  if (page.faq.length > 0) items.push(faqJsonLd(page.faq));
  return items;
}

export function faqJsonLd(faq: SeoFaq[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** schema.org data for the home page: who we are, the site, and the service in Jordan. */
export function homeJsonLd(siteUrl: string, faq: SeoFaq[], whatsapp: string): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      alternateName: ['Daftar', 'دفتر تخرج'],
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
      contactPoint: { '@type': 'ContactPoint', telephone: whatsapp, contactType: 'customer service', areaServed: 'JO', availableLanguage: ['ar', 'en'] },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      alternateName: 'دفتر تخرج إلكتروني',
      url: siteUrl,
      inLanguage: 'ar-JO',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'دفتر تخرج إلكتروني',
      serviceType: 'دفتر تخرج وذكريات إلكتروني',
      description: HOME_META.description,
      provider: { '@type': 'Organization', name: SITE_NAME, url: siteUrl },
      areaServed: { '@type': 'Country', name: 'الأردن' },
      url: siteUrl,
    },
    faqJsonLd(faq),
  ];
}
