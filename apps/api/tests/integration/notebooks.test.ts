import { beforeAll, describe, expect, it } from 'vitest';
import { createAuthedAgent } from '../helpers/client.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

const graduateInfo = {
  fullName: 'محمد إبراهيم',
  institution: 'جامعة الملك سعود',
  major: 'علوم حاسب',
  graduationYear: 2026,
};

describe('notebooks', () => {
  beforeAll(async () => {
    await ensureCatalogSeeded();
  });

  it('creates a notebook with a unique, transliterated slug', async () => {
    const { agent } = await createAuthedAgent();

    const res = await agent
      .post('/api/notebooks')
      .send({ notebook: { type: 'individual', themeSlug: 'classic-cream' }, graduate: graduateInfo });

    expect(res.status).toBe(201);
    expect(res.body.notebook.status).toBe('draft');
    expect(res.body.notebook.slug).toMatch(/^[a-z0-9-]+$/);
    expect(res.body.graduate.fullName).toBe(graduateInfo.fullName);
  });

  it('appends a suffix when two notebooks would collide on the same slug', async () => {
    // Randomized per run so repeated local `pnpm test` runs against the same
    // persistent test database never collide with a previous run's rows.
    const baseSlug = `shared-name-test-${Date.now()}`;
    const { agent: agentA } = await createAuthedAgent();
    const { agent: agentB } = await createAuthedAgent();

    const resA = await agentA
      .post('/api/notebooks')
      .send({ notebook: { type: 'individual', themeSlug: 'classic-cream', slug: baseSlug }, graduate: graduateInfo });
    const resB = await agentB
      .post('/api/notebooks')
      .send({ notebook: { type: 'individual', themeSlug: 'classic-cream', slug: baseSlug }, graduate: graduateInfo });

    expect(resA.body.notebook.slug).toBe(baseSlug);
    expect(resB.body.notebook.slug).not.toBe(baseSlug);
    expect(resB.body.notebook.slug).toMatch(new RegExp(`^${baseSlug}-\\d+$`));
  });

  it('prevents one owner from reading or editing another owner\'s notebook', async () => {
    const { agent: owner } = await createAuthedAgent();
    const { agent: intruder } = await createAuthedAgent();

    const created = await owner
      .post('/api/notebooks')
      .send({ notebook: { type: 'individual', themeSlug: 'classic-cream' }, graduate: graduateInfo });
    const notebookId = created.body.notebook.id;

    const readAttempt = await intruder.get(`/api/notebooks/${notebookId}`);
    expect(readAttempt.status).toBe(403);

    const writeAttempt = await intruder
      .patch(`/api/notebooks/${notebookId}/settings`)
      .send({ visibility: 'private', approvalMode: 'auto', allowPhotos: true, allowGallery: true, musicEnabled: false });
    expect(writeAttempt.status).toBe(403);
  });

  it('rejects creating a notebook with an unknown theme', async () => {
    const { agent } = await createAuthedAgent();
    const res = await agent
      .post('/api/notebooks')
      .send({ notebook: { type: 'individual', themeSlug: 'does-not-exist' }, graduate: graduateInfo });
    expect(res.status).toBe(400);
  });
});
