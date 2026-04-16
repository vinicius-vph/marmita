import { test, expect } from '@playwright/test';

test.describe('Admin fundraising settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/meta');
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'Admin authentication required');
      return;
    }
  });

  test('renders fundraising objective heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Objetivo de Angariação|Fundraising Goal|Objetivo de Recaudación/i })).toBeVisible();
  });

  test('shows raised, goal and missing summary cards', async ({ page }) => {
    await expect(page.getByText(/Angariado|Raised|Recaudado/i).first()).toBeVisible();
    await expect(page.getByText(/Objetivo|Goal|Objetivo/i).first()).toBeVisible();
    await expect(page.getByText(/Falta|Missing|Falta/i).first()).toBeVisible();
  });

  test('form has campaign, goal amount and raised amount fields', async ({ page }) => {
    await expect(page.getByLabel(/Nome da campanha|Campaign|Nombre de la campaña/i)).toBeVisible();
    await expect(page.getByLabel(/Valor do objetivo|Goal amount|Valor del objetivo/i)).toBeVisible();
    await expect(page.getByLabel(/Valor já angariado|Amount raised|Valor ya recaudado/i)).toBeVisible();
  });

  test('save button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Atualizar objetivo|Update goal|Actualizar objetivo/i })).toBeVisible();
  });

  test('updating campaign label shows success message', async ({ page }) => {
    const campaignInput = page.getByLabel(/Nome da campanha|Campaign|Nombre de la campaña/i);
    const currentValue = await campaignInput.inputValue();

    // Append a marker to the current value and save
    await campaignInput.fill(currentValue + ' Test');
    await page.getByRole('button', { name: /Atualizar objetivo|Update goal|Actualizar objetivo/i }).click();

    await expect(page.getByText(/sucesso|success|éxito/i)).toBeVisible();

    // Restore original value
    await campaignInput.fill(currentValue);
    await page.getByRole('button', { name: /Atualizar objetivo|Update goal|Actualizar objetivo/i }).click();
  });

  test('category toggle switches to breakfast', async ({ page }) => {
    const breakfastBtn = page.getByRole('button', { name: /Café|Breakfast|Desayuno/i });
    if (await breakfastBtn.count() === 0) {
      test.skip(true, 'Category toggle not available');
      return;
    }
    await breakfastBtn.click();
    await expect(page).toHaveURL(/category=breakfast/);
  });
});
