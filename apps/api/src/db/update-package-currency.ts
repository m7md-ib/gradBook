import { sql } from 'drizzle-orm';
import { db, pool } from './client.js';

/**
 * One-off: the packages table was seeded with currency='SAR' before pricing
 * switched to JOD. New seeds already insert 'JOD' (see
 * packages/shared/src/constants/index.ts); this updates the rows already
 * sitting in the database. Safe to run more than once (a no-op once nothing
 * matches SAR anymore).
 */
async function main() {
  await db.execute(sql`UPDATE packages SET currency = 'JOD' WHERE currency = 'SAR'`);
  console.log('✅ Package currency updated to JOD');
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Currency update failed', error);
  process.exit(1);
});
