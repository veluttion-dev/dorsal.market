import { expect, test } from '@playwright/test';

test('home renders the dorsal.market wordmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/dorsal/i).first()).toBeVisible();
});

test('theme toggle switches data-theme attribute', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  // The toggle's aria-label is theme-agnostic ("Cambiar tema") until mounted,
  // then becomes "Cambiar a {light|dark}" — match both. The page renders the
  // toggle in the nav and in the body, so target the first.
  await page.getByRole('button', { name: /cambiar/i }).first().click();
  await expect(html).not.toHaveAttribute('data-theme', before ?? '');
});
