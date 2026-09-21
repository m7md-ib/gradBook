import { z } from 'zod';
import { TimelineItemType } from '../enums/index.js';

export const createGalleryItemSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(200).optional(),
  submittedByName: z.string().max(80).optional(),
});
export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;

export const galleryItemSchema = createGalleryItemSchema.extend({
  id: z.string().uuid(),
  notebookId: z.string().uuid(),
  approved: z.boolean(),
  createdAt: z.string(),
});
export type GalleryItem = z.infer<typeof galleryItemSchema>;

export const createTimelineItemSchema = z.object({
  type: z.nativeEnum(TimelineItemType),
  title: z.string().min(2).max(160),
  description: z.string().max(600).optional(),
  date: z.string().date().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
});
export type CreateTimelineItemInput = z.infer<typeof createTimelineItemSchema>;

export const timelineItemSchema = createTimelineItemSchema.extend({
  id: z.string().uuid(),
  notebookId: z.string().uuid(),
  createdAt: z.string(),
});
export type TimelineItem = z.infer<typeof timelineItemSchema>;
