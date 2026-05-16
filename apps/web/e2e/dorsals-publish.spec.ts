import path from 'node:path';
import { expect, test } from '@playwright/test';

test('publishing a dorsal redirects to its detail page', async ({ page }) => {
  await page.goto('/vender');

  await page.setInputFiles('input[type="file"]', path.join(__dirname, 'fixtures/dorsal.jpg'));
  // Wait for the upload to resolve (preview replaces the dropzone).
  await expect(page.getByAltText('Vista previa del dorsal')).toBeVisible();

  await page.fill('#race_name', 'E2E Race');
  await page.fill('#bib_number', '999');
  await page.fill('#race_date', '2027-06-01');
  await page.fill('#location', 'Madrid');
  await page.selectOption('#distance', '10k');
  await page.fill('#price_amount', '40');
  await page.getByText('Bizum').click();
  await page.fill('#contact_phone', '600000000');

  await page.getByRole('button', { name: 'Publicar dorsal' }).click();
  await page.waitForURL(/\/dorsales\/[a-f0-9-]+$/);
  await expect(page.getByText('E2E Race')).toBeVisible();
});
