import { expect, test } from '@playwright/test';

test('demo credentials login lands on the profile page in local mock mode', async ({ page }) => {
  await page.goto('/login?callbackUrl=/perfil');
  await page.getByRole('button', { name: /entrar como demo/i }).click();

  await expect(page).toHaveURL(/\/perfil$/);
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible();
});

test('local mock registration creates a user and lands on profile completion', async ({ page }) => {
  const email = `ana.e2e.${Date.now()}@example.com`;

  await page.goto('/registro?callbackUrl=/perfil/completar');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.reload();
  await page.getByLabel(/nombre completo/i).fill('Ana Garcia');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^dni/i).fill('12345678Z');
  await page.getByLabel(/genero/i).selectOption('female');
  await page.getByLabel(/fecha de nacimiento/i).fill('1990-01-02');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /crear cuenta demo/i }).click();

  await expect(page).toHaveURL(/\/perfil\/completar$/);
  await expect(page.getByRole('heading', { name: /completar perfil/i })).toBeVisible();
});
