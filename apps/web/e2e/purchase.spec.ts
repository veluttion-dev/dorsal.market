import { expect, test } from '@playwright/test';
import { signInAsDemoUser } from './helpers/auth';

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440002';

test('buyer can reserve a dorsal and open transaction tracking', async ({ page }) => {
  await signInAsDemoUser(page, {
    userId: BUYER_USER_ID,
    name: 'Ana Buyer',
    email: 'ana.buyer@dorsal.market',
  });

  await page.goto('/dorsales?race_name=madrid');
  const firstDorsal = page.locator('a[href^="/dorsales/"]').first();
  await expect(firstDorsal).toBeVisible();
  await firstDorsal.click();

  await page.getByRole('link', { name: /comprar dorsal/i }).click();
  await expect(page).toHaveURL(/\/compra\/checkout\/[a-f0-9-]+$/);
  await expect(page.getByRole('heading', { name: /reserva tu dorsal/i })).toBeVisible();

  await page.getByRole('button', { name: /simular pago/i }).click();
  await expect(page).toHaveURL(/\/compra\/confirmada\?tx=/);
  await expect(page.getByRole('heading', { name: /compra confirmada/i })).toBeVisible();
  await expect(page.getByText(/estado actual: pago recibido/i)).toBeVisible();

  await page.getByRole('link', { name: /ver seguimiento/i }).click();
  await expect(page).toHaveURL(/\/compra\/[a-f0-9-]+$/);
  await expect(page.getByRole('heading', { name: /seguimiento/i })).toBeVisible();
  await expect(page.getByText('Pago confirmado')).toBeVisible();
});
