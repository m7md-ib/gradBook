import { z } from 'zod';
import { NotebookType, NotebookVisibility, MessageApprovalMode, CoverSourceType } from '../enums/index.js';

export const notebookSlugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي أحرف إنجليزية صغيرة وأرقام وشرطات فقط');

export const coverElementsToggleSchema = z.object({
  showName: z.boolean().default(true),
  showMajor: z.boolean().default(true),
  showInstitution: z.boolean().default(true),
  showGraduationYear: z.boolean().default(true),
  showGraduationDate: z.boolean().default(false),
  showQuote: z.boolean().default(true),
});
export type CoverElementsToggle = z.infer<typeof coverElementsToggleSchema>;

export const coverCustomizationSchema = z.object({
  sourceType: z.nativeEnum(CoverSourceType),
  templateSlug: z.string().optional(),
  customImageUrl: z.string().url().optional(),
  crop: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number().min(1).max(4),
    })
    .optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.35),
  quote: z.string().max(160).optional(),
  elements: coverElementsToggleSchema,
});
export type CoverCustomizationInput = z.infer<typeof coverCustomizationSchema>;

export const notebookSettingsSchema = z.object({
  visibility: z.nativeEnum(NotebookVisibility).default(NotebookVisibility.PUBLIC),
  accessCode: z.string().min(4).max(40).optional(),
  approvalMode: z.nativeEnum(MessageApprovalMode).default(MessageApprovalMode.MANUAL),
  allowPhotos: z.boolean().default(true),
  allowGallery: z.boolean().default(true),
  musicEnabled: z.boolean().default(false),
  musicTrackId: z.string().optional(),
});
export type NotebookSettingsInput = z.infer<typeof notebookSettingsSchema>;

export const createNotebookSchema = z.object({
  type: z.nativeEnum(NotebookType).default(NotebookType.INDIVIDUAL),
  title: z.string().min(2).max(160).optional(),
  slug: notebookSlugSchema.optional(),
  themeSlug: z.string().min(1),
});
export type CreateNotebookInput = z.infer<typeof createNotebookSchema>;

export const updateNotebookSlugSchema = z.object({
  slug: notebookSlugSchema,
});

export const introPageSchema = z.object({
  welcomeMessage: z.string().max(600).optional(),
  showProfilePhoto: z.boolean().default(true),
});
export type IntroPageInput = z.infer<typeof introPageSchema>;

export const notebookPublicSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  type: z.nativeEnum(NotebookType),
  status: z.string(),
  title: z.string().nullable(),
  themeSlug: z.string(),
  coverImageUrl: z.string().nullable(),
  visibility: z.nativeEnum(NotebookVisibility),
  musicEnabled: z.boolean(),
  graduates: z.array(
    z.object({
      id: z.string().uuid(),
      fullName: z.string(),
      institution: z.string(),
      major: z.string(),
      graduationYear: z.number(),
      profilePhotoUrl: z.string().nullable(),
    }),
  ),
  messageCount: z.number(),
});
export type NotebookPublicSummary = z.infer<typeof notebookPublicSummarySchema>;
