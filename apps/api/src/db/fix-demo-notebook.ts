import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users } from './schema/identity.js';
import { seedDemoNotebook } from './seed.js';

const DEMO_EMAIL = 'demo@daftar.app';

/**
 * One-off recovery: an earlier seed run got interrupted partway through
 * seedDemoNotebook (storage TLS failure, since fixed) after creating the
 * demo user and notebook but before finishing activation/messages/etc.
 * seedDemoNotebook's own idempotency check (skip if the notebook already
 * exists) then permanently protected that half-finished state from ever
 * being completed by a normal seed run — the notebook stayed status='draft'
 * forever, which the public API correctly treats as not-found.
 *
 * Deletes the demo user (cascades to the notebook and everything under it —
 * every notebook-owning FK is onDelete: 'cascade'), then reruns
 * seedDemoNotebook from a clean slate.
 */
async function main() {
  const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
  if (existing) {
    await db.delete(users).where(eq(users.id, existing.id));
    console.log('✅ Removed stuck demo user + cascaded notebook/content');
  }

  await seedDemoNotebook();
  await pool.end();
}

main().catch((error) => {
  console.error('❌ fix-demo-notebook failed', error);
  process.exit(1);
});
