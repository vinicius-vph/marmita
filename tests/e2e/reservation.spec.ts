import { test, expect } from '@playwright/test';

test.describe('Reservation flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('reservation section is visible when meals exist', async ({ page }) => {
    // If there are menu items, the form should be visible
    const hasForm = await page.locator('form').count();
    const hasNoMeals = await page.getByText(/Não há refeições|No meals|No hay/i).count();

    // One or the other should be present
    expect(hasForm + hasNoMeals).toBeGreaterThan(0);
  });

  test('validates required fields before submission', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip();
      return;
    }

    // Try to submit without filling name
    await page.getByRole('button', { name: /Confirmar|Confirm|Confirmar/i }).click();
    // Should show error about name
    await expect(page.getByText(/nome|name/i)).toBeVisible();
  });

  test('quantity stepper increments and decrements', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip();
      return;
    }

    const quantityDisplay = page.locator('span').filter({ hasText: /^1$/ }).first();
    const incrementBtn = page.getByRole('button', { name: '+' });
    const decrementBtn = page.getByRole('button', { name: '−' });

    await expect(quantityDisplay).toBeVisible();
    await incrementBtn.click();
    await expect(page.locator('span').filter({ hasText: /^2$/ }).first()).toBeVisible();
    await decrementBtn.click();
    await expect(page.locator('span').filter({ hasText: /^1$/ }).first()).toBeVisible();
  });
});
