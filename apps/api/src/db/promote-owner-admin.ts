import { pool } from './client.js';
import { ensureCatalog } from './ensure-catalog.js';
import { ensureAdmins, parseAdminEmails } from '../modules/admin/bootstrap.js';
import { resetAllUserData } from '../modules/admin/reset.js';

/**
 * Runs on every boot (render.yaml startCommand; the file name is kept so the
 * existing start command keeps working). First fills the catalog if the
 * database is brand new (see ensure-catalog.ts). Who is admin comes from env
 * vars set on the host, never from the repository:
 *
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
async function main() {
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
