import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { env } from '../../src/config/env.js';
import { db } from '../../src/db/client.js';
import { platformSettings, users } from '../../src/db/schema/index.js';
import { createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';
import { createNotebookForAgent } from '../helpers/notebooks.js';
import { ensureCatalogSeeded } from '../helpers/seed-catalog.js';

type Authed = Awaited<ReturnType<typeof createAuthedAgent>>;

async function packageId(agent: Authed['agent'], slug: string) {
  const res = await agent.get('/api/catalog/packages');
  return res.body.packages.find((p: { slug: string }) => p.slug === slug).id as string;
}

/** A fresh user promoted to admin, logged in again so the JWT carries the role. */
async function createAdminAgent() {
  const authed = await createAuthedAgent();
  await db.update(users).set({ role: 'admin' }).where(eq(users.id, authed.userId));
  const login = await authed.agent.post('/api/auth/login').send({ email: authed.email, password: 'TestPass123' });
  expect(login.status).toBe(200);
  return authed;
}

// Accounts are shared across this file on purpose: every signup/login counts
// toward RATE_LIMIT_MAX_AUTH (10 per minute in .env.test) for 127.0.0.1.
let buyer: Authed;
let admin: Authed;

beforeAll(async () => {
  buyer = await createAuthedAgent();
  admin = await createAdminAgent();
});

describe('manual (CliQ / bank transfer) payments', () => {
  const originalProvider = env.PAYMENT_PROVIDER;

  beforeAll(async () => {
    await ensureCatalogSeeded();
    env.PAYMENT_PROVIDER = 'manual';
    await db
      .insert(platformSettings)
      .values({ key: 'payment_cliq_alias', value: 'DAFTARPAY' })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value: 'DAFTARPAY' } });
  });

  afterAll(() => {
    env.PAYMENT_PROVIDER = originalProvider;
  });

  it('creates a pending order with a typeable reference and returns the transfer details', async () => {
    const { agent } = buyer;
    const { notebook } = await createNotebookForAgent(agent);

    const orderRes = await agent.post('/api/orders').send({ notebookId: notebook.id, packageId: await packageId(agent, 'basic') });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.order.status).toBe('pending');
    expect(orderRes.body.checkout.providerReference).toMatch(/^DF-[A-HJ-NP-Z2-9]{6}$/);

    const getRes = await agent.get(`/api/orders/${orderRes.body.order.id}`);
    expect(getRes.body.order.payments[0].provider).toBe('manual');
    expect(getRes.body.paymentInstructions.cliqAlias).toBe('DAFTARPAY');
  });

  it('never lets the buyer self-confirm: the mock confirm path is closed and the notebook stays a draft', async () => {
    const { agent } = buyer;
    const { notebook } = await createNotebookForAgent(agent);
    const orderRes = await agent.post('/api/orders').send({ notebookId: notebook.id, packageId: await packageId(agent, 'basic') });

    const selfConfirm = await agent.post(`/api/orders/${orderRes.body.order.id}/confirm-mock`);
    expect(selfConfirm.status).toBe(404);

    const after = await agent.get(`/api/notebooks/${notebook.id}`);
    expect(after.body.notebook.status).toBe('draft');
  });

  it('hands back the same order (and reference) on a repeat checkout, and supersedes it on a package change', async () => {
    const { agent } = buyer;
    const { notebook } = await createNotebookForAgent(agent);
    const basic = await packageId(agent, 'basic');

    const first = await agent.post('/api/orders').send({ notebookId: notebook.id, packageId: basic });
    const again = await agent.post('/api/orders').send({ notebookId: notebook.id, packageId: basic });
    expect(again.body.order.id).toBe(first.body.order.id);
    expect(again.body.checkout.providerReference).toBe(first.body.checkout.providerReference);

    const premium = await agent.post('/api/orders').send({ notebookId: notebook.id, packageId: await packageId(agent, 'premium') });
    expect(premium.body.order.id).not.toBe(first.body.order.id);

    const mine = await agent.get('/api/orders/mine');
    const statuses = Object.fromEntries(mine.body.orders.map((o: { id: string; status: string }) => [o.id, o.status]));
    expect(statuses[first.body.order.id]).toBe('cancelled');
    expect(statuses[premium.body.order.id]).toBe('pending');
  });

  it('flags a pending order from a provider that is no longer active, and supersedes it on a new checkout', async () => {
    const { notebook } = await createNotebookForAgent(buyer.agent);
    const basic = await packageId(buyer.agent, 'basic');

    env.PAYMENT_PROVIDER = 'mock';
    const legacy = await buyer.agent.post('/api/orders').send({ notebookId: notebook.id, packageId: basic });
    env.PAYMENT_PROVIDER = 'manual';

    const view = await buyer.agent.get(`/api/orders/${legacy.body.order.id}`);
    expect(view.body.order.payments[0].provider).toBe('mock');
    expect(view.body.activeProvider).toBe('manual');

    const fresh = await buyer.agent.post('/api/orders').send({ notebookId: notebook.id, packageId: basic });
    expect(fresh.body.order.id).not.toBe(legacy.body.order.id);
    const after = await buyer.agent.get(`/api/orders/${legacy.body.order.id}`);
    expect(after.body.order.status).toBe('cancelled');
  });

  it('activates the notebook only when an admin confirms the payment', async () => {
    const { notebook } = await createNotebookForAgent(buyer.agent);
    const orderRes = await buyer.agent
      .post('/api/orders')
      .send({ notebookId: notebook.id, packageId: await packageId(buyer.agent, 'basic') });
    const orderId = orderRes.body.order.id;

    const notAdmin = await buyer.agent.post(`/api/admin/orders/${orderId}/confirm-payment`);
    expect(notAdmin.status).toBe(403);

    const confirm = await admin.agent.post(`/api/admin/orders/${orderId}/confirm-payment`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.order.status).toBe('paid');

    const after = await buyer.agent.get(`/api/notebooks/${notebook.id}`);
    expect(after.body.notebook.status).toBe('active');

    const twice = await admin.agent.post(`/api/admin/orders/${orderId}/confirm-payment`);
    expect(twice.status).toBe(409);
  });

  it('lets an admin reject a pending payment without activating anything', async () => {
    const { notebook } = await createNotebookForAgent(buyer.agent);
    const orderRes = await buyer.agent
      .post('/api/orders')
      .send({ notebookId: notebook.id, packageId: await packageId(buyer.agent, 'basic') });
    const orderId = orderRes.body.order.id;

    const reject = await admin.agent.post(`/api/admin/orders/${orderId}/reject-payment`);
    expect(reject.status).toBe(200);
    expect(reject.body.order.status).toBe('failed');

    const after = await buyer.agent.get(`/api/notebooks/${notebook.id}`);
    expect(after.body.notebook.status).toBe('draft');

    const again = await admin.agent.post(`/api/admin/orders/${orderId}/reject-payment`);
    expect(again.status).toBe(409);
  });
});

