import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool } from '../../src/db/client.js';
import { env } from '../../src/config/env.js';
import { copyDatabase } from '../../src/db/copy-database.js';
import { lockDownDataApi } from '../../src/db/lock-down-data-api.js';
import { createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';
import { activateNotebookForAgent, createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

const migrationsFolder = path.resolve(__dirname, '../../drizzle');
const suffix = `${process.pid}_${Date.now()}`;

async function freshDatabase(name: string): Promise<Pool> {
  await pool.query(`create database ${name}`);
  const url = new URL(env.DATABASE_URL);
  url.pathname = `/${name}`;
  const created = new Pool({ connectionString: url.toString() });
  await migrate(drizzle(created), { migrationsFolder });
  return created;
}

/** One fingerprint per table: every row as JSON, sorted, hashed. */
async function fingerprint(db: Pool): Promise<Record<string, string>> {
  const { rows: tables } = await db.query<{ name: string }>(
    `select tablename as name from pg_tables where schemaname = 'public' order by 1`,
  );
  const result: Record<string, string> = {};
  for (const { name } of tables) {
    const { rows } = await db.query<{ n: number; hash: string | null }>(
      `select count(*)::int as n, md5(string_agg(r, ',' order by r)) as hash
       from (select row_to_json(t)::text as r from public."${name}" t) x`,
    );
    result[name] = `${rows[0].n}:${rows[0].hash ?? ''}`;
  }
  return result;
}

describe('copying to a new database (OLD_DATABASE_URL)', () => {
  const names = { target: `daftar_copy_target_${suffix}`, empty: `daftar_copy_empty_${suffix}` };
  let target: Pool;
  let empty: Pool;

  beforeAll(async () => {
    await ensureCatalogSeeded();
    // Something in every kind of column: enums, jsonb, timestamps, numerics.
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);
    await activateNotebookForAgent(agent, notebook.id, 'basic');
    await agent.patch(`/api/notebooks/${notebook.id}/cover`).send({
      sourceType: 'template',
      overlayOpacity: 0.55,
      crop: { x: 30, y: 70, zoom: 1.4 },
      style: { nameScale: 1.2, textColor: '#FFE9B0', nameFont: 'ruqaa', align: 'center' },
    });
    const { agent: visitor } = await createAnonymousAgent();
    await visitor
      .post(`/api/public/notebooks/${notebook.slug}/messages`)
      .field('authorName', 'زائر')
      .field('body', 'ألف مبروك 🎓')
      .field('relationship', 'friend')
      .field('website', '');

    target = await freshDatabase(names.target);
    empty = await freshDatabase(names.empty);
  });

  afterAll(async () => {
    await target?.end();
    await empty?.end();
    for (const name of Object.values(names)) await pool.query(`drop database if exists ${name}`);
  });

  it('copies every row unchanged, replacing whatever seed data the new database had', async () => {
    await target.query(`insert into platform_settings (key, value) values ('seeded_before_copy', '"x"')`);

    const outcome = await copyDatabase(pool, target);
    expect(outcome.copied).toBe(true);
    if (outcome.copied) {
      expect(outcome.users).toBeGreaterThan(0);
      expect(outcome.notebooks).toBeGreaterThan(0);
    }
    expect(await fingerprint(target)).toEqual(await fingerprint(pool));
  });

  it('never writes into a database that already has accounts', async () => {
    const before = await fingerprint(target);
    expect(await copyDatabase(empty, target)).toEqual({ copied: false, reason: 'target-has-accounts' });
    expect(await copyDatabase(pool, target)).toEqual({ copied: false, reason: 'target-has-accounts' });
    expect(await fingerprint(target)).toEqual(before);
  });

  it('does nothing when the old database has no accounts', async () => {
    expect(await copyDatabase(empty, empty)).toEqual({ copied: false, reason: 'source-empty' });
  });

  it('leaves the Data API lockdown alone on a Postgres that is not Supabase', async () => {
    expect(await lockDownDataApi(target)).toEqual({ applied: false, tablesSecured: 0 });
  });
});
