import { test, expect } from '@playwright/test';

test('graduate can log in and manage their notebook from the dashboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('demo@daftar.app');
  await page.locator('#password').fill('Daftar2026!');
  await page.getByRole('button', { name: 'دخول' }).click();

  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: /أهلاً بعودتك/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-overview.png', fullPage: true });

  await page.locator('aside').getByRole('link', { name: 'الرسائل' }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('heading', { name: 'الرسائل' })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-messages.png', fullPage: true });

  await page.getByRole('link', { name: 'المشاركة و QR' }).click();
  await page.waitForTimeout(800);
  await expect(page.locator('img[alt="QR"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-share.png', fullPage: true });

  await page.getByRole('link', { name: 'إعدادات الدفتر' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/dashboard-settings.png', fullPage: true });

  await page.locator('aside').getByRole('link', { name: 'تعديل الدفتر' }).click();
  await expect(page.getByRole('heading', { name: 'معلومات الخريج' })).toBeVisible();
  await expect(page.locator('input[name=fullName]')).toHaveValue(/سارة/);

  await page.goto('/dashboard/print');
  await expect(page.getByRole('heading', { name: /دفتر تخرج/ })).toBeVisible();
  await expect(page.locator('figure').first()).toBeVisible();

  expect(errors).toEqual([]);
});
