import { describe, expect, it } from 'vitest';
import { createAnonymousAgent } from '../helpers/client.js';

// In production requests reach the API through two proxies: the site's own
// origin on Vercel (vercel.json rewrites /api/*) and Render's load balancer.
// Each appends to X-Forwarded-For; the client IP must still be the one Vercel
// saw, or every visitor shares one rate-limit bucket.
describe('client IP behind the Vercel + Render proxies', () => {
  it('rate-limits each visitor separately instead of everyone behind the proxy', async () => {
    const { agent } = await createAnonymousAgent();
    const login = (clientIp: string) =>
      agent
        .post('/api/auth/login')
        .set('x-forwarded-for', `${clientIp}, 10.0.0.1`)
        .send({ email: 'nobody@example.com', password: 'WrongPass123' });

    const limit = Number(process.env.RATE_LIMIT_MAX_AUTH ?? 10);
    let last = 0;
    for (let i = 0; i <= limit; i += 1) last = (await login('203.0.113.7')).status;
    expect(last).toBe(429);

    // A different visitor arriving through the same proxy isn't blocked.
    expect((await login('198.51.100.23')).status).toBe(401);
  });
});
