import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_helpers.js';
import { notificationTypeEnum } from './enums.js';
import { users } from './identity.js';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    readAt: timestamp('read_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: createdAt(),
  },
  (table) => [index('notifications_user_idx').on(table.userId)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata'),
    createdAt: createdAt(),
  },
  (table) => [index('audit_logs_entity_idx').on(table.entityType, table.entityId)],
);

export const platformSettings = pgTable('platform_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: updatedAt(),
});

export type NotificationRow = typeof notifications.$inferSelect;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type PlatformSettingRow = typeof platformSettings.$inferSelect;
