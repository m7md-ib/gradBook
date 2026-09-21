import { NotebookDuration, PackageTier, ThemeCategory } from '../enums/index.js';

/** Maps a notebook duration option to its length in days, or `null` for lifetime. */
export const NOTEBOOK_DURATION_DAYS: Record<NotebookDuration, number | null> = {
  [NotebookDuration.ONE_MONTH]: 30,
  [NotebookDuration.THREE_MONTHS]: 90,
  [NotebookDuration.ONE_YEAR]: 365,
  [NotebookDuration.LIFETIME]: null,
};

export interface PackageDefinition {
  tier: PackageTier;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceCents: number;
  currency: string;
  duration: NotebookDuration;
  maxGraduates: number;
  maxMessages: number | null;
  maxGalleryItems: number | null;
  features: string[];
  sortOrder: number;
}

/** Seed data for the default packages; real prices are configurable in the admin panel. */
export const DEFAULT_PACKAGES: PackageDefinition[] = [
  {
    tier: PackageTier.BASIC,
    slug: 'basic',
    nameAr: 'أساسية',
    nameEn: 'Basic',
    descriptionAr: 'دفترك الشخصي بغلاف مخصص ورابط فريد يستقبل رسائل أحبتك.',
    descriptionEn: 'Your personal notebook with a custom cover and a unique link for messages.',
    priceCents: 4900,
    currency: 'SAR',
    duration: NotebookDuration.ONE_YEAR,
    maxGraduates: 1,
    maxMessages: 150,
    maxGalleryItems: 20,
    features: [
      'custom_cover',
      'personal_notebook',
      'unique_url',
      'visitor_messages',
      'qr_code',
    ],
    sortOrder: 1,
  },
  {
    tier: PackageTier.PREMIUM,
    slug: 'premium',
    nameAr: 'مميزة',
    nameEn: 'Premium',
    descriptionAr: 'كل مزايا الأساسية بالإضافة إلى الموسيقى ومعرض الذكريات والإحصائيات.',
    descriptionEn: 'Everything in Basic plus music, a photo gallery, and detailed statistics.',
    priceCents: 9900,
    currency: 'SAR',
    duration: NotebookDuration.LIFETIME,
    maxGraduates: 1,
    maxMessages: null,
    maxGalleryItems: 100,
    features: [
      'custom_cover',
      'personal_notebook',
      'unique_url',
      'visitor_messages',
      'qr_code',
      'custom_themes',
      'photo_memories',
      'music',
      'advanced_animations',
      'statistics',
    ],
    sortOrder: 2,
  },
  {
    tier: PackageTier.CLASS,
    slug: 'class',
    nameAr: 'الدفعة',
    nameEn: 'Class',
    descriptionAr: 'دفتر جماعي لكامل الدفعة، بصفحات مستقلة لكل متخرج وسعة رسائل كبيرة.',
    descriptionEn: 'A shared notebook for the whole graduating class, with a section per graduate.',
    priceCents: 29900,
    currency: 'SAR',
    duration: NotebookDuration.LIFETIME,
    maxGraduates: 60,
    maxMessages: null,
    maxGalleryItems: 300,
    features: [
      'custom_cover',
      'group_notebook',
      'unique_url',
      'visitor_messages',
      'qr_code',
      'custom_themes',
      'photo_memories',
      'music',
      'advanced_animations',
      'statistics',
      'multiple_graduates',
      'individual_graduate_sections',
    ],
    sortOrder: 3,
  },
];

export interface ThemeDefinition {
  slug: string;
  category: ThemeCategory;
  nameAr: string;
  nameEn: string;
  paperColor: string;
  accentColor: string;
  inkColor: string;
  headingFont: string;
  bodyFont: string;
  coverGradient: [string, string];
}

/** Built-in theme catalog. Additional themes can be added via the admin panel. */
export const DEFAULT_THEMES: ThemeDefinition[] = [
  {
    slug: 'classic-cream',
    category: ThemeCategory.ELEGANT,
    nameAr: 'كلاسيكي',
    nameEn: 'Classic Cream',
    paperColor: '#FBF6EC',
    accentColor: '#B8905A',
    inkColor: '#2B241B',
    headingFont: 'Aref Ruqaa',
    bodyFont: 'Cairo',
    coverGradient: ['#F3E7D3', '#D9C09B'],
  },
  {
    slug: 'modern-minimal',
    category: ThemeCategory.MINIMAL,
    nameAr: 'مودرن',
    nameEn: 'Modern Minimal',
    paperColor: '#FFFFFF',
    accentColor: '#111827',
    inkColor: '#1F2933',
    headingFont: 'Cairo',
    bodyFont: 'Tajawal',
    coverGradient: ['#F3F4F6', '#E5E7EB'],
  },
  {
    slug: 'luxury-noir',
    category: ThemeCategory.LUXURY,
    nameAr: 'فاخر',
    nameEn: 'Luxury Noir',
    paperColor: '#1B1812',
    accentColor: '#D4AF37',
    inkColor: '#F2E9D8',
    headingFont: 'Aref Ruqaa',
    bodyFont: 'Tajawal',
    coverGradient: ['#0E0D0B', '#2B2620'],
  },
  {
    slug: 'floral-bloom',
    category: ThemeCategory.FLORAL,
    nameAr: 'زهور',
    nameEn: 'Floral Bloom',
    paperColor: '#FFF7F8',
    accentColor: '#C9819A',
    inkColor: '#3B2A2E',
    headingFont: 'Aref Ruqaa',
    bodyFont: 'Cairo',
    coverGradient: ['#FBE4E9', '#F3C6D3'],
  },
  {
    slug: 'academic-navy',
    category: ThemeCategory.ACADEMIC,
    nameAr: 'أكاديمي',
    nameEn: 'Academic Navy',
    paperColor: '#F7F7F5',
    accentColor: '#8C1D28',
    inkColor: '#1B2A4A',
    headingFont: 'Cairo',
    bodyFont: 'Tajawal',
    coverGradient: ['#1B2A4A', '#0D1526'],
  },
  {
    slug: 'youth-pop',
    category: ThemeCategory.YOUTH,
    nameAr: 'شبابي',
    nameEn: 'Youth Pop',
    paperColor: '#FFFDF5',
    accentColor: '#FF7A59',
    inkColor: '#2B2B2B',
    headingFont: 'Cairo',
    bodyFont: 'Tajawal',
    coverGradient: ['#FFE29F', '#FFA99F'],
  },
  {
    slug: 'arabic-calligraphy',
    category: ThemeCategory.ARABIC_TYPOGRAPHY,
    nameAr: 'خط عربي',
    nameEn: 'Arabic Calligraphy',
    paperColor: '#FAF3E7',
    accentColor: '#0F5C4C',
    inkColor: '#2B241B',
    headingFont: 'Aref Ruqaa',
    bodyFont: 'Amiri',
    coverGradient: ['#0F5C4C', '#0A3D33'],
  },
];

export const UPLOAD_LIMITS = {
  coverImageMaxMb: 8,
  profilePhotoMaxMb: 4,
  messagePhotoMaxMb: 5,
  galleryPhotoMaxMb: 6,
  allowedImageMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

export const MESSAGE_LIMITS = {
  minLength: 2,
  maxLength: 1200,
  authorNameMaxLength: 80,
};

export const NOTEBOOK_SLUG = {
  minLength: 3,
  maxLength: 60,
  pattern: /^[a-z0-9-]+$/,
};
