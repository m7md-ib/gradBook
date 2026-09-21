import request from 'supertest';
import { createApp } from '../../src/app.js';

export const app = createApp();

type Agent = ReturnType<typeof request.agent>;

interface AuthedAgentResult {
  agent: Agent;
  email: string;
  userId: string;
  csrfToken: string;
}

let counter = 0;

/** superagent agents persist cookies automatically but not headers, and every
 *  mutating route needs the CSRF header — so mutating verbs are patched here
 *  to always attach it, rather than repeating `.set(...)` in every test. */
function withCsrfHeader(agent: Agent, token: string): Agent {
  (['post', 'patch', 'put', 'delete'] as const).forEach((method) => {
    const original = agent[method].bind(agent);
    agent[method] = ((url: string) => original(url).set('x-csrf-token', token)) as Agent[typeof method];
  });
  return agent;
}

async function primeCsrfToken(agent: Agent): Promise<string> {
  const primer = await agent.get('/api/health');
  const csrfCookie = primer.headers['set-cookie']?.find((c: string) => c.startsWith('daftar_csrf='));
  return csrfCookie?.split(';')[0]?.split('=')[1] ?? '';
}

/** Signs up a fresh, unique user and returns a cookie-jar-carrying supertest
 *  agent already authenticated as them, with CSRF handled transparently. */
export async function createAuthedAgent(role: 'graduate' = 'graduate'): Promise<AuthedAgentResult> {
  counter += 1;
  const email = `test-user-${Date.now()}-${counter}@example.com`;
  const rawAgent = request.agent(app);
  const csrfToken = await primeCsrfToken(rawAgent);
  const agent = withCsrfHeader(rawAgent, csrfToken);

  const signupRes = await agent
    .post('/api/auth/signup')
    .send({ fullName: 'مستخدم اختبار', email, password: 'TestPass123', locale: 'ar' });

  if (signupRes.status !== 201) {
    throw new Error(`signup failed in test helper: ${signupRes.status} ${JSON.stringify(signupRes.body)}`);
  }

  return { agent, email, userId: signupRes.body.user.id, csrfToken };
}

/** For tests that need an unauthenticated agent but still must pass CSRF
 *  (e.g. asserting login fails for the *right* reason, not a CSRF 403). */
export async function createAnonymousAgent(): Promise<{ agent: Agent; csrfToken: string }> {
  const rawAgent = request.agent(app);
  const csrfToken = await primeCsrfToken(rawAgent);
  return { agent: withCsrfHeader(rawAgent, csrfToken), csrfToken };
}
