import { beforeAll, describe, expect, it } from 'vitest';
import { createAuthedAgent } from '../helpers/client.js';
import { createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

// A minimal valid 1x1 transparent PNG, used to exercise the real image pipeline.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

describe('QR codes', () => {
  beforeAll(async () => {
    await ensureCatalogSeeded();
  });

  it('generates a QR code pointing at the notebook and returns a public URL', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    const res = await agent.get(`/api/notebooks/${notebook.id}/qr`);
    expect(res.status).toBe(200);
    expect(res.body.qr.imageUrl).toMatch(/^https?:\/\//);
    expect(res.body.qr.scanCount).toBe(0);
  });

  it('regenerating replaces the stored image but keeps the scan counter', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    const first = await agent.get(`/api/notebooks/${notebook.id}/qr`);
    const regenerated = await agent.post(`/api/notebooks/${notebook.id}/qr/regenerate`);

    expect(regenerated.status).toBe(200);
    expect(regenerated.body.qr.id).toBe(first.body.qr.id);
  });
});

describe('cover image upload validation', () => {
  it('accepts a real image and rejects a file that is not actually an image', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    const goodRes = await agent
      .post(`/api/notebooks/${notebook.id}/cover/upload`)
      .attach('file', TINY_PNG, { filename: 'cover.png', contentType: 'image/png' });
    expect(goodRes.status).toBe(200);
    expect(goodRes.body.notebook.coverSourceType).toBe('custom');

    const badRes = await agent
      .post(`/api/notebooks/${notebook.id}/cover/upload`)
      .attach('file', Buffer.from('this is not an image, just text'), {
        filename: 'not-an-image.png',
        contentType: 'image/png',
      });
    expect(badRes.status).toBe(400);
  });

  it('rejects a disallowed file type outright', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    const res = await agent
      .post(`/api/notebooks/${notebook.id}/cover/upload`)
      .attach('file', Buffer.from('<html>not an image</html>'), {
        filename: 'evil.html',
        contentType: 'text/html',
      });
    expect(res.status).toBe(400);
  });
});
