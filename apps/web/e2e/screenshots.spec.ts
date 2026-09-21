import { test } from '@playwright/test';

// One-off script to generate the README screenshots — not part of CI.
test.skip(!process.env.CAPTURE_SCREENSHOTS, 'run only on demand via CAPTURE_SCREENSHOTS=1');

test('capture README screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '../../docs/screenshots/landing.png' });

  await page.goto('/d/sara-2026');
  await page.getByRole('button', { name: /افتح الدفتر/ }).click();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: '../../docs/screenshots/notebook-intro.png' });

  const nextBtn = page.getByRole('button', { name: 'التالي' });
  await nextBtn.click();
  await page.waitForTimeout(800);
  await nextBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '../../docs/screenshots/notebook-message.png' });

  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('demo@daftar.app');
  await page.getByLabel('كلمة المرور').fill('Daftar2026!');
  await page.getByRole('button', { name: 'دخول' }).click();
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '../../docs/screenshots/dashboard.png' });

  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('admin@daftar.app');
  await page.getByLabel('كلمة المرور').fill('AdminDaftar2026!');
  await page.getByRole('button', { name: 'دخول' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto('/admin');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '../../docs/screenshots/admin.png' });
});
