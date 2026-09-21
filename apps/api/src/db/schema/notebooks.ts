import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_helpers.js';
import {
  coverSourceTypeEnum,
  messageApprovalModeEnum,
  notebookDurationEnum,
  notebookStatusEnum,
  notebookTypeEnum,
  notebookVisibilityEnum,
} from './enums.js';
import { users } from './identity.js';
import { notebookThemes } from './catalog.js';

export interface CoverElements {
  showName: boolean;
  showMajor: boolean;
  showInstitution: boolean;
  showGraduationYear: boolean;
  showGraduationDate: boolean;
  showQuote: boolean;
}

export interface CoverCrop {
  x: number;
  y: number;
  zoom: number;
}

export const notebooks = pgTable(
  'notebooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notebookTypeEnum('type').notNull().default('individual'),
    status: notebookStatusEnum('status').notNull().default('draft'),
    slug: text('slug').notNull().unique(),
    title: text('title'),
    themeSlug: text('theme_slug')
      .notNull()
      .references(() => notebookThemes.slug),

    coverSourceType: coverSourceTypeEnum('cover_source_type').notNull().default('template'),
    coverTemplateSlug: text('cover_template_slug'),
    coverImageKey: text('cover_image_key'),
    coverCrop: jsonb('cover_crop').$type<CoverCrop>(),
    coverOverlayOpacity: numeric('cover_overlay_opacity', { precision: 3, scale: 2 })
      .notNull()
      .default('0.35'),
    coverQuote: text('cover_quote'),
    coverElements: jsonb('cover_elements').$type<CoverElements>().notNull().default({
      showName: true,
      showMajor: true,
      showInstitution: true,
      showGraduationYear: true,
      showGraduationDate: false,
      showQuote: true,
    }),

    visibility: notebookVisibilityEnum('visibility').notNull().default('public'),
    accessCode: text('access_code'),
    approvalMode: messageApprovalModeEnum('approval_mode').notNull().default('manual'),
    allowPhotos: boolean('allow_photos').notNull().default(true),
    allowGallery: boolean('allow_gallery').notNull().default(true),
    musicEnabled: boolean('music_enabled').notNull().default(false),
    musicTrackId: text('music_track_id'),

    welcomeMessage: text('welcome_message'),
    showProfilePhoto: boolean('show_profile_photo').notNull().default(true),

    packageTier: text('package_tier'),
    duration: notebookDurationEnum('duration'),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    viewCount: integer('view_count').notNull().default(0),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('notebooks_owner_idx').on(table.ownerUserId),
    index('notebooks_status_idx').on(table.status),
  ],
);

export const graduates = pgTable(
  'graduates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    institution: text('institution').notNull(),
    major: text('major').notNull(),
    graduationYear: integer('graduation_year').notNull(),
    graduationDate: text('graduation_date'),
    profilePhotoKey: text('profile_photo_key'),
    shortMessage: text('short_message'),
    slug: text('slug').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('graduates_notebook_idx').on(table.notebookId),
    unique('graduates_notebook_slug_unique').on(table.notebookId, table.slug),
  ],
);

export const notebookPages = pgTable(
  'notebook_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    pageNumber: integer('page_number').notNull(),
    createdAt: createdAt(),
  },
  (table) => [unique('notebook_pages_notebook_number_unique').on(table.notebookId, table.pageNumber)],
);

export type Notebook = typeof notebooks.$inferSelect;
export type NewNotebook = typeof notebooks.$inferInsert;
export type Graduate = typeof graduates.$inferSelect;
export type NewGraduate = typeof graduates.$inferInsert;
export type NotebookPage = typeof notebookPages.$inferSelect;
