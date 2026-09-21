import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_helpers.js';
import { moderationActionTypeEnum, reportStatusEnum, reportTargetTypeEnum } from './enums.js';
import { notebooks } from './notebooks.js';
import { users } from './identity.js';

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    targetType: reportTargetTypeEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason').notNull(),
    reporterIpHash: text('reporter_ip_hash'),
    status: reportStatusEnum('status').notNull().default('open'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('reports_notebook_idx').on(table.notebookId),
    index('reports_status_idx').on(table.status),
  ],
);

export const moderationActions = pgTable(
  'moderation_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actionType: moderationActionTypeEnum('action_type').notNull(),
    targetType: text('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason'),
    createdAt: createdAt(),
  },
  (table) => [index('moderation_actions_notebook_idx').on(table.notebookId)],
);

export type ReportRow = typeof reports.$inferSelect;
export type ModerationActionRow = typeof moderationActions.$inferSelect;
