import { beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '../../src/db/client.js';
import { env } from '../../src/config/env.js';
import { resetAllUserData } from '../../src/modules/admin/reset.js';
import { createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';
import { activateNotebookForAgent, createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function count(table: string): Promise<number> {
  const result = await db.execute(sql.raw(`select count(*)::int as n from ${table}`));
  return Number((result.rows[0] as { n: number }).n);
}

describe('RESET_ALL_DATA', () => {
  beforeAll(async () => {
    await ensureCatalogSeeded();
  });

  it('wipes accounts, their data and uploaded files once per token, keeping the catalog', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);
    await activateNotebookForAgent(agent, notebook.id, 'basic');
    const upload = await agent
      .post(`/api/notebooks/${notebook.id}/cover/upload`)
      .attach('file', TINY_PNG, { filename: 'cover.png', contentType: 'image/png' });
    const coverFile = path.resolve(env.STORAGE_LOCAL_DIR, upload.body.image.key);
    expect(existsSync(coverFile)).toBe(true);

    const { agent: visitor } = await createAnonymousAgent();
    await visitor
      .post(`/api/public/notebooks/${notebook.slug}/messages`)
      .field('authorName', 'زائر')
      .field('body', 'مبروك')
      .field('relationship', 'friend')
      .field('website', '');

    const catalogBefore = [await count('notebook_themes'), await count('packages'), await count('cover_templates')];
    const token = `delete-all-users-test-${Date.now()}`;

    const outcome = await resetAllUserData(token);
    expect(outcome.ran).toBe(true);

    for (const table of ['users', 'notebooks', 'graduates', 'messages', 'orders', 'payments', 'qr_codes', 'analytics_events', 'refresh_tokens']) {
      expect(await count(table), table).toBe(0);
    }
    expect([await count('notebook_themes'), await count('packages'), await count('cover_templates')]).toEqual(catalogBefore);
    expect(existsSync(coverFile)).toBe(false);

    // Same token again (e.g. the env var left on the host): no second wipe.
    expect(await resetAllUserData(token)).toEqual({ ran: false, reason: 'already-done' });
  });

  it('refuses a value that does not start with the confirmation prefix', async () => {
    expect(await resetAllUserData('yes')).toEqual({ ran: false, reason: 'invalid-token' });
  });
});
