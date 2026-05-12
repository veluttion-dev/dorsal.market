import { expect, test } from '@playwright/test';

test('home renders the dorsal.market wordmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/dorsal/i).first()).toBeVisible();
});

test('theme toggle switches data-theme attribute', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByRole('button', { name: /cambiar a/i }).click();
  await expect(html).not.toHaveAttribute('data-theme', before ?? '');
});
