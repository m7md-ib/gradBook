import { boolean, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_helpers.js';
import { mediaKindEnum, messageStatusEnum, relationshipTypeEnum, timelineItemTypeEnum } from './enums.js';
import { notebooks, graduates, notebookPages } from './notebooks.js';

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    targetGraduateId: uuid('target_graduate_id').references(() => graduates.id, {
      onDelete: 'cascade',
    }),
    authorName: text('author_name').notNull(),
    body: text('body').notNull(),
    relationship: relationshipTypeEnum('relationship').notNull().default('friend'),
    reaction: text('reaction'),
    status: messageStatusEnum('status').notNull().default('pending'),
    featured: boolean('featured').notNull().default(false),
    pageId: uuid('page_id').references(() => notebookPages.id, { onDelete: 'set null' }),
    pageNumber: integer('page_number'),
    submitterIpHash: text('submitter_ip_hash'),
    submitterFingerprint: text('submitter_fingerprint'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('messages_notebook_idx').on(table.notebookId),
    index('messages_notebook_status_idx').on(table.notebookId, table.status),
    index('messages_target_graduate_idx').on(table.targetGraduateId),
  ],
);

export const messageMedia = pgTable(
  'message_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    kind: mediaKindEnum('kind').notNull().default('photo'),
    fileKey: text('file_key').notNull(),
    durationSeconds: integer('duration_seconds'),
    createdAt: createdAt(),
  },
  (table) => [index('message_media_message_idx').on(table.messageId)],
);

export const featuredMemories = pgTable(
  'featured_memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
    galleryItemId: uuid('gallery_item_id'),
    displayStyle: text('display_style').notNull().default('default'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index('featured_memories_notebook_idx').on(table.notebookId)],
);

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    imageKey: text('image_key').notNull(),
    caption: text('caption'),
    submittedByName: text('submitted_by_name'),
    approved: boolean('approved').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index('gallery_items_notebook_idx').on(table.notebookId)],
);

export const timelineItems = pgTable(
  'timeline_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    type: timelineItemTypeEnum('type').notNull().default('custom'),
    title: text('title').notNull(),
    description: text('description'),
    date: text('date'),
    imageKey: text('image_key'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index('timeline_items_notebook_idx').on(table.notebookId)],
);

export type MessageRow = typeof messages.$inferSelect;
export type NewMessageRow = typeof messages.$inferInsert;
export type GalleryItemRow = typeof galleryItems.$inferSelect;
export type TimelineItemRow = typeof timelineItems.$inferSelect;
