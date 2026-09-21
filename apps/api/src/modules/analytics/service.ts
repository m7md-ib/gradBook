import type { AnalyticsEventType } from '@daftar/shared';
import { db } from '../../db/client.js';
import { analyticsEvents } from '../../db/schema/index.js';

export async function trackEvent(
  notebookId: string,
  type: AnalyticsEventType,
  visitorHash?: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(analyticsEvents).values({ notebookId, type, visitorHash, metadata });
}
