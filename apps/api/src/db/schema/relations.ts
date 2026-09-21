import { relations } from 'drizzle-orm';
import { users } from './identity.js';
import { notebooks, graduates, notebookPages } from './notebooks.js';
import { messages, messageMedia, galleryItems, timelineItems, featuredMemories } from './content.js';
import { orders, payments, subscriptions } from './commerce.js';
import { qrCodes, analyticsEvents } from './growth.js';
import { reports, moderationActions } from './moderation.js';
import { notifications } from './platform.js';
import { packages } from './catalog.js';

export const usersRelations = relations(users, ({ many }) => ({
  notebooks: many(notebooks),
  orders: many(orders),
  notifications: many(notifications),
}));

export const notebooksRelations = relations(notebooks, ({ one, many }) => ({
  owner: one(users, { fields: [notebooks.ownerUserId], references: [users.id] }),
  graduates: many(graduates),
  pages: many(notebookPages),
  messages: many(messages),
  galleryItems: many(galleryItems),
  timelineItems: many(timelineItems),
  featuredMemories: many(featuredMemories),
  orders: many(orders),
  qrCode: one(qrCodes, { fields: [notebooks.id], references: [qrCodes.notebookId] }),
  subscriptions: many(subscriptions),
  reports: many(reports),
  moderationActions: many(moderationActions),
  analyticsEvents: many(analyticsEvents),
}));

export const graduatesRelations = relations(graduates, ({ one, many }) => ({
  notebook: one(notebooks, { fields: [graduates.notebookId], references: [notebooks.id] }),
  targetedMessages: many(messages),
}));

export const notebookPagesRelations = relations(notebookPages, ({ one, many }) => ({
  notebook: one(notebooks, { fields: [notebookPages.notebookId], references: [notebooks.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  notebook: one(notebooks, { fields: [messages.notebookId], references: [notebooks.id] }),
  targetGraduate: one(graduates, {
    fields: [messages.targetGraduateId],
    references: [graduates.id],
  }),
  page: one(notebookPages, { fields: [messages.pageId], references: [notebookPages.id] }),
  media: many(messageMedia),
}));

export const messageMediaRelations = relations(messageMedia, ({ one }) => ({
  message: one(messages, { fields: [messageMedia.messageId], references: [messages.id] }),
}));

export const galleryItemsRelations = relations(galleryItems, ({ one }) => ({
  notebook: one(notebooks, { fields: [galleryItems.notebookId], references: [notebooks.id] }),
}));

export const timelineItemsRelations = relations(timelineItems, ({ one }) => ({
  notebook: one(notebooks, { fields: [timelineItems.notebookId], references: [notebooks.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  notebook: one(notebooks, { fields: [orders.notebookId], references: [notebooks.id] }),
  package: one(packages, { fields: [orders.packageId], references: [packages.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  notebook: one(notebooks, { fields: [subscriptions.notebookId], references: [notebooks.id] }),
  order: one(orders, { fields: [subscriptions.orderId], references: [orders.id] }),
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  notebook: one(notebooks, { fields: [qrCodes.notebookId], references: [notebooks.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
