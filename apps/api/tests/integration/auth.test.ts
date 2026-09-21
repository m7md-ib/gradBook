import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAnonymousAgent, createAuthedAgent } from '../helpers/client.js';

describe('auth', () => {
  it('signs up a new graduate and returns their profile', async () => {
    const { agent, email } = await createAuthedAgent();
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
    expect(me.body.user.role).toBe('graduate');
  });

  it('rejects signup with an already-registered email', async () => {
    const { email } = await createAuthedAgent();
    const { agent } = await createAnonymousAgent();

    const res = await agent
      .post('/api/auth/signup')
      .send({ fullName: 'شخص آخر', email, password: 'AnotherPass123', locale: 'ar' });

    expect(res.status).toBe(409);
  });

  it('rejects login with a wrong password', async () => {
    const { email } = await createAuthedAgent();
    const { agent } = await createAnonymousAgent();

    const res = await agent.post('/api/auth/login').send({ email, password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });

  it('rejects a mutating request without a valid CSRF token', async () => {
    // Deliberately uses a bare agent (cookies primed, header never attached)
    // to prove the CSRF middleware itself is enforced, not bypassed by the helper.
    const agent = request.agent(app);
    await agent.get('/api/health');

    const res = await agent.post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever123' });

    expect(res.status).toBe(403);
  });

  it('blocks unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/notebooks/mine');
    expect(res.status).toBe(401);
  });
});
