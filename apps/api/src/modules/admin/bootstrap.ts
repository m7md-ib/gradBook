import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { passwordSchema } from '@daftar/shared';
import { db } from '../../db/client.js';
import { refreshTokens, users } from '../../db/schema/index.js';
import { hashPassword, verifyPassword } from '../../auth/password.js';

/** Seeded demo admin whose password is published in the README — never usable in production. */
const DEMO_ADMIN_EMAIL = 'admin@daftar.app';

export interface EnsureAdminsOptions {
  /** Who should be admin (from the ADMIN_EMAIL env var, comma-separated). */
  emails: string[];
  /** Optional ADMIN_PASSWORD: creates a missing admin account, or resets an existing one to it. */
  password?: string;
}

export interface EnsureAdminsResult {
  created: string[];
  promoted: string[];
  passwordSet: string[];
  missing: string[];
  demoted: string[];
  demoAdminBlocked: boolean;
  passwordRejected: boolean;
}

export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

const byEmail = (email: string) => eq(sql`lower(${users.email})`, email);

/**
 * Makes the admin list match configuration, with no addresses in the code:
 * every account in `emails` becomes an unblocked admin (created when missing
 * and a password is given), and every other admin is demoted to a regular
 * user — but only once at least one configured admin exists, so a typo in
 * ADMIN_EMAIL can never leave the platform without an admin. Idempotent; run
 * on every boot from db/promote-owner-admin.ts.
 */
export async function ensureAdmins({ emails, password }: EnsureAdminsOptions): Promise<EnsureAdminsResult> {
  const result: EnsureAdminsResult = {
    created: [],
    promoted: [],
    passwordSet: [],
    missing: [],
    demoted: [],
    demoAdminBlocked: false,
    passwordRejected: false,
  };

  const blocked = await db
    .update(users)
    .set({ blockedAt: new Date() })
    .where(and(byEmail(DEMO_ADMIN_EMAIL), sql`${users.blockedAt} is null`))
    .returning({ id: users.id });
  result.demoAdminBlocked = blocked.length > 0;

  const wanted = [...new Set(emails.map((e) => e.trim().toLowerCase()))].filter((e) => e !== DEMO_ADMIN_EMAIL);
  if (wanted.length === 0) return result;

  let usablePassword: string | undefined;
  if (password) {
    if (passwordSchema.safeParse(password).success) usablePassword = password;
    else result.passwordRejected = true;
  }

  for (const email of wanted) {
    const existing = await db.query.users.findFirst({ where: byEmail(email) });

    if (!existing) {
      if (!usablePassword) {
        result.missing.push(email);
        continue;
      }
      await db.insert(users).values({
        fullName: 'مدير المنصة',
        email,
        passwordHash: await hashPassword(usablePassword),
        role: 'admin',
        locale: 'ar',
      });
      result.created.push(email);
      continue;
    }

    if (existing.role !== 'admin' || existing.blockedAt) {
      await db.update(users).set({ role: 'admin', blockedAt: null, updatedAt: new Date() }).where(eq(users.id, existing.id));
      result.promoted.push(email);
    }

    // Only when it differs: comparing first keeps every cold start from
    // rewriting the hash and signing the admin out.
    if (usablePassword && !(await verifyPassword(usablePassword, existing.passwordHash))) {
      await db
        .update(users)
        .set({ passwordHash: await hashPassword(usablePassword), updatedAt: new Date() })
        .where(eq(users.id, existing.id));
      await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.userId, existing.id));
      result.passwordSet.push(email);
    }
  }

  const present = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(sql`lower(${users.email})`, wanted), eq(users.role, 'admin')));
  if (present.length > 0) {
    const demoted = await db
      .update(users)
      .set({ role: 'graduate', updatedAt: new Date() })
      .where(and(eq(users.role, 'admin'), notInArray(sql`lower(${users.email})`, wanted)))
      .returning({ id: users.id, email: users.email });
    if (demoted.length > 0) {
      // Sign them out so the lost role takes effect right away.
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(inArray(refreshTokens.userId, demoted.map((u) => u.id)));
    }
    result.demoted = demoted.map((u) => u.email);
  }

  return result;
}