describe('admin-assisted password reset', () => {
  it('issues a working temporary password and signs out the old sessions', async () => {
    const user = await createAuthedAgent();

    const reset = await admin.agent.post(`/api/admin/users/${user.userId}/reset-password`);
    expect(reset.status).toBe(200);
    const { temporaryPassword } = reset.body;
    expect(temporaryPassword).toMatch(/^(?=.*[a-z])(?=.*\d)[a-z\d]{10}$/);

    const { agent: anon } = await createAnonymousAgent();
    const oldLogin = await anon.post('/api/auth/login').send({ email: user.email, password: 'TestPass123' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await anon.post('/api/auth/login').send({ email: user.email, password: temporaryPassword });
    expect(newLogin.status).toBe(200);

    const staleRefresh = await user.agent.post('/api/auth/refresh');
    expect(staleRefresh.status).toBe(401);
  });

  it('refuses to reset an admin account, and only admins can call it', async () => {
    const otherAdmin = await createAdminAgent();
    const res = await admin.agent.post(`/api/admin/users/${otherAdmin.userId}/reset-password`);
    expect(res.status).toBe(403);

    const notAdmin = await buyer.agent.post(`/api/admin/users/${otherAdmin.userId}/reset-password`);
    expect(notAdmin.status).toBe(403);
  });
});
