import 'dotenv/config';
import { eq } from 'drizzle-orm';
import {
  DEFAULT_PACKAGES,
  DEFAULT_THEMES,
  ThemeCategory,
} from '@daftar/shared';
import { db, pool } from './client.js';
import {
  notebookThemes,
  packages,
  coverTemplates,
  users,
  notebooks,
  graduates,
  messages,
  notebookPages,
  messageMedia,
  galleryItems,
  timelineItems,
  orders,
  payments,
  subscriptions,
  platformSettings,
} from './schema/index.js';
import { hashPassword } from '../auth/password.js';
import { getStorageProvider } from '../storage/index.js';
import { renderGradientImage } from './seed-assets.js';
import { setCoverImage, activateNotebook } from '../modules/notebooks/service.js';
import { setGraduatePhoto } from '../modules/notebooks/graduates-service.js';
import { regenerateQrCode } from '../modules/notebooks/qr-service.js';

const storage = getStorageProvider();

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  [ThemeCategory.ELEGANT]: ['#E7D3B0', '#B8905A'],
  [ThemeCategory.LUXURY]: ['#2B2620', '#0E0D0B'],
  [ThemeCategory.MINIMAL]: ['#F3F4F6', '#C6CBD3'],
  [ThemeCategory.FLORAL]: ['#F7C9D6', '#C9819A'],
  [ThemeCategory.ACADEMIC]: ['#1B2A4A', '#0D1526'],
  [ThemeCategory.MODERN]: ['#DCE3EA', '#8C97A6'],
  [ThemeCategory.DARK]: ['#232323', '#050505'],
  [ThemeCategory.TRADITIONAL]: ['#7A1F2B', '#3D0F15'],
  [ThemeCategory.UNIVERSITY]: ['#1E3A5F', '#0B1B2E'],
  [ThemeCategory.FEMININE]: ['#F6D5E3', '#E3A9C5'],
  [ThemeCategory.MASCULINE]: ['#3A4750', '#1B2126'],
  [ThemeCategory.ARABIC_TYPOGRAPHY]: ['#0F5C4C', '#0A3D33'],
  [ThemeCategory.YOUTH]: ['#FFE29F', '#FF7A59'],
};

async function seedThemes() {
  for (const theme of DEFAULT_THEMES) {
    await db
      .insert(notebookThemes)
      .values({
        slug: theme.slug,
        category: theme.category,
        nameAr: theme.nameAr,
        nameEn: theme.nameEn,
        paperColor: theme.paperColor,
        accentColor: theme.accentColor,
        inkColor: theme.inkColor,
        headingFont: theme.headingFont,
        bodyFont: theme.bodyFont,
        coverGradientFrom: theme.coverGradient[0],
        coverGradientTo: theme.coverGradient[1],
      })
      .onConflictDoNothing({ target: notebookThemes.slug });
  }
  console.log(`✅ Themes: ${DEFAULT_THEMES.length}`);
}

async function seedPackages() {
  for (const pkg of DEFAULT_PACKAGES) {
    await db
      .insert(packages)
      .values({
        tier: pkg.tier,
        slug: pkg.slug,
        nameAr: pkg.nameAr,
        nameEn: pkg.nameEn,
        descriptionAr: pkg.descriptionAr,
        descriptionEn: pkg.descriptionEn,
        priceCents: pkg.priceCents,
        currency: pkg.currency,
        duration: pkg.duration,
        maxGraduates: pkg.maxGraduates,
        maxMessages: pkg.maxMessages,
        maxGalleryItems: pkg.maxGalleryItems,
        features: pkg.features,
        sortOrder: pkg.sortOrder,
      })
      .onConflictDoNothing({ target: packages.slug });
  }
  console.log(`✅ Packages: ${DEFAULT_PACKAGES.length}`);
}

async function seedCoverTemplates() {
  const categories = Object.values(ThemeCategory);
  for (const [index, category] of categories.entries()) {
    const slug = `template-${category}`;
    const existing = await db.query.coverTemplates.findFirst({ where: eq(coverTemplates.slug, slug) });
    if (existing) continue;

    const [from, to] = CATEGORY_GRADIENTS[category] ?? ['#CCCCCC', '#999999'];
    const full = await renderGradientImage(1200, 1600, from, to);
    const thumb = await renderGradientImage(300, 400, from, to);

    const fullUpload = await storage.upload({
      key: `cover-templates/${slug}.webp`,
      buffer: full,
      contentType: 'image/webp',
    });
    const thumbUpload = await storage.upload({
      key: `cover-templates/${slug}-thumb.webp`,
      buffer: thumb,
      contentType: 'image/webp',
    });

    await db.insert(coverTemplates).values({
      slug,
      category,
      nameAr: categoryNameAr(category),
      nameEn: category.replace(/_/g, ' '),
      imageKey: fullUpload.key,
      thumbnailKey: thumbUpload.key,
      sortOrder: index,
    });
  }
  console.log(`✅ Cover templates: ${categories.length}`);
}

