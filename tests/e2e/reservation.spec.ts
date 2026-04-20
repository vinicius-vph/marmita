import { test, expect } from '@playwright/test';

test.describe('Reservation flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('reservation section is visible when meals exist', async ({ page }) => {
    const hasForm = await page.locator('form').count();
    const hasNoMeals = await page.getByText(/Não há refeições|No meals|No hay/i).count();
    expect(hasForm + hasNoMeals).toBeGreaterThan(0);
  });

  test('validates required fields before submission', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
      return;
    }

    await page.getByRole('button', { name: /Confirmar|Confirm|Confirmar/i }).click();
    await expect(page.getByText(/nome|name/i)).toBeVisible();
  });

  test('validates name minimum length', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
      return;
    }

    await page.getByLabel(/Nome completo|Full name|Nombre completo/i).fill('AB');
    await page.getByLabel(/Telefone|Phone|Teléfono/i).fill('912345678');
    await page.getByRole('button', { name: /Confirmar|Confirm|Confirmar/i }).click();
    await expect(page.getByText(/Por favor insira o seu nome|Please enter your full|Por favor ingrese su nombre/i)).toBeVisible();
  });

  test('validates phone minimum digits', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
      return;
    }

    await page.getByLabel(/Nome completo|Full name|Nombre completo/i).fill('Maria Silva');
    await page.getByLabel(/Telefone|Phone|Teléfono/i).fill('12345');
    await page.getByRole('button', { name: /Confirmar|Confirm|Confirmar/i }).click();
    await expect(page.getByText(/Por favor insira um número|Please enter a valid phone|Por favor ingrese un número/i)).toBeVisible();
  });

  test('quantity stepper increments and decrements', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
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

  test('submits reservation and redirects to /obrigado', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
      return;
    }

    // Mock API to avoid creating real reservations in the database
    await page.route('/api/reservations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test-id', total_amount: 5.5 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByLabel(/Nome completo|Full name|Nombre completo/i).fill('Maria Silva');
    await page.getByLabel(/Telefone|Phone|Teléfono/i).fill('912345678');
    await page.getByRole('button', { name: /Confirmar|Confirm|Confirmar/i }).click();

    await page.waitForURL(/\/obrigado/);
    await expect(page).toHaveURL(/\/obrigado/);
    await expect(page).toHaveURL(/nome=Maria/);
  });
});

test.describe('/obrigado page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/obrigado?nome=Maria+Silva&prato=Frango+Assado&quantidade=2&total=11&categoria=meals');
  });

  test('shows thank you heading with customer name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Obrigado.*Maria|Thank you.*Maria|Gracias.*Maria/i })).toBeVisible();
  });

  test('shows reservation summary with dish, quantity and total', async ({ page }) => {
    await expect(page.getByText(/Frango Assado/)).toBeVisible();
    await expect(page.getByText(/2x/)).toBeVisible();
    // Total formatted: 11,00 € or similar
    await expect(page.getByText(/11/)).toBeVisible();
  });

  test('shows MBWay payment guide', async ({ page }) => {
    await expect(page.getByText(/Como pagar via MBWay|How to pay via MBWay|Cómo pagar/i)).toBeVisible();
  });

  test('has link back to homepage', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Voltar|Back|Volver/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });

  test('header shows language switcher', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'PT', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();
  });
});
