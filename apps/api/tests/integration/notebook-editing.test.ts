import { beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_THEMES } from '@daftar/shared';
import { createAuthedAgent } from '../helpers/client.js';
import { createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

// A minimal valid 1x1 transparent PNG, used to exercise the real image pipeline.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

type Authed = Awaited<ReturnType<typeof createAuthedAgent>>;
// One account for the whole file: signups count toward the auth rate limit.
let owner: Authed;

beforeAll(async () => {
  await ensureCatalogSeeded();
  owner = await createAuthedAgent();
});

describe('editing a notebook after creation', () => {
  it('changes the theme, rejecting unknown ones', async () => {
    const { notebook } = await createNotebookForAgent(owner.agent);
    const other = DEFAULT_THEMES.find((t) => t.slug !== notebook.themeSlug)!.slug;

    const ok = await owner.agent.patch(`/api/notebooks/${notebook.id}/details`).send({ themeSlug: other });
    expect(ok.status).toBe(200);
    expect(ok.body.notebook.themeSlug).toBe(other);

    const bad = await owner.agent.patch(`/api/notebooks/${notebook.id}/details`).send({ themeSlug: 'no-such-theme' });
    expect(bad.status).toBe(400);
  });

  it('edits graduate info, clears optional fields, and keeps an individual notebook title in step', async () => {
    const { notebook, graduate } = await createNotebookForAgent(owner.agent);
    await owner.agent
      .patch(`/api/notebooks/${notebook.id}/graduates/${graduate.id}`)
      .send({ graduationDate: '2026-06-20', shortMessage: 'مرحلة وانتهت' });

    const res = await owner.agent
      .patch(`/api/notebooks/${notebook.id}/graduates/${graduate.id}`)
      .send({ fullName: 'خالد محمد العتيبي', graduationDate: null, shortMessage: null });
    expect(res.status).toBe(200);
    expect(res.body.graduate.fullName).toBe('خالد محمد العتيبي');
    expect(res.body.graduate.graduationDate).toBeNull();
    expect(res.body.graduate.shortMessage).toBeNull();

    const after = await owner.agent.get(`/api/notebooks/${notebook.id}`);
    expect(after.body.notebook.title).toBe('خالد محمد العتيبي');
  });

  it('uploads a graduate photo and returns its public URL in the dashboard list', async () => {
    const { notebook, graduate } = await createNotebookForAgent(owner.agent);
    const upload = await owner.agent
      .post(`/api/notebooks/${notebook.id}/graduates/${graduate.id}/photo`)
      .attach('file', TINY_PNG, { filename: 'me.png', contentType: 'image/png' });
    expect(upload.status).toBe(200);
    expect(upload.body.graduate.profilePhotoUrl).toMatch(/^https?:\/\//);

    const mine = await owner.agent.get('/api/notebooks/mine');
    const listed = mine.body.notebooks.find((n: { id: string }) => n.id === notebook.id);
    expect(listed.graduates[0].profilePhotoUrl).toBe(upload.body.graduate.profilePhotoUrl);
    expect(listed).toHaveProperty('coverImageUrl');
  });

  it('never stores a client-supplied photo key', async () => {
    const res = await owner.agent.post('/api/notebooks').send({
      notebook: { type: 'individual', themeSlug: 'classic-cream' },
      graduate: {
        fullName: 'اختبار',
        institution: 'جامعة',
        major: 'تخصص',
        graduationYear: 2026,
        profilePhotoUrl: 'https://evil.example.com/x.png',
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.graduate.profilePhotoKey).toBeNull();
  });
});

describe('class notebook graduates', () => {
  it('adds, renames and removes graduates, but never the last one', async () => {
    const created = await owner.agent.post('/api/notebooks').send({
      notebook: { type: 'class', themeSlug: 'classic-cream' },
      graduate: { fullName: 'سارة', institution: 'جامعة', major: 'هندسة', graduationYear: 2026 },
    });
    const notebookId = created.body.notebook.id;
    const first = created.body.graduate.id;

    const added = await owner.agent
      .post(`/api/notebooks/${notebookId}/graduates`)
      .send({ fullName: 'ليث', institution: 'جامعة', major: 'هندسة', graduationYear: 2026 });
    expect(added.status).toBe(201);

    const renamed = await owner.agent.patch(`/api/notebooks/${notebookId}/details`).send({ title: 'دفعة الهندسة 2026' });
    expect(renamed.body.notebook.title).toBe('دفعة الهندسة 2026');

    const list = await owner.agent.get(`/api/notebooks/${notebookId}/graduates`);
    expect(list.body.graduates.map((g: { fullName: string }) => g.fullName)).toEqual(['سارة', 'ليث']);

    expect((await owner.agent.delete(`/api/notebooks/${notebookId}/graduates/${added.body.graduate.id}`)).status).toBe(204);
    expect((await owner.agent.delete(`/api/notebooks/${notebookId}/graduates/${first}`)).status).toBe(400);
  });
});

describe('cover style and framing', () => {
  it('saves text style and image framing, and shows them on the public notebook', async () => {
    const { notebook } = await createNotebookForAgent(owner.agent);
    const style = { nameScale: 1.4, textScale: 0.9, textColor: '#F3E7D3', nameFont: 'amiri', align: 'center' };
    const crop = { x: 30, y: 70, zoom: 1.6 };

    const saved = await owner.agent.patch(`/api/notebooks/${notebook.id}/cover`).send({
      sourceType: 'template',
      overlayOpacity: 0.55,
      quote: 'Chapter complete',
      elements: { showName: true, showMajor: true, showInstitution: true, showGraduationYear: true, showGraduationDate: false, showQuote: true },
      style,
      crop,
    });
    expect(saved.status).toBe(200);
    expect(saved.body.notebook.coverStyle).toEqual(style);
    expect(saved.body.notebook.coverCrop).toEqual(crop);

    const bad = await owner.agent.patch(`/api/notebooks/${notebook.id}/cover`).send({
      sourceType: 'template',
      overlayOpacity: 0.4,
      elements: saved.body.notebook.coverElements,
      style: { ...style, textColor: 'red; background:url(x)' },
    });
    expect(bad.status).toBe(400);
  });
});
