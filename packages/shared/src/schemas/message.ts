import { z } from 'zod';
import { RelationshipType, MessageStatus } from '../enums/index.js';
import { MESSAGE_LIMITS } from '../constants/index.js';

export const createMessageSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(2, 'الاسم مطلوب')
    .max(MESSAGE_LIMITS.authorNameMaxLength),
  body: z
    .string()
    .trim()
    .min(MESSAGE_LIMITS.minLength, 'الرسالة قصيرة جداً')
    .max(MESSAGE_LIMITS.maxLength, 'الرسالة طويلة جداً'),
  relationship: z.nativeEnum(RelationshipType).default(RelationshipType.FRIEND),
  reaction: z.string().max(8).optional(),
  photoUrl: z.string().url().optional().nullable(),
  targetGraduateId: z.string().uuid().optional(),
  /** Honeypot field: must stay empty. Populated only by bots. */
  website: z.string().max(0).optional().default(''),
});
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const moderateMessageSchema = z.object({
  status: z.nativeEnum(MessageStatus),
});
export type ModerateMessageInput = z.infer<typeof moderateMessageSchema>;

export const featureMessageSchema = z.object({
  featured: z.boolean(),
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  notebookId: z.string().uuid(),
  targetGraduateId: z.string().uuid().nullable(),
  authorName: z.string(),
  body: z.string(),
  relationship: z.nativeEnum(RelationshipType),
  reaction: z.string().nullable(),
  photoUrl: z.string().nullable(),
  status: z.nativeEnum(MessageStatus),
  featured: z.boolean(),
  pageNumber: z.number().int().nullable(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof messageSchema>;

export const messageQuerySchema = z.object({
  status: z.nativeEnum(MessageStatus).optional(),
  search: z.string().max(160).optional(),
  featured: z.coerce.boolean().optional(),
});
export type MessageQuery = z.infer<typeof messageQuerySchema>;
