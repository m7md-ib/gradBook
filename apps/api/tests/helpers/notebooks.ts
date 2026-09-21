import type { app } from './client.js';
import request from 'supertest';

type Agent = ReturnType<typeof request.agent>;

const DEFAULT_GRADUATE = {
  fullName: 'خالد العتيبي',
  institution: 'جامعة الملك عبدالعزيز',
  major: 'إدارة أعمال',
  graduationYear: 2026,
};

export async function createNotebookForAgent(agent: Agent, overrides: { themeSlug?: string } = {}) {
  const res = await agent.post('/api/notebooks').send({
    notebook: { type: 'individual', themeSlug: overrides.themeSlug ?? 'classic-cream' },
    graduate: DEFAULT_GRADUATE,
  });
  if (res.status !== 201) {
    throw new Error(`failed to create notebook in test helper: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { notebook: res.body.notebook, graduate: res.body.graduate };
}

/** Activates a notebook end-to-end through the real order + mock-payment flow,
 *  exercising the exact code path a real purchase would take. */
export async function activateNotebookForAgent(agent: Agent, notebookId: string, packageSlug: 'basic' | 'premium' | 'class' = 'basic') {
  const packagesRes = await agent.get('/api/catalog/packages');
  const pkg = packagesRes.body.packages.find((p: { slug: string }) => p.slug === packageSlug);
  if (!pkg) throw new Error(`package ${packageSlug} not found — did the test seed the catalog?`);

  const orderRes = await agent.post('/api/orders').send({ notebookId, packageId: pkg.id });
  if (orderRes.status !== 201) {
    throw new Error(`failed to create order in test helper: ${orderRes.status} ${JSON.stringify(orderRes.body)}`);
  }
  const orderId = orderRes.body.order.id;

  const confirmRes = await agent.post(`/api/orders/${orderId}/confirm-mock`);
  return { orderId, confirmRes };
}
