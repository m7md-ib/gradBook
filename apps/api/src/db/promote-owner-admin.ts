import { Pool } from 'pg';
import { pool, poolConfig } from './client.js';
import { copyDatabase } from './copy-database.js';
import { ensureCatalog } from './ensure-catalog.js';
import { lockDownDataApi } from './lock-down-data-api.js';
import { ensureAdmins, parseAdminEmails } from '../modules/admin/bootstrap.js';
import { resetAllUserData } from '../modules/admin/reset.js';

/**
 * Runs on every boot (render.yaml startCommand; the file name is kept so the
 * existing start command keeps working), right after the migrations. Moves
 * the data over when switching databases, locks Supabase's Data API out, fills
 * the catalog if the database is brand new (see ensure-catalog.ts), then sets
 * who is admin — from env vars set on the host, never from the repository:
 *
 *   OLD_DATABASE_URL  optional, for a move: copies everything from that
 *                   database into DATABASE_URL while the new one has no
 *                   accounts (see copy-database.ts). Remove it afterwards.
 *   ADMIN_EMAIL     comma-separated admin emails; any other admin is demoted
 *   ADMIN_PASSWORD  optional; creates a missing admin with it, or resets an
 *                   existing admin's password to it. Remove it after signing in.
 *   RESET_ALL_DATA  optional, one-off: "delete-all-users…" wipes every account
 *                   and its data (see modules/admin/reset.ts) before the admin
 *                   step, so the admin is then created fresh. Runs once per value.
 *
 * Also blocks the seeded demo admin (its password is in the README). Never
 * fails the boot.
 */
/** False when the copy failed, so nothing else touches the new database before the retry. */
async function moveFromOldDatabase(url: string): Promise<boolean> {
  const source = new Pool({ ...poolConfig(url), max: 1 });
  try {
    const outcome = await copyDatabase(source, pool);
    if (outcome.copied) {
      console.log(
        `🚚 OLD_DATABASE_URL: copied ${outcome.users} account(s), ${outcome.notebooks} notebook(s) — ${outcome.rows} row(s) in ${outcome.tables} table(s) — remove OLD_DATABASE_URL now`,
      );
    } else if (outcome.reason === 'target-has-accounts') {
      console.log('ℹ️  OLD_DATABASE_URL skipped: the database in DATABASE_URL already has accounts (you can remove OLD_DATABASE_URL)');
    } else {
      console.log('ℹ️  OLD_DATABASE_URL skipped: that database has no accounts to copy');
    }
    return true;
  } catch (error) {
    // The new database is left as it was (the copy is one transaction) and
    // the next boot retries.
    console.error('❌ OLD_DATABASE_URL: copy failed, nothing was changed — check the URL and redeploy', error);
    return false;
  } finally {
    await source.end().catch(() => undefined);
  }
}

async function main() {
  const oldDatabaseUrl = process.env.OLD_DATABASE_URL?.trim();
  if (oldDatabaseUrl && !(await moveFromOldDatabase(oldDatabaseUrl))) {
    // Creating an admin now would make the retry see "accounts already there".
    await pool.end();
    return;
  }

  try {
    const lockdown = await lockDownDataApi(pool);
    if (lockdown.tablesSecured > 0) console.log(`🔒 Supabase Data API locked out of ${lockdown.tablesSecured} table(s)`);
  } catch (error) {
    console.error('❌ could not lock the Supabase Data API out', error);
  }

  await ensureCatalog();

  const resetToken = process.env.RESET_ALL_DATA?.trim();
  if (resetToken) {
    const outcome = await resetAllUserData(resetToken);
    if (outcome.ran) {
      console.log(
        `🧹 RESET_ALL_DATA: deleted ${outcome.users} account(s), ${outcome.notebooks} notebook(s) and ${outcome.filesDeleted} file(s) — remove RESET_ALL_DATA now`,
      );
    } else if (outcome.reason === 'already-done') {
      console.log('ℹ️  RESET_ALL_DATA already applied with this value — skipped (you can remove it)');
    } else {
      console.log('⚠️  RESET_ALL_DATA ignored: its value must start with "delete-all-users"');
    }
  }

  const emails = parseAdminEmails(process.env.ADMIN_EMAIL);
  if (emails.length === 0) {
    console.log('ℹ️  ADMIN_EMAIL is not set — admin roles left unchanged');
  }

  const result = await ensureAdmins({ emails, password: process.env.ADMIN_PASSWORD || undefined });

  if (result.demoAdminBlocked) console.log('✅ demo admin account blocked');
  if (result.passwordRejected) {
    console.log('⚠️  ADMIN_PASSWORD ignored: needs at least 8 characters with a letter and a digit');
  }
  for (const email of result.created) console.log(`✅ admin account created: ${email}`);
  for (const email of result.promoted) console.log(`✅ promoted to admin: ${email}`);
  for (const email of result.passwordSet) {
    console.log(`✅ password set from ADMIN_PASSWORD for ${email} — remove ADMIN_PASSWORD now`);
  }
  for (const email of result.missing) {
    console.log(`⚠️  ${email} has no account — set ADMIN_PASSWORD to create it, or sign up with it`);
  }
  if (result.demoted.length > 0) console.log(`✅ demoted ${result.demoted.length} other admin account(s) to regular users`);

  await pool.end();
}

main().catch(async (error) => {
  // Logged, not fatal: a failure here must not keep the API from starting.
  console.error('❌ admin bootstrap failed', error);
  await pool.end().catch(() => undefined);
});