function categoryNameAr(category: string): string {
  const map: Record<string, string> = {
    elegant: 'أنيق',
    luxury: 'فاخر',
    minimal: 'بسيط',
    floral: 'زهور',
    academic: 'أكاديمي',
    modern: 'عصري',
    dark: 'داكن',
    traditional: 'تقليدي',
    university: 'جامعي',
    feminine: 'نسائي',
    masculine: 'رجالي',
    arabic_typography: 'خط عربي',
    youth: 'شبابي',
  };
  return map[category] ?? category;
}

async function seedPlatformSettings() {
  await db
    .insert(platformSettings)
    .values([
      { key: 'site_name', value: { ar: 'دفتر', en: 'Daftar' } },
      { key: 'support_email', value: 'support@daftar.app' },
    ])
    .onConflictDoNothing({ target: platformSettings.key });
}

async function seedDemoNotebook() {
  const existing = await db.query.notebooks.findFirst({ where: eq(notebooks.slug, 'sara-2026') });
  if (existing) {
    console.log('ℹ️  Demo notebook already exists, skipping demo content seeding');
    return;
  }

  const passwordHash = await hashPassword('Daftar2026!');
  const [demoUser] = await db
    .insert(users)
    .values({
      fullName: 'سارة الحربي',
      email: 'demo@daftar.app',
      passwordHash,
      role: 'graduate',
      locale: 'ar',
    })
    .returning();
  if (!demoUser) throw new Error('failed to create demo user');

  const adminPasswordHash = await hashPassword('AdminDaftar2026!');
  await db
    .insert(users)
    .values({
      fullName: 'مدير المنصة',
      email: 'admin@daftar.app',
      passwordHash: adminPasswordHash,
      role: 'admin',
      locale: 'ar',
    })
    .onConflictDoNothing({ target: users.email });

  const [notebook] = await db
    .insert(notebooks)
    .values({
      ownerUserId: demoUser.id,
      type: 'individual',
      status: 'draft',
      slug: 'sara-2026',
      title: 'سارة الحربي',
      themeSlug: 'classic-cream',
      visibility: 'public',
      approvalMode: 'auto',
      welcomeMessage:
        'الحمد لله الذي بنعمته تتم الصالحات، وصلى الله على سيدنا محمد. أربع سنوات من التعب والسهر انتهت اليوم بابتسامة كبيرة. هذا الدفتر يجمع كلمات كل من كان معي في هذه الرحلة. اكتب لي كلمة قبل ما تبدأ صفحة جديدة من حياتي 💛',
      coverQuote: 'Chapter Complete.',
    })
    .returning();
  if (!notebook) throw new Error('failed to create demo notebook');

  const [graduate] = await db
    .insert(graduates)
    .values({
      notebookId: notebook.id,
      fullName: 'سارة الحربي',
      institution: 'جامعة الملك سعود',
      major: 'هندسة البرمجيات',
      graduationYear: 2026,
      graduationDate: '2026-06-15',
      shortMessage: 'أربع سنوات من التعب والسهر انتهت بابتسامة كبيرة اليوم.',
      slug: 'main',
    })
    .returning();
  if (!graduate) throw new Error('failed to create demo graduate');

  // Cover + profile placeholder imagery (abstract gradients, no external assets required).
  const coverBuffer = await renderGradientImage(1200, 1600, '#F3E7D3', '#B8905A');
  const coverUpload = await storage.upload({
    key: `covers/demo-${notebook.id}.webp`,
    buffer: coverBuffer,
    contentType: 'image/webp',
  });
  await setCoverImage(notebook.id, demoUser.id, coverUpload.key);

  const profileBuffer = await renderGradientImage(800, 800, '#FBF6EC', '#D9C09B');
  const profileUpload = await storage.upload({
    key: `profiles/demo-${graduate.id}.webp`,
    buffer: profileBuffer,
    contentType: 'image/webp',
  });
  await setGraduatePhoto(notebook.id, graduate.id, demoUser.id, profileUpload.key);

  const premiumPackage = await db.query.packages.findFirst({ where: eq(packages.slug, 'premium') });
  if (!premiumPackage) throw new Error('premium package missing — seed packages first');
  const activated = await activateNotebook(notebook.id, premiumPackage);

  const [order] = await db
    .insert(orders)
    .values({
      userId: demoUser.id,
      notebookId: notebook.id,
      packageId: premiumPackage.id,
      status: 'paid',
      amountCents: premiumPackage.priceCents,
      currency: premiumPackage.currency,
    })
    .returning();
  if (order) {
    await db.insert(payments).values({
      orderId: order.id,
      provider: 'mock',
      providerReference: 'mock_demo_seed',
      status: 'succeeded',
      amountCents: premiumPackage.priceCents,
      currency: premiumPackage.currency,
    });
    await db.insert(subscriptions).values({
      notebookId: notebook.id,
      orderId: order.id,
      startsAt: new Date(),
      endsAt: activated?.expiresAt ?? null,
    });
  }

  await regenerateQrCode(notebook.id, demoUser.id);

  const demoMessages: Array<{
    authorName: string;
    body: string;
    relationship: 'friend' | 'family' | 'classmate' | 'teacher' | 'colleague' | 'other';
    reaction?: string;
    featured?: boolean;
    withPhoto?: boolean;
  }> = [
    {
      authorName: 'أحمد الغامدي',
      relationship: 'friend',
      body: 'عزيزتي سارة، تذكرين أول يوم دخلنا فيه المدرج الكبير ونحن خايفين ما نلقى مكان؟ اليوم نضحك عليها ونحن نودّع الجامعة. فخور فيك جداً، ومستقبلك أجمل مما تتخيلين.',
      reaction: '🎓',
    },
    {
      authorName: 'أمك',
      relationship: 'family',
      body: 'يا فلذة كبدي سارة، من يوم ولدتك وأنا أحلم بهذا اليوم. كل تعبك انكتب اليوم فرحة ما توصف. الله يوفقك يا قرة عيني.',
      reaction: '❤️',
    },
    {
      authorName: 'نورة العتيبي',
      relationship: 'classmate',
      body: 'يا صاحبتي بالمحاضرات المملة والسهر قبل الاختبارات! ما كنت أتخيل نوصل للحظة هذي سوا. أشكرك على كل مذاكرة ليلية وكل قهوة تحملتيها معي.',
    },
    {
      authorName: 'د. عبدالله المالكي',
      relationship: 'teacher',
      body: 'الطالبة سارة كانت دائماً مثالاً للاجتهاد والتميز في القاعة الدراسية. أتمنى لها مستقبلاً باهراً في مجال هندسة البرمجيات.',
    },
    {
      authorName: 'ريم القحطاني',
      relationship: 'colleague',
      body: 'كان شرفاً لي أن أعمل معك في فريق التدريب الصيفي. أفكارك وحماسك خلّوا العمل ممتع. بالتوفيق في القادم يا بطلة!',
    },
    {
      authorName: 'Lina',
      relationship: 'friend',
      body: 'Sara, watching you grow from our first coding class to graduating with honors has been amazing. Can’t wait to see what you build next.',
      reaction: '✨',
    },
    {
      authorName: 'خالد الحربي',
      relationship: 'family',
      body: 'يا أختي الغالية، أفتخر فيك أكثر مما تتخيلين. من صغرنا وأنتِ قدوتي بالجد والصبر. مبروك التخرج يا نجمة العائلة.',
    },
    {
      authorName: 'جود العنزي',
      relationship: 'friend',
      body: 'أربع سنين مرت وكأنها أربع أيام! من أول واجب برمجة لين مشروع التخرج، فخورة فيك وفي كل خطوة مشيتيها. يلا نحتفل!',
      reaction: '🎉',
    },
    {
      authorName: 'أ. منى الزهراني',
      relationship: 'teacher',
      body: 'أذكر مشروعك في مادة قواعد البيانات، كان من أفضل ما رأيت من طالبات الدفعة. بالتوفيق في مسيرتك المهنية.',
    },
    {
      authorName: 'هند السبيعي',
      relationship: 'classmate',
      body: 'يا سارة، شكراً إنك دايم كنتِ تشرحين لي لين أفهم! ما كنت بوصل بدونك. مبروك ونتمنى نشتغل سوا يوم من الأيام.',
    },
    {
      authorName: 'لجين الدوسري',
      relationship: 'friend',
      featured: true,
      withPhoto: true,
      body: 'أعز صديقاتي، اليوم مو بس تخرج... اليوم بداية فصل جديد من حياتك وأنا متأكدة رح يكون أجمل. حبيتك من أول ثانوي ولين اليوم وبعدها بإذن الله. مبروك يا قمر.',
      reaction: '💛',
    },
    {
      authorName: 'والدك',
      relationship: 'family',
      body: 'ابنتي الغالية، دموع الفرح اليوم أحلى دموع. الله يحفظك ويوفقك في كل خطوة قادمة. أنتِ فخر العائلة.',
    },
  ];

  for (const [index, m] of demoMessages.entries()) {
    const [page] = await db.insert(notebookPages).values({ notebookId: notebook.id, pageNumber: index + 1 }).returning();
    const [message] = await db
      .insert(messages)
      .values({
        notebookId: notebook.id,
        authorName: m.authorName,
        body: m.body,
        relationship: m.relationship,
        reaction: m.reaction,
        status: 'approved',
        featured: m.featured ?? false,
        pageId: page?.id,
        pageNumber: index + 1,
        submitterIpHash: 'seed',
        submitterFingerprint: `seed-${index}`,
      })
      .returning();

    if (m.withPhoto && message) {
      const photoBuffer = await renderGradientImage(1000, 750, '#FFF7F8', '#C9819A');
      const photoUpload = await storage.upload({
        key: `messages/demo-${message.id}.webp`,
        buffer: photoBuffer,
        contentType: 'image/webp',
      });
      await db.insert(messageMedia).values({ messageId: message.id, kind: 'photo', fileKey: photoUpload.key });
    }
  }
  console.log(`✅ Demo messages: ${demoMessages.length}`);

  const galleryCaptions = [
    ['يوم التخرج مع الصديقات', '#F7C9D6', '#C9819A'],
    ['آخر محاضرة في القسم', '#DCE3EA', '#8C97A6'],
    ['احتفال التخرج مع العائلة', '#F3E7D3', '#B8905A'],
    ['توزيع دروع التكريم', '#FFE29F', '#FF7A59'],
    ['لحظة استلام الشهادة', '#E7D3B0', '#B8905A'],
  ] as const;

  for (const [caption, from, to] of galleryCaptions) {
    const buffer = await renderGradientImage(1200, 900, from, to);
    const upload = await storage.upload({
      key: `gallery/demo-${notebook.id}-${caption.length}-${Math.random().toString(36).slice(2, 8)}.webp`,
      buffer,
      contentType: 'image/webp',
    });
    await db.insert(galleryItems).values({
      notebookId: notebook.id,
      imageKey: upload.key,
      caption,
      submittedByName: 'سارة الحربي',
      approved: true,
    });
  }
  console.log(`✅ Gallery items: ${galleryCaptions.length}`);

  const timeline: Array<{
    type: 'first_day' | 'first_semester' | 'favorite_memory' | 'graduation_project' | 'final_exam' | 'graduation_day';
    title: string;
    description: string;
    date: string;
  }> = [
    {
      type: 'first_day',
      title: 'أول يوم في الجامعة',
      description: 'خطوة أولى مليئة بالحماس والتوتر في قاعات جامعة الملك سعود.',
      date: '2022-09-01',
    },
    {
      type: 'first_semester',
      title: 'نهاية الفصل الدراسي الأول',
      description: 'أول اختبارات نهائية، وأول شعور حقيقي بالإنجاز.',
      date: '2023-01-15',
    },
    {
      type: 'favorite_memory',
      title: 'رحلة القسم',
      description: 'من أجمل الذكريات مع زميلات الدفعة خارج قاعات الدراسة.',
      date: '2023-11-10',
    },
    {
      type: 'graduation_project',
      title: 'مشروع التخرج: دفتر',
      description: 'العمل على مشروع التخرج بروح الفريق الواحد لمدة فصل دراسي كامل.',
      date: '2025-12-01',
    },
    {
      type: 'final_exam',
      title: 'آخر اختبار في المشوار الجامعي',
      description: 'لحظة الخروج من آخر قاعة اختبار بشعور لا يوصف.',
      date: '2026-05-20',
    },
    {
      type: 'graduation_day',
      title: 'يوم التخرج',
      description: 'الحفل الرسمي لتخرج دفعة 2026.',
      date: '2026-06-15',
    },
  ];

  for (const [index, item] of timeline.entries()) {
    await db.insert(timelineItems).values({
      notebookId: notebook.id,
      type: item.type,
      title: item.title,
      description: item.description,
      date: item.date,
      sortOrder: index,
    });
  }
  console.log(`✅ Timeline items: ${timeline.length}`);

  console.log('\n──────────────────────────────────────────────');
  console.log('🎓 Demo notebook ready: /d/sara-2026');
  console.log('   Graduate login → demo@daftar.app / Daftar2026!');
  console.log('   Admin login    → admin@daftar.app / AdminDaftar2026!');
  console.log('──────────────────────────────────────────────\n');
}

async function main() {
  await seedThemes();
  await seedPackages();
  await seedCoverTemplates();
  await seedPlatformSettings();
  await seedDemoNotebook();
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Seed failed', error);
  process.exit(1);
});
