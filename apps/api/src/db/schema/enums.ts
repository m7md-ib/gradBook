import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['graduate', 'admin']);
export const localeEnum = pgEnum('locale', ['ar', 'en']);

export const notebookTypeEnum = pgEnum('notebook_type', ['individual', 'class']);
export const notebookStatusEnum = pgEnum('notebook_status', [
  'draft',
  'pending_payment',
  'active',
  'expired',
]);
export const notebookVisibilityEnum = pgEnum('notebook_visibility', [
  'public',
  'private',
  'invite_only',
]);
export const coverSourceTypeEnum = pgEnum('cover_source_type', ['template', 'custom']);
export const messageApprovalModeEnum = pgEnum('message_approval_mode', ['auto', 'manual']);
export const notebookDurationEnum = pgEnum('notebook_duration', [
  '1_month',
  '3_months',
  '1_year',
  'lifetime',
]);

export const themeCategoryEnum = pgEnum('theme_category', [
  'elegant',
  'luxury',
  'minimal',
  'floral',
  'academic',
  'modern',
  'dark',
  'traditional',
  'university',
  'feminine',
  'masculine',
  'arabic_typography',
  'youth',
]);

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'friend',
  'family',
  'classmate',
  'teacher',
  'colleague',
  'other',
]);
export const messageStatusEnum = pgEnum('message_status', [
  'pending',
  'approved',
  'hidden',
  'deleted',
]);
export const mediaKindEnum = pgEnum('media_kind', ['photo', 'voice']);

export const timelineItemTypeEnum = pgEnum('timeline_item_type', [
  'first_day',
  'first_semester',
  'favorite_memory',
  'graduation_project',
  'final_exam',
  'graduation_day',
  'custom',
]);

export const packageTierEnum = pgEnum('package_tier', ['basic', 'premium', 'class']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
]);
export const paymentProviderEnum = pgEnum('payment_provider', ['mock', 'stripe']);

export const analyticsEventTypeEnum = pgEnum('analytics_event_type', [
  'notebook_view',
  'notebook_open',
  'write_start',
  'message_submit',
  'qr_scan',
  'share_click',
]);

export const reportTargetTypeEnum = pgEnum('report_target_type', [
  'message',
  'gallery_item',
  'user',
]);
export const reportStatusEnum = pgEnum('report_status', [
  'open',
  'reviewed',
  'dismissed',
  'actioned',
]);
export const moderationActionTypeEnum = pgEnum('moderation_action_type', [
  'approve',
  'hide',
  'delete',
  'feature',
  'unfeature',
  'block_user',
  'warn_user',
  'dismiss_report',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'new_message',
  'message_reported',
  'payment_succeeded',
  'payment_failed',
  'notebook_activated',
  'notebook_expiring_soon',
  'notebook_expired',
]);
