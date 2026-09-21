import { index, integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_helpers.js';
import { analyticsEventTypeEnum } from './enums.js';
import { notebooks } from './notebooks.js';

export const qrCodes = pgTable('qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  notebookId: uuid('notebook_id')
    .notNull()
    .unique()
    .references(() => notebooks.id, { onDelete: 'cascade' }),
  imageKey: text('image_key').notNull(),
  scanCount: integer('scan_count').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    type: analyticsEventTypeEnum('type').notNull(),
    metadata: jsonb('metadata'),
    visitorHash: text('visitor_hash'),
    createdAt: createdAt(),
  },
  (table) => [
    index('analytics_events_notebook_idx').on(table.notebookId),
    index('analytics_events_notebook_type_idx').on(table.notebookId, table.type),
  ],
);

export type QrCodeRow = typeof qrCodes.$inferSelect;
export type AnalyticsEventRow = typeof analyticsEvents.$inferSelect;
