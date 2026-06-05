import { expect, test } from '@playwright/test';

test('profile PATCH updates runner fields in local mock mode', async ({ page }) => {
  await page.goto('/login?callbackUrl=/perfil');
  await page.getByRole('button', { name: /entrar como demo/i }).click();
  await expect(page).toHaveURL(/\/perfil$/);
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible();

  await page.getByLabel(/club/i).fill('E2E Runners');
  await page.getByLabel(/contacto de emergencia/i).fill('Maria 600000001');
  await page.getByRole('button', { name: /guardar perfil/i }).click();

  await expect(page.getByText(/perfil guardado/i)).toBeVisible();
});

test.skip('pre Cognito smoke requires real Hosted UI credentials', async () => {
  // Manual/pre-only coverage:
  // 1. Sign in through Cognito Hosted UI.
  // 2. Verify GET /api/v1/me uses Authorization: Bearer <JWT>.
  // 3. Verify PATCH /api/v1/me preserves untouched fields.
});
