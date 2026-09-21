import { boolean, integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_helpers.js';
import { notebookDurationEnum, packageTierEnum, themeCategoryEnum } from './enums.js';

export const notebookThemes = pgTable('notebook_themes', {
  slug: text('slug').primaryKey(),
  category: themeCategoryEnum('category').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  paperColor: text('paper_color').notNull(),
  accentColor: text('accent_color').notNull(),
  inkColor: text('ink_color').notNull(),
  headingFont: text('heading_font').notNull(),
  bodyFont: text('body_font').notNull(),
  coverGradientFrom: text('cover_gradient_from').notNull(),
  coverGradientTo: text('cover_gradient_to').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

export const coverTemplates = pgTable('cover_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  category: themeCategoryEnum('category').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  imageKey: text('image_key').notNull(),
  thumbnailKey: text('thumbnail_key').notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
});

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tier: packageTierEnum('tier').notNull(),
  slug: text('slug').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('SAR'),
  duration: notebookDurationEnum('duration').notNull(),
  maxGraduates: integer('max_graduates').notNull().default(1),
  maxMessages: integer('max_messages'),
  maxGalleryItems: integer('max_gallery_items'),
  features: jsonb('features').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type NotebookTheme = typeof notebookThemes.$inferSelect;
export type CoverTemplate = typeof coverTemplates.$inferSelect;
export type PackageRow = typeof packages.$inferSelect;
