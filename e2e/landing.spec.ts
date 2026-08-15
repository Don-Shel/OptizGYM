import { test, expect } from '@playwright/test';

test('landing page has title and call to action', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/OptizGYM/);

  const primaryCta = page.getByRole('link', { name: /start free trial/i });
  await expect(primaryCta).toBeVisible();
});

test('navigation links work', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Classes', exact: true }).click();
  await expect(page).toHaveURL(/\/classes/);

  await page.getByRole('link', { name: 'Trainers', exact: true }).click();
  await expect(page).toHaveURL(/\/trainers/);

  await page.getByRole('link', { name: 'Pricing', exact: true }).click();
  await expect(page).toHaveURL(/\/pricing/);
});
