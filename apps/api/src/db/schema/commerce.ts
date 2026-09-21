import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from './_helpers.js';
import { orderStatusEnum, paymentProviderEnum, paymentStatusEnum } from './enums.js';
import { users } from './identity.js';
import { notebooks } from './notebooks.js';
import { packages } from './catalog.js';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id),
    status: orderStatusEnum('status').notNull().default('pending'),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('SAR'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('orders_user_idx').on(table.userId),
    index('orders_notebook_idx').on(table.notebookId),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: paymentProviderEnum('provider').notNull().default('mock'),
    providerReference: text('provider_reference'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('SAR'),
    rawPayload: jsonb('raw_payload'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('payments_order_idx').on(table.orderId)],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [index('subscriptions_notebook_idx').on(table.notebookId)],
);

export type OrderRow = typeof orders.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
