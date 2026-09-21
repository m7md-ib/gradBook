import { beforeAll, describe, expect, it } from 'vitest';
import { createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';
import { activateNotebookForAgent, createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

describe('message submission rate limiting', () => {
  beforeAll(async () => {
    await ensureCatalogSeeded();
  });

  it('returns 429 once a visitor exceeds RATE_LIMIT_MAX_MESSAGES for a notebook', async () => {
    const { agent: owner } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(owner);
    await activateNotebookForAgent(owner, notebook.id, 'basic');

    const { agent: visitor } = await createAnonymousAgent();
    const limit = 5; // matches RATE_LIMIT_MAX_MESSAGES in .env.test

    const statuses: number[] = [];
    for (let i = 0; i < limit + 1; i += 1) {
      const res = await visitor
        .post(`/api/public/notebooks/${notebook.slug}/messages`)
        .field({ authorName: `زائر ${i}`, body: `رسالة فريدة رقم ${i} حتى لا تُعتبر مكررة`, relationship: 'friend', website: '' });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, limit)).toEqual(Array(limit).fill(201));
    expect(statuses[limit]).toBe(429);
  });
});
