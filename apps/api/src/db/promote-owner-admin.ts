import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users } from './schema/identity.js';

const OWNER_EMAIL = 'mokabratxd@gmail.com';
const DEMO_ADMIN_EMAIL = 'admin@daftar.app';

/**
 * One-off: promotes the owner's own account (signed up normally through the
 * app, password never shared with anyone) to admin, and blocks the public
 * demo admin account whose password is published in the repo's README.
 * Idempotent and never fails the boot — if either account doesn't exist yet
 * (e.g. the owner hasn't signed up), it just logs and moves on.
 */
async function main() {
  const owner = await db.query.users.findFirst({ where: eq(users.email, OWNER_EMAIL) });
  if (owner) {
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, owner.id));
    console.log(`✅ ${OWNER_EMAIL} promoted to admin`);
  } else {
    console.log(`⚠️  ${OWNER_EMAIL} has no account yet — sign up first, then this runs again on next deploy`);
  }

  const demoAdmin = await db.query.users.findFirst({ where: eq(users.email, DEMO_ADMIN_EMAIL) });
  if (demoAdmin && !demoAdmin.blockedAt) {
    await db.update(users).set({ blockedAt: new Date() }).where(eq(users.id, demoAdmin.id));
    console.log(`✅ ${DEMO_ADMIN_EMAIL} (public demo credentials) blocked`);
  } else if (demoAdmin) {
    console.log(`✅ ${DEMO_ADMIN_EMAIL} already blocked`);
  } else {
    console.log(`ℹ️  ${DEMO_ADMIN_EMAIL} does not exist — nothing to block`);
  }

  await pool.end();
}

main().catch((error) => {
  console.error('❌ promote-owner-admin failed', error);
  process.exit(1);
});
