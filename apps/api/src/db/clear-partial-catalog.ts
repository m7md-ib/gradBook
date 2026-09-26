import { sql } from 'drizzle-orm';
import { db, pool } from './client.js';

/**
 * One-off cleanup: a previous db:seed run crashed partway through (a storage
 * config bug, since fixed) after inserting themes/packages but before
 * reaching cover templates or the demo notebook. Clears just those two
 * catalog tables so db:seed can run again from a clean slate without hitting
 * duplicate-key errors. Does not touch users/notebooks — safe to run
 * alongside real signups.
 */
async function main() {
  await db.execute(sql`TRUNCATE TABLE notebook_themes, packages CASCADE`);
  console.log('✅ Partial catalog rows cleared');
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Clear failed', error);
  process.exit(1);
});
