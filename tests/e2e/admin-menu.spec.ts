import { test, expect } from '@playwright/test';

test.describe('Admin menu management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/menu');
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'Admin authentication required');
      return;
    }
  });

  test('renders menu heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Menu Semanal|Weekly Menu|Menú Semanal/i })).toBeVisible();
  });

  test('add dish button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Adicionar prato|Add dish|Añadir plato/i })).toBeVisible();
  });

  test('clicking add dish button shows the form', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar prato|Add dish|Añadir plato/i }).click();
    await expect(page.getByRole('heading', { name: /Adicionar Prato|Add Dish|Añadir Plato/i })).toBeVisible();
    await expect(page.getByLabel(/Nome|Name|Nombre/i)).toBeVisible();
    await expect(page.getByLabel(/Preço|Price|Precio/i)).toBeVisible();
  });

  test('cancelling the add form restores the add button', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar prato|Add dish|Añadir plato/i }).click();
    await page.getByRole('button', { name: /Cancelar|Cancel|Cancelar/i }).click();
    await expect(page.getByRole('button', { name: /Adicionar prato|Add dish|Añadir plato/i })).toBeVisible();
  });

  test('remove dish shows inline confirmation', async ({ page }) => {
    const removeBtn = page.getByRole('button', { name: /Remover|Remove|Eliminar/i }).first();
    if (await removeBtn.count() === 0) {
      test.skip(true, 'No dishes available to test delete confirmation');
      return;
    }

    await removeBtn.click();
    await expect(page.getByRole('button', { name: /Sim, remover|Yes, remove|Sí, eliminar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancelar|Cancel|Cancelar/i })).toBeVisible();

    // Cancelling dismisses confirmation without deleting
    await page.getByRole('button', { name: /Cancelar|Cancel|Cancelar/i }).click();
    await expect(page.getByRole('button', { name: /Remover|Remove|Eliminar/i }).first()).toBeVisible();
  });

  test('edit dish shows form pre-filled', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /Editar|Edit|Editar/i }).first();
    if (await editBtn.count() === 0) {
      test.skip(true, 'No dishes available to test edit');
      return;
    }

    await editBtn.click();
    await expect(page.getByRole('heading', { name: /Editar Prato|Edit Dish|Editar Plato/i })).toBeVisible();

    // Name field should have a value (pre-filled)
    const nameInput = page.getByLabel(/Nome|Name|Nombre/i);
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
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
