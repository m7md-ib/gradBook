import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/client.js';
import { users } from '../../src/db/schema/index.js';
import { hashPassword, verifyPassword } from '../../src/auth/password.js';
import { ensureAdmins, parseAdminEmails } from '../../src/modules/admin/bootstrap.js';

// Admin roles are global, so each test works on its own unique addresses and
// asserts only on those rows.
let n = 0;
const unique = (name: string) => `${name}-${Date.now()}-${++n}@example.com`;

async function makeUser(email: string, role: 'admin' | 'graduate' = 'graduate', password = 'OldPass123') {
  const [row] = await db
    .insert(users)
    .values({ fullName: 'اختبار', email, passwordHash: await hashPassword(password), role })
    .returning();
  return row!;
}

const find = (email: string) => db.query.users.findFirst({ where: eq(users.email, email) });

describe('admin bootstrap from ADMIN_EMAIL / ADMIN_PASSWORD', () => {
  it('parses a comma-separated, case-insensitive list and drops junk', () => {
    expect(parseAdminEmails(' Boss@Example.com, , not-an-email ,second@example.com')).toEqual([
      'boss@example.com',
      'second@example.com',
    ]);
    expect(parseAdminEmails(undefined)).toEqual([]);
  });

  it('creates the configured admin when missing, and demotes every other admin', async () => {
    const oldAdmin = await makeUser(unique('old-admin'), 'admin');
    const fresh = unique('new-admin');

    const result = await ensureAdmins({ emails: [fresh.toUpperCase()], password: 'NewAdmin2026' });

    expect(result.created).toEqual([fresh]);
    const created = await find(fresh);
    expect(created?.role).toBe('admin');
    expect(await verifyPassword('NewAdmin2026', created!.passwordHash)).toBe(true);
    expect((await find(oldAdmin.email))?.role).toBe('graduate');
    expect(result.demoted).toContain(oldAdmin.email);
  });

  it('promotes an existing account and only rewrites the password when it differs', async () => {
    const email = unique('existing');
    await makeUser(email, 'graduate', 'OldPass123');

    const first = await ensureAdmins({ emails: [email], password: 'Changed2026' });
    expect(first.promoted).toEqual([email]);
    expect(first.passwordSet).toEqual([email]);

    const second = await ensureAdmins({ emails: [email], password: 'Changed2026' });
    expect(second.promoted).toEqual([]);
    expect(second.passwordSet).toEqual([]);
  });

  it('never demotes anyone when the configured admin does not exist (e.g. a typo)', async () => {
    const keeper = await makeUser(unique('keeper'), 'admin');
    const result = await ensureAdmins({ emails: [unique('typo')] });

    expect(result.missing).toHaveLength(1);
    expect(result.demoted).toEqual([]);
    expect((await find(keeper.email))?.role).toBe('admin');
  });

  it('ignores a weak ADMIN_PASSWORD instead of creating an account with it', async () => {
    const email = unique('weak');
    const result = await ensureAdmins({ emails: [email], password: 'short' });
    expect(result.passwordRejected).toBe(true);
    expect(result.created).toEqual([]);
    expect(await find(email)).toBeUndefined();
  });
});
