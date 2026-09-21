import { sql } from 'drizzle-orm';
import { db, pool } from './client.js';

/** Development helper: drops and recreates the public schema. Never exposed via the API. */
async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset the database in production');
  }
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  console.log('✅ Database schema reset');
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Reset failed', error);
  process.exit(1);
});
