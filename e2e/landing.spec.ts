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


test('footer links provide working destinations', async ({ page }) => {
  await page.goto('/');

  const footer = page.locator('footer');
  for (const [label, href] of [
    ['About Us', '/about'],
    ['Careers', '/careers'],
    ['Press', '/press'],
    ['Blog', '/blog'],
    ['Contact Center', '/contact'],
    ['Terms of Service', '/terms'],
    ['Privacy Policy', '/privacy'],
    ['FAQs', '/faqs'],
  ]) {
    await expect(footer.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href);
  }

  await footer.getByRole('link', { name: 'Privacy', exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { name: 'Privacy Policy.' })).toBeVisible();
});
