import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users } from './schema/identity.js';
import { notebooks } from './schema/notebooks.js';
import { seedDemoNotebook } from './seed.js';

const DEMO_EMAIL = 'demo@daftar.app';
const DEMO_SLUG = 'sara-2026';

/**
 * Self-healing check, safe to run on every boot (chained into render.yaml's
 * startCommand): if the demo notebook is missing or stuck mid-creation
 * (status != 'active' — e.g. a storage upload failed partway through
 * seedDemoNotebook, which earlier happened after a TLS failure), clean up
 * any partial demo user/notebook and reseed it fresh. Otherwise it's a
 * no-op (one indexed SELECT) — it must NOT unconditionally delete+recreate
 * the demo notebook on every boot, or a transient storage hiccup during
 * the rebuild (most likely right after a cold start) leaves it broken
 * until the next restart gambles on the rebuild succeeding again.
 */
async function main() {
  const notebook = await db.query.notebooks.findFirst({ where: eq(notebooks.slug, DEMO_SLUG) });
  if (notebook && notebook.status === 'active') {
    console.log('ℹ️  Demo notebook healthy, nothing to do');
    await pool.end();
    return;
  }

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
  if (existingUser) {
    await db.delete(users).where(eq(users.id, existingUser.id));
    console.log('✅ Removed stuck demo user + cascaded notebook/content');
  }

  await seedDemoNotebook();
  await pool.end();
}

main().catch((error) => {
  console.error('❌ fix-demo-notebook failed', error);
  process.exit(1);
});
