import { z } from 'zod';

export const graduateInfoSchema = z.object({
  fullName: z.string().min(2, 'الاسم الكامل مطلوب').max(120),
  institution: z.string().min(2, 'اسم الجامعة/المدرسة مطلوب').max(160),
  major: z.string().min(2, 'التخصص مطلوب').max(160),
  graduationYear: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  graduationDate: z.string().date().optional(),
  profilePhotoUrl: z.string().url().optional().nullable(),
  shortMessage: z.string().max(400).optional(),
});
export type GraduateInfoInput = z.infer<typeof graduateInfoSchema>;

/** Partial edit; null clears the optional fields (graduation date, short message). */
export const updateGraduateSchema = graduateInfoSchema
  .omit({ profilePhotoUrl: true })
  .partial()
  .extend({
    graduationDate: z.string().date().nullable().optional(),
    shortMessage: z.string().max(400).nullable().optional(),
  });
export type UpdateGraduateInput = z.infer<typeof updateGraduateSchema>;

export const graduateSchema = graduateInfoSchema.extend({
  id: z.string().uuid(),
  notebookId: z.string().uuid(),
  slug: z.string(),
  createdAt: z.string(),
});
export type Graduate = z.infer<typeof graduateSchema>;
