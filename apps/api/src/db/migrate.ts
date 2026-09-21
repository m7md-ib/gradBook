import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.js';

async function main() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations applied');
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Migration failed', error);
  process.exit(1);
});
