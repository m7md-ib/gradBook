import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2', 'supabase']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage/uploads'),
  STORAGE_PUBLIC_BASE_URL: z.string().default('http://localhost:4000/uploads'),
  STORAGE_MAX_UPLOAD_MB: z.coerce.number().default(8),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_FORCE_PATH_STYLE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  PAYMENT_PROVIDER: z.enum(['mock', 'stripe', 'manual']).default('mock'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Proxies in front of the API whose X-Forwarded-For entries Express should
  // trust to find the client IP: Vercel (the site proxies /api/* to us) and
  // Render's load balancer. Too low and every visitor shares the proxy's IP,
  // so rate limits and visitor counts lump everyone together.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(2),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_MESSAGES: z.coerce.number().default(5),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().default(10),

  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  EMAIL_FROM: z.string().default('no-reply@daftar.app'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const data = parsed.data;

// The mock provider "succeeds" any payment the moment the buyer clicks Pay,
// so leaving it on in production hands out every package for free. Fall back
// to manual (admin-confirmed) payments instead of refusing to boot, so a
// stale PAYMENT_PROVIDER=mock on the host can't take the whole site down.
if (data.NODE_ENV === 'production' && data.PAYMENT_PROVIDER === 'mock') {
  console.warn('⚠️  PAYMENT_PROVIDER=mock is not allowed in production — using "manual" instead.');
  data.PAYMENT_PROVIDER = 'manual';
}

export const env = data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
