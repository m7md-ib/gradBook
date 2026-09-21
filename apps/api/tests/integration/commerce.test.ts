import { beforeAll, describe, expect, it } from 'vitest';
import { createAuthedAgent } from '../helpers/client.js';
import { activateNotebookForAgent, createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

describe('commerce: orders and payment activation', () => {
  beforeAll(async () => {
    await ensureCatalogSeeded();
  });

  it('never activates a notebook from the order alone — only after the backend verifies payment', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    const packagesRes = await agent.get('/api/catalog/packages');
    const basic = packagesRes.body.packages.find((p: { slug: string }) => p.slug === 'basic');
    const orderRes = await agent.post('/api/orders').send({ notebookId: notebook.id, packageId: basic.id });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.order.status).toBe('pending');

    // Before confirming payment, the notebook must still be a draft.
    const beforeConfirm = await agent.get(`/api/notebooks/${notebook.id}`);
    expect(beforeConfirm.body.notebook.status).toBe('draft');
  });

  it('activates the notebook with a correctly computed expiry once payment is confirmed server-side', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    const { confirmRes } = await activateNotebookForAgent(agent, notebook.id, 'basic');
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.order.status).toBe('paid');

    const after = await agent.get(`/api/notebooks/${notebook.id}`);
    expect(after.body.notebook.status).toBe('active');
    expect(after.body.notebook.expiresAt).not.toBeNull();

    const expiresAt = new Date(after.body.notebook.expiresAt).getTime();
    const expectedRoughly = Date.now() + 365 * 86_400_000;
    expect(Math.abs(expiresAt - expectedRoughly)).toBeLessThan(60_000);
  });

  it('lifetime packages activate the notebook with no expiry', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    await activateNotebookForAgent(agent, notebook.id, 'premium');

    const after = await agent.get(`/api/notebooks/${notebook.id}`);
    expect(after.body.notebook.status).toBe('active');
    expect(after.body.notebook.expiresAt).toBeNull();
  });

  it('is idempotent: confirming the same order twice does not double-process it', async () => {
    const { agent } = await createAuthedAgent();
    const { notebook } = await createNotebookForAgent(agent);

    const { orderId } = await activateNotebookForAgent(agent, notebook.id, 'basic');
    const secondConfirm = await agent.post(`/api/orders/${orderId}/confirm-mock`);

    expect(secondConfirm.status).toBe(200);
    expect(secondConfirm.body.order.status).toBe('paid');
  });

  it('rejects buying a non-class package for a class notebook', async () => {
    const { agent } = await createAuthedAgent();
    const created = await agent.post('/api/notebooks').send({
      notebook: { type: 'class', themeSlug: 'classic-cream' },
      graduate: { fullName: 'دفعة 2026', institution: 'جامعة تجريبية', major: 'عام', graduationYear: 2026 },
    });

    const packagesRes = await agent.get('/api/catalog/packages');
    const basic = packagesRes.body.packages.find((p: { slug: string }) => p.slug === 'basic');

    const orderRes = await agent.post('/api/orders').send({ notebookId: created.body.notebook.id, packageId: basic.id });
    expect(orderRes.status).toBe(400);
  });
});
