import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import { env, isProduction } from '../config/env.js';
import * as schema from './schema/index.js';

/**
 * Pool settings for a Postgres URL. Managed providers (Render, Supabase,
 * Neon, ...) terminate with certificates not in Node's default trust store;
 * verifying against them would require distributing each provider's CA, so we
 * encrypt in transit without verifying the chain — standard practice for these
 * providers.
 *
 * Any sslmode in the URL is dropped: node-postgres lets the URL override the
 * `ssl` option and treats sslmode=require as full verification, which would
 * reject those certificates (Supabase's connection strings often carry it).
 */
export function poolConfig(url: string): PoolConfig {
  let connectionString = url;
  try {
    const parsed = new URL(url);
    for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) parsed.searchParams.delete(key);
    connectionString = parsed.toString();
  } catch {
    // Not a parseable URL; pass it through unchanged.
  }
  return {
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    // A remote database (e.g. Supabase's pooler) shouldn't leave a request hanging.
    connectionTimeoutMillis: 15_000,
  };
}

export const pool = new Pool(poolConfig(env.DATABASE_URL));

export const db = drizzle(pool, { schema });

export type Database = typeof db;
