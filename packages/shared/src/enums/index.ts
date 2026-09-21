/**
 * Central enum-like unions shared by the API and the web client.
 * Plain `as const` objects are used instead of TS `enum` so they erase
 * cleanly, serialize as plain strings over the wire, and work well with zod.
 */

export const UserRole = {
  GRADUATE: 'graduate',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const NotebookType = {
  INDIVIDUAL: 'individual',
  CLASS: 'class',
} as const;
export type NotebookType = (typeof NotebookType)[keyof typeof NotebookType];

export const NotebookVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  INVITE_ONLY: 'invite_only',
} as const;
export type NotebookVisibility = (typeof NotebookVisibility)[keyof typeof NotebookVisibility];

export const NotebookStatus = {
  DRAFT: 'draft',
  PENDING_PAYMENT: 'pending_payment',
  ACTIVE: 'active',
  EXPIRED: 'expired',
} as const;
export type NotebookStatus = (typeof NotebookStatus)[keyof typeof NotebookStatus];

export const MessageApprovalMode = {
  AUTO: 'auto',
  MANUAL: 'manual',
} as const;
export type MessageApprovalMode = (typeof MessageApprovalMode)[keyof typeof MessageApprovalMode];

export const MessageStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export const RelationshipType = {
  FRIEND: 'friend',
  FAMILY: 'family',
  CLASSMATE: 'classmate',
  TEACHER: 'teacher',
  COLLEAGUE: 'colleague',
  OTHER: 'other',
} as const;
export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export const PackageTier = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  CLASS: 'class',
} as const;
export type PackageTier = (typeof PackageTier)[keyof typeof PackageTier];

export const NotebookDuration = {
  ONE_MONTH: '1_month',
  THREE_MONTHS: '3_months',
  ONE_YEAR: '1_year',
  LIFETIME: 'lifetime',
} as const;
export type NotebookDuration = (typeof NotebookDuration)[keyof typeof NotebookDuration];

export const OrderStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentProviderId = {
  MOCK: 'mock',
  STRIPE: 'stripe',
} as const;
export type PaymentProviderId = (typeof PaymentProviderId)[keyof typeof PaymentProviderId];

export const ThemeCategory = {
  ELEGANT: 'elegant',
  LUXURY: 'luxury',
  MINIMAL: 'minimal',
  FLORAL: 'floral',
  ACADEMIC: 'academic',
  MODERN: 'modern',
  DARK: 'dark',
  TRADITIONAL: 'traditional',
  UNIVERSITY: 'university',
  FEMININE: 'feminine',
  MASCULINE: 'masculine',
  ARABIC_TYPOGRAPHY: 'arabic_typography',
  YOUTH: 'youth',
} as const;
export type ThemeCategory = (typeof ThemeCategory)[keyof typeof ThemeCategory];

export const CoverSourceType = {
  TEMPLATE: 'template',
  CUSTOM: 'custom',
} as const;
export type CoverSourceType = (typeof CoverSourceType)[keyof typeof CoverSourceType];

export const TimelineItemType = {
  FIRST_DAY: 'first_day',
  FIRST_SEMESTER: 'first_semester',
  FAVORITE_MEMORY: 'favorite_memory',
  GRADUATION_PROJECT: 'graduation_project',
  FINAL_EXAM: 'final_exam',
  GRADUATION_DAY: 'graduation_day',
  CUSTOM: 'custom',
} as const;
export type TimelineItemType = (typeof TimelineItemType)[keyof typeof TimelineItemType];

export const ReportTargetType = {
  MESSAGE: 'message',
  GALLERY_ITEM: 'gallery_item',
  USER: 'user',
} as const;
export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType];

export const ReportStatus = {
  OPEN: 'open',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
  ACTIONED: 'actioned',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ModerationActionType = {
  APPROVE: 'approve',
  HIDE: 'hide',
  DELETE: 'delete',
  FEATURE: 'feature',
  UNFEATURE: 'unfeature',
  BLOCK_USER: 'block_user',
  WARN_USER: 'warn_user',
  DISMISS_REPORT: 'dismiss_report',
} as const;
export type ModerationActionType = (typeof ModerationActionType)[keyof typeof ModerationActionType];

export const NotificationType = {
  NEW_MESSAGE: 'new_message',
  MESSAGE_REPORTED: 'message_reported',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  NOTEBOOK_ACTIVATED: 'notebook_activated',
  NOTEBOOK_EXPIRING_SOON: 'notebook_expiring_soon',
  NOTEBOOK_EXPIRED: 'notebook_expired',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const AnalyticsEventType = {
  NOTEBOOK_VIEW: 'notebook_view',
  NOTEBOOK_OPEN: 'notebook_open',
  WRITE_START: 'write_start',
  MESSAGE_SUBMIT: 'message_submit',
  QR_SCAN: 'qr_scan',
  SHARE_CLICK: 'share_click',
} as const;
export type AnalyticsEventType = (typeof AnalyticsEventType)[keyof typeof AnalyticsEventType];

export const Locale = {
  AR: 'ar',
  EN: 'en',
} as const;
export type Locale = (typeof Locale)[keyof typeof Locale];

export const StorageProviderId = {
  LOCAL: 'local',
  S3: 's3',
  R2: 'r2',
  SUPABASE: 'supabase',
} as const;
export type StorageProviderId = (typeof StorageProviderId)[keyof typeof StorageProviderId];
