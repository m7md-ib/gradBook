import { test, expect } from '@playwright/test';

test('admin can log in and view platform management pages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('admin@daftar.app');
  await page.getByLabel('كلمة المرور').fill('AdminDaftar2026!');
  await page.getByRole('button', { name: 'دخول' }).click();

  await page.waitForURL('**/dashboard');
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'نظرة عامة' })).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-overview.png', fullPage: true });

  for (const [link, heading] of [
    ['المستخدمون', 'المستخدمون'],
    ['الدفاتر', 'الدفاتر'],
    ['الطلبات', 'الطلبات'],
    ['البلاغات', 'البلاغات'],
    ['الباقات', 'الباقات'],
    ['التصاميم', 'التصاميم'],
  ] as const) {
    await page.getByRole('link', { name: link }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await page.screenshot({ path: 'test-results/admin-themes.png', fullPage: true });

  expect(errors).toEqual([]);
});
