import { test, expect } from '@playwright/test';

test('visitor can open the demo notebook, browse pages, and write a message', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/d/sara-2026');
  await expect(page.getByRole('button', { name: /افتح الدفتر/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/notebook-closed.png' });

  await page.getByRole('button', { name: /افتح الدفتر/ }).click();
  await page.waitForTimeout(2500);
  await expect(page.getByText('سارة الحربي').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/notebook-open-intro.png' });

  // Go forward a couple of pages to reach a message page.
  const nextBtn = page.getByRole('button', { name: 'التالي' });
  await nextBtn.click();
  await page.waitForTimeout(800);
  await nextBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/notebook-message-page.png' });

  // Open the write modal via the floating button and submit a message.
  await page.getByRole('button', { name: /اكتب للمتخرج/ }).first().click();
  await page.waitForTimeout(300);
  await page.getByLabel('اسمك').fill('زائر تجريبي');
  await page.getByLabel('رسالتك').fill('مبروك التخرج! فخورين فيك جداً ونتمناك التوفيق دائماً.');
  await page.screenshot({ path: 'test-results/notebook-write-modal.png' });
  await page.getByRole('button', { name: 'إرسال الرسالة' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/notebook-write-success.png' });

  expect(errors).toEqual([]);
});
