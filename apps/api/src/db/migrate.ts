import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, pool } from './client.js';

// Resolved from this file's own location (apps/api/{src,dist}/db/) rather
// than process.cwd(): a path relative to cwd only happens to work when the
// process is launched from apps/api, which isn't guaranteed by every
// deployment target (e.g. Render runs startCommand from the repo root).
const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');

async function main() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await migrate(db, { migrationsFolder });
  console.log('✅ Migrations applied');
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Migration failed', error);
  process.exit(1);
});
