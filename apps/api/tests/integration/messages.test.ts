import { beforeAll, describe, expect, it } from 'vitest';
import { createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';
import { activateNotebookForAgent, createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

async function createActiveNotebook() {
  const { agent: owner } = await createAuthedAgent();
  const { notebook } = await createNotebookForAgent(owner);
  await activateNotebookForAgent(owner, notebook.id, 'basic');
  return { owner, slug: notebook.slug as string, notebookId: notebook.id as string };
}

describe('public message submission', () => {
  beforeAll(async () => {
    await ensureCatalogSeeded();
  });

  it('publishes immediately when the notebook uses auto-approval', async () => {
    const { owner, slug, notebookId } = await createActiveNotebook();
    await owner
      .patch(`/api/notebooks/${notebookId}/settings`)
      .send({ visibility: 'public', approvalMode: 'auto', allowPhotos: true, allowGallery: true, musicEnabled: false });

    const { agent: visitor } = await createAnonymousAgent();
    const res = await visitor
      .post(`/api/public/notebooks/${slug}/messages`)
      .field('authorName', 'زائر')
      .field('body', 'مبروك التخرج! فخورين فيك.')
      .field('relationship', 'friend')
      .field('website', '');

    expect(res.status).toBe(201);
    expect(res.body.requiresApproval).toBe(false);

    const listRes = await visitor.get(`/api/public/notebooks/${slug}/messages`);
    expect(listRes.body.items.some((m: { authorName: string }) => m.authorName === 'زائر')).toBe(true);
  });

  it('holds messages for review when the notebook uses manual approval, and hides them from the public feed', async () => {
    const { owner, slug, notebookId } = await createActiveNotebook();
    await owner
      .patch(`/api/notebooks/${notebookId}/settings`)
      .send({ visibility: 'public', approvalMode: 'manual', allowPhotos: true, allowGallery: true, musicEnabled: false });

    const { agent: visitor } = await createAnonymousAgent();
    const res = await visitor
      .post(`/api/public/notebooks/${slug}/messages`)
      .field('authorName', 'زائر آخر')
      .field('body', 'رسالة بانتظار المراجعة')
      .field('relationship', 'classmate')
      .field('website', '');

    expect(res.status).toBe(201);
    expect(res.body.requiresApproval).toBe(true);

    const listRes = await visitor.get(`/api/public/notebooks/${slug}/messages`);
    expect(listRes.body.items.some((m: { authorName: string }) => m.authorName === 'زائر آخر')).toBe(false);

    const ownerListRes = await owner.get(`/api/notebooks/${notebookId}/messages`).query({ status: 'pending' });
    const pending = ownerListRes.body.items.find((m: { authorName: string }) => m.authorName === 'زائر آخر');
    expect(pending).toBeTruthy();

    const approveRes = await owner.patch(`/api/notebooks/${notebookId}/messages/${pending.id}`).send({ status: 'approved' });
    expect(approveRes.status).toBe(200);

    const listAfterApproval = await visitor.get(`/api/public/notebooks/${slug}/messages`);
    expect(listAfterApproval.body.items.some((m: { authorName: string }) => m.authorName === 'زائر آخر')).toBe(true);
  });

  it('strips HTML/script content from the message body', async () => {
    const { owner, slug, notebookId } = await createActiveNotebook();
    await owner
      .patch(`/api/notebooks/${notebookId}/settings`)
      .send({ visibility: 'public', approvalMode: 'auto', allowPhotos: true, allowGallery: true, musicEnabled: false });
    const { agent: visitor } = await createAnonymousAgent();

    const res = await visitor
      .post(`/api/public/notebooks/${slug}/messages`)
      .field('authorName', 'مختبر الحقن')
      .field('body', '<script>alert(1)</script>مبروك!')
      .field('relationship', 'friend')
      .field('website', '');
    expect(res.status).toBe(201);

    const listRes = await visitor.get(`/api/public/notebooks/${slug}/messages`);
    const stored = listRes.body.items.find((m: { authorName: string }) => m.authorName === 'مختبر الحقن');
    expect(stored).toBeTruthy();
    // The <script> tag AND its inner contents are removed entirely (sanitize-html's
    // safe default for dangerous tags) — only the text outside it survives.
    expect(stored.body).toBe('مبروك!');
    expect(stored.body).not.toContain('<script>');
    expect(stored.body).not.toContain('alert(1)');
  });

  it('rejects an honeypot-filled submission as a bot without erroring', async () => {
    const { slug } = await createActiveNotebook();
    const { agent: visitor } = await createAnonymousAgent();

    const res = await visitor
      .post(`/api/public/notebooks/${slug}/messages`)
      .field('authorName', 'بوت')
      .field('body', 'رسالة من بوت')
      .field('relationship', 'friend')
      .field('website', 'http://spam.example.com');

    expect(res.status).toBe(400);
  });

  it('rejects an identical resubmission within the duplicate window', async () => {
    const { slug } = await createActiveNotebook();
    const { agent: visitor } = await createAnonymousAgent();
    const payload = { authorName: 'مكرر', body: 'نفس الرسالة بالضبط', relationship: 'friend', website: '' };

    const first = await visitor.post(`/api/public/notebooks/${slug}/messages`).field(payload);
    expect(first.status).toBe(201);

    const second = await visitor.post(`/api/public/notebooks/${slug}/messages`).field(payload);
    expect(second.status).toBe(409);
  });

  it('returns 404 for a notebook that has not been activated yet', async () => {
    const { agent: owner } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(owner);
    const { agent: visitor } = await createAnonymousAgent();

    const res = await visitor.get(`/api/public/notebooks/${notebook.slug}`);
    expect(res.status).toBe(404);
  });
});
