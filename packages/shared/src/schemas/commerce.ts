import { z } from 'zod';
import { OrderStatus, PaymentStatus, PaymentProviderId, PackageTier } from '../enums/index.js';

export const packageSchema = z.object({
  id: z.string().uuid(),
  tier: z.nativeEnum(PackageTier),
  slug: z.string(),
  nameAr: z.string(),
  nameEn: z.string(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string(),
  duration: z.string(),
  maxGraduates: z.number().int(),
  maxMessages: z.number().int().nullable(),
  maxGalleryItems: z.number().int().nullable(),
  features: z.array(z.string()),
  active: z.boolean(),
  sortOrder: z.number().int(),
});
export type PackageDto = z.infer<typeof packageSchema>;

export const createOrderSchema = z.object({
  notebookId: z.string().uuid(),
  packageId: z.string().uuid(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderSchema = z.object({
  id: z.string().uuid(),
  notebookId: z.string().uuid(),
  packageId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  amountCents: z.number().int(),
  currency: z.string(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const checkoutSessionSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.nativeEnum(PaymentProviderId),
  redirectUrl: z.string().url(),
  clientSecret: z.string().optional(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const paymentWebhookVerifySchema = z.object({
  orderId: z.string().uuid(),
  providerReference: z.string().min(1),
});

export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  provider: z.nativeEnum(PaymentProviderId),
  status: z.nativeEnum(PaymentStatus),
  providerReference: z.string().nullable(),
  amountCents: z.number().int(),
  currency: z.string(),
  createdAt: z.string(),
});
export type Payment = z.infer<typeof paymentSchema>;
