import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env, isProduction } from '../config/env.js';
import * as schema from './schema/index.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Managed Postgres providers (Render, Supabase, Neon, ...) terminate with
  // certificates not in Node's default trust store; verifying against them
  // would require distributing each provider's CA, so we encrypt in transit
  // without verifying the chain — standard practice for these providers.
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
