import type { Pool } from 'pg';

/**
 * Supabase publishes every table in the public schema through its REST "Data
 * API" to anyone holding the project's anon key, which Supabase treats as
 * public. This API never uses that: it connects as the table owner, which row
 * level security doesn't apply to. So on Supabase, every public table gets RLS
 * with no policies, and the anon/authenticated roles lose their grants —
 * nothing is reachable through the Data API. Runs on every boot (right after
 * the migrations) so tables added later are covered too. A no-op on any other
 * Postgres (no anon role).
 */
export async function lockDownDataApi(pool: Pool): Promise<{ applied: boolean; tablesSecured: number }> {
  const { rows: roles } = await pool.query<{ rolname: string }>(
    `select rolname from pg_roles where rolname in ('anon', 'authenticated')`,
  );
  if (roles.length === 0) return { applied: false, tablesSecured: 0 };

  const { rows: open } = await pool.query<{ name: string }>(
    `select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity`,
  );
  for (const { name } of open) {
    await pool.query(`alter table public."${name.replace(/"/g, '""')}" enable row level security`);
  }

  const grantees = roles.map((r) => r.rolname).join(', ');
  await pool.query(`revoke all on all tables in schema public from ${grantees}`);
  await pool.query(`revoke all on all sequences in schema public from ${grantees}`);
  // Tables the next migrations create start without those grants too.
  await pool
    .query(`alter default privileges in schema public revoke all on tables from ${grantees}`)
    .catch(() => undefined);

  return { applied: true, tablesSecured: open.length };
}
