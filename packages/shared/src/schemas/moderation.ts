import { z } from 'zod';
import { ReportTargetType, ReportStatus } from '../enums/index.js';

export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().uuid(),
  reason: z.string().min(3).max(300),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const reportSchema = createReportSchema.extend({
  id: z.string().uuid(),
  status: z.nativeEnum(ReportStatus),
  createdAt: z.string(),
});
export type Report = z.infer<typeof reportSchema>;

export const platformSettingsSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type PlatformSetting = z.infer<typeof platformSettingsSchema>;
