import { test, expect } from '@playwright/test';

test('scaffold smoke check: routes render without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  for (const path of ['/login', '/signup', '/d/sara-2026', '/nonexistent-route']) {
    await page.goto(path);
    await page.waitForTimeout(200);
  }

  // Anonymous /api/auth/me correctly 401s (no session yet) and is handled by
  // AuthContext; the sandbox's font-CDN proxy cert is a test-environment-only
  // artifact. Neither indicates a real app error, so both are filtered here.
  const unexpected = errors.filter(
    (e) => !e.includes('401 (Unauthorized)') && !e.includes('ERR_CERT_AUTHORITY_INVALID'),
  );

  expect(unexpected, `unexpected console/page errors: ${JSON.stringify(unexpected, null, 2)}`).toEqual([]);
});
