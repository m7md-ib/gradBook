import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(72)
  .regex(/[a-zA-Z]/, 'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل')
  .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل');

export const signupSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: passwordSchema,
  locale: z.enum(['ar', 'en']).default('ar'),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  role: z.enum(['graduate', 'admin']),
  locale: z.enum(['ar', 'en']),
  createdAt: z.string(),
});
export type AuthUser = z.infer<typeof authUserSchema>;
