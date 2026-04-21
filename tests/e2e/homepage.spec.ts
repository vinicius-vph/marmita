import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('serves PT locale at / without redirecting to /en', async ({ page }) => {
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
    await expect(page).not.toHaveURL(/\/en/);
  });

  test('renders header with logo and title', async ({ page }) => {
    await expect(page.getByRole('img', { name: /Igreja Baptista/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marmita Solidária' })).toBeVisible();
  });

  test('header logo links to home', async ({ page }) => {
    // next-intl Link renders href as "/" (PT default) or "/en", "/es" for other locales
    const homeLink = page.locator('header a').first();
    await expect(homeLink).toBeVisible();
  });

  test('shows category tabs', async ({ page }) => {
    await expect(page.getByText(/Refeições|Meals|Comidas/i)).toBeVisible();
    await expect(page.getByText(/Café da Manhã|Breakfast|Desayuno/i)).toBeVisible();
  });

  test('footer shows MBWay payment info with logo', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('img', { name: 'MB WAY' })).toBeVisible();
    await expect(footer.getByText(/MBWay|mbway/i)).toBeVisible();
  });

  test('footer admin link is visible and navigates to login', async ({ page }) => {
    const adminLink = page.locator('footer a[href*="admin"]');
    await expect(adminLink).toBeVisible();
    await adminLink.click();
    await expect(page).toHaveURL(/admin/);
  });

  test('language switcher is present', async ({ page }) => {
    // The switcher is a dropdown: the current locale (PT) is always visible as the trigger
    await expect(page.getByRole('button', { name: 'PT', exact: true })).toBeVisible();
    // Open the dropdown to check that EN is listed as an option
    await page.getByRole('button', { name: 'PT', exact: true }).click();
    await expect(page.getByRole('option', { name: 'EN' })).toBeVisible();
  });

  test('language switcher switches locale', async ({ page }) => {
    // Open dropdown then pick EN
    await page.getByRole('button', { name: 'PT', exact: true }).click();
    await page.getByRole('option', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en/);
    // Open dropdown again then pick PT
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await page.getByRole('option', { name: 'PT' }).click();
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });
});
