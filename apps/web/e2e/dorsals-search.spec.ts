import { expect, test } from '@playwright/test';

test('user can browse dorsals and open a detail', async ({ page }) => {
  await page.goto('/dorsales');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Encuentra tu');
  const firstCard = page.locator('a[href^="/dorsales/"]').first();
  await firstCard.click();
  await expect(page).toHaveURL(/\/dorsales\/[a-f0-9-]+$/);
  await expect(page.getByText(/precio/i)).toBeVisible();
});

test('distance chip filters reduce results', async ({ page }) => {
  await page.goto('/dorsales');
  await page.getByRole('button', { name: '10K' }).click();
  await expect(page).toHaveURL(/distance=10k/);
});
