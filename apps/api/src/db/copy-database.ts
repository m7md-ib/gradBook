import type { Pool, PoolClient } from 'pg';

/**
 * One-off move of every row from an old database into a freshly migrated one
 * (e.g. Render's free Postgres, which expires, into Supabase). Used on boot
 * when OLD_DATABASE_URL is set — see db/promote-owner-admin.ts.
 *
 * Only ever writes into a target with no accounts: a database that's live
 * can't be overwritten, and the boot after a successful copy is a no-op.
 * Whatever the target holds without accounts is only the catalog and
 * settings the boot seeds; the copy replaces it, in one transaction.
 * The source is only read.
 */

export type CopyOutcome =
  | { copied: true; tables: number; rows: number; users: number; notebooks: number }
  | { copied: false; reason: 'target-has-accounts' | 'source-empty' };

const BATCH_SIZE = 500;

const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;
const table = (name: string) => `public.${ident(name)}`;

async function countRows(client: Pool | PoolClient, name: string): Promise<number> {
  const { rows } = await client.query<{ n: number }>(`select count(*)::int as n from ${table(name)}`);
  return rows[0].n;
}

async function publicTables(client: Pool | PoolClient): Promise<string[]> {
  const { rows } = await client.query<{ name: string }>(
    `select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') order by 1`,
  );
  return rows.map((r) => r.name);
}

/** Writable columns per table (generated columns can't be inserted into). */
async function columnsByTable(client: Pool | PoolClient): Promise<Map<string, string[]>> {
  const { rows } = await client.query<{ table_name: string; column_name: string }>(
    `select table_name, column_name from information_schema.columns
     where table_schema = 'public' and is_generated = 'NEVER' order by table_name, ordinal_position`,
  );
  const result = new Map<string, string[]>();
  for (const r of rows) result.set(r.table_name, [...(result.get(r.table_name) ?? []), r.column_name]);
  return result;
}

async function foreignKeys(client: Pool | PoolClient): Promise<Array<[child: string, parent: string]>> {
  const { rows } = await client.query<{ child: string; parent: string }>(
    `select cc.relname as child, pc.relname as parent from pg_constraint k
     join pg_class cc on cc.oid = k.conrelid join pg_class pc on pc.oid = k.confrelid
     join pg_namespace n on n.oid = cc.relnamespace
     where k.contype = 'f' and n.nspname = 'public'`,
  );
  return rows.map((r) => [r.child, r.parent]);
}

/** Tables ordered so every table comes after the tables its foreign keys point at. */
export function insertionOrder(tables: string[], edges: Array<[child: string, parent: string]>): string[] {
  const parents = new Map(tables.map((t) => [t, new Set<string>()]));
  for (const [child, parent] of edges) {
    // A table referencing itself is fine: foreign keys are checked at the end of each insert.
    if (child !== parent && parents.has(child) && parents.has(parent)) parents.get(child)!.add(parent);
  }
  const ordered: string[] = [];
  const done = new Set<string>();
  while (ordered.length < tables.length) {
    const ready = tables.filter((t) => !done.has(t) && [...parents.get(t)!].every((p) => done.has(p)));
    // A cycle between tables (none today) would stall; append the rest and let the insert report it.
    const next = ready.length > 0 ? ready : tables.filter((t) => !done.has(t));
    for (const t of next) {
      ordered.push(t);
      done.add(t);
    }
  }
  return ordered;
}

export async function copyDatabase(source: Pool, target: Pool): Promise<CopyOutcome> {
  if ((await countRows(target, 'users')) > 0) return { copied: false, reason: 'target-has-accounts' };
  const users = await countRows(source, 'users');
  if (users === 0) return { copied: false, reason: 'source-empty' };
  const notebooks = await countRows(source, 'notebooks');

  const targetTables = await publicTables(target);
  const sourceColumns = await columnsByTable(source);
  const targetColumns = await columnsByTable(target);
  const order = insertionOrder(targetTables, await foreignKeys(target));

  const client = await target.connect();
  let copiedRows = 0;
  let copiedTables = 0;
  try {
    await client.query('begin');
    await client.query(`truncate table ${targetTables.map(table).join(', ')} cascade`);

    for (const name of order) {
      const fromColumns = new Set(sourceColumns.get(name) ?? []);
      // Columns the source doesn't have (an older schema) take their defaults.
      const columns = (targetColumns.get(name) ?? []).filter((c) => fromColumns.has(c));
      if (columns.length === 0) continue;

      const list = columns.map(ident).join(', ');
      const { rows } = await source.query<{ row: string }>(
        `select row_to_json(t)::text as row from (select ${list} from ${table(name)}) t`,
      );
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = `[${rows.slice(i, i + BATCH_SIZE).map((r) => r.row).join(',')}]`;
        // json_populate_recordset turns each JSON row back into the table's own
        // types (enums, jsonb, arrays, timestamps) exactly as they were stored.
        await client.query(
          `insert into ${table(name)} (${list}) overriding system value
           select ${list} from json_populate_recordset(null::${table(name)}, $1::json)`,
          [batch],
        );
      }
      copiedRows += rows.length;
      copiedTables += 1;
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  return { copied: true, tables: copiedTables, rows: copiedRows, users, notebooks };
}
