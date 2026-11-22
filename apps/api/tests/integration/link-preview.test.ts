import { beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';
import { activateNotebookForAgent, createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

type Authed = Awaited<ReturnType<typeof createAuthedAgent>>;
let owner: Authed;

beforeAll(async () => {
  await ensureCatalogSeeded();
  owner = await createAuthedAgent();
});

describe('link previews', () => {
  it('returns preview data and a 1200x630 JPEG for a published notebook, without counting a visit', async () => {
    const { notebook } = await createNotebookForAgent(owner.agent);
    await activateNotebookForAgent(owner.agent, notebook.id, 'basic');
    const { agent: crawler } = await createAnonymousAgent();

    const before = (await owner.agent.get(`/api/notebooks/${notebook.id}/stats`)).body.stats.totalVisitors;
    const preview = await crawler.get(`/api/public/notebooks/${notebook.slug}/preview`);
    expect(preview.status).toBe(200);
    expect(preview.body).toMatchObject({ slug: notebook.slug, type: 'individual', name: 'خالد العتيبي', expired: false });
    expect(typeof preview.body.imageVersion).toBe('number');

    const image = await crawler.get(`/api/public/notebooks/${notebook.slug}/preview.jpg`).buffer(true);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toBe('image/jpeg');
    const meta = await sharp(image.body as Buffer).metadata();
    expect([meta.width, meta.height]).toEqual([1200, 630]);

    const after = (await owner.agent.get(`/api/notebooks/${notebook.id}/stats`)).body.stats.totalVisitors;
    expect(after).toBe(before);
  });

  it('does not preview unpublished notebooks', async () => {
    const { notebook } = await createNotebookForAgent(owner.agent);
    const { agent: crawler } = await createAnonymousAgent();
    expect((await crawler.get(`/api/public/notebooks/${notebook.slug}/preview`)).status).toBe(404);
    expect((await crawler.get(`/api/public/notebooks/${notebook.slug}/preview.jpg`)).status).toBe(404);
  });
});
