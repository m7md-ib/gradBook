import { beforeAll, describe, expect, it } from 'vitest';
import { createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';
import { activateNotebookForAgent, createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

describe('private/invite-only notebook access', () => {
  beforeAll(async () => {
    await ensureCatalogSeeded();
  });

  it('blocks viewing a private notebook without the access code, then allows it once submitted', async () => {
    const { agent: owner } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(owner);
    await activateNotebookForAgent(owner, notebook.id, 'basic');

    const settingsRes = await owner
      .patch(`/api/notebooks/${notebook.id}/settings`)
      .send({ visibility: 'private', approvalMode: 'auto', allowPhotos: true, allowGallery: true, musicEnabled: false });
    const accessCode = settingsRes.body.notebook.accessCode;
    expect(accessCode).toBeTruthy();

    const { agent: visitor } = await createAnonymousAgent();
    const blocked = await visitor.get(`/api/public/notebooks/${notebook.slug}`);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('access_code_required');

    const wrongCode = await visitor.post(`/api/public/notebooks/${notebook.slug}/access`).send({ code: 'WRONG-CODE' });
    expect(wrongCode.status).toBe(403);

    const rightCode = await visitor.post(`/api/public/notebooks/${notebook.slug}/access`).send({ code: accessCode });
    expect(rightCode.status).toBe(200);

    const allowed = await visitor.get(`/api/public/notebooks/${notebook.slug}`);
    expect(allowed.status).toBe(200);
  });

  it('lets anyone view an invite-only notebook but blocks writing without the code', async () => {
    const { agent: owner } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(owner);
    await activateNotebookForAgent(owner, notebook.id, 'basic');

    const settingsRes = await owner
      .patch(`/api/notebooks/${notebook.id}/settings`)
      .send({ visibility: 'invite_only', approvalMode: 'auto', allowPhotos: true, allowGallery: true, musicEnabled: false });
    const accessCode = settingsRes.body.notebook.accessCode;

    const { agent: visitor } = await createAnonymousAgent();
    const viewRes = await visitor.get(`/api/public/notebooks/${notebook.slug}`);
    expect(viewRes.status).toBe(200);

    const writeBlocked = await visitor
      .post(`/api/public/notebooks/${notebook.slug}/messages`)
      .field({ authorName: 'زائر', body: 'أحاول الكتابة بدون دعوة', relationship: 'friend', website: '' });
    expect(writeBlocked.status).toBe(403);
    expect(writeBlocked.body.error.code).toBe('invite_code_required');

    await visitor.post(`/api/public/notebooks/${notebook.slug}/access`).send({ code: accessCode });
    const writeAllowed = await visitor
      .post(`/api/public/notebooks/${notebook.slug}/messages`)
      .field({ authorName: 'زائر مدعو', body: 'الآن أستطيع الكتابة', relationship: 'friend', website: '' });
    expect(writeAllowed.status).toBe(201);
  });
});
