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

  test('payment method field is visible and required', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
      return;
    }

    await expect(page.getByText(/Forma de pagamento|Payment method|Forma de pago/i)).toBeVisible();
    await expect(page.getByRole('radio', { name: /MBWay/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Numerário|Cash|Efectivo/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Transferência|Bank Transfer|Transferencia/i })).toBeVisible();
  });

  test('shows error when payment method is not selected', async ({ page }) => {
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
      return;
    }

    await page.getByLabel(/Nome completo|Full name|Nombre completo/i).fill('Maria Silva');
    await page.getByLabel(/Telefone|Phone|Teléfono/i).fill('912345678');
    await page.getByRole('button', { name: /Confirmar|Confirm/i }).click();
    await expect(page.getByText(/selecione a forma de pagamento|select a payment method|seleccione una forma de pago/i)).toBeVisible();
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

    // Use real API — reservation is created in the test database
    await page.getByLabel(/Nome completo|Full name|Nombre completo/i).fill('Maria Silva');
    await page.getByLabel(/Telefone|Phone|Teléfono/i).fill('912345678');
    await page.getByRole('radio', { name: /MBWay/i }).click();
    await page.getByRole('button', { name: /Confirmar|Confirm|Confirmar/i }).click();

    await page.waitForURL(/\/obrigado/);
    await expect(page).toHaveURL(/\/obrigado\?id=[0-9a-f-]{36}/);
  });
});

test.describe('/obrigado page', () => {
  test('redirects to home when no id param is given', async ({ page }) => {
    await page.goto('/obrigado');
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });

  test('redirects to home when id is invalid', async ({ page }) => {
    await page.goto('/obrigado?id=not-a-uuid');
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });

  test('full reservation flow shows thank you page with correct data', async ({ page }) => {
    await page.goto('/');
    const form = page.locator('form');
    if (await form.count() === 0) {
      test.skip(true, 'No menu items available');
      return;
    }

    await page.getByLabel(/Nome completo|Full name|Nombre completo/i).fill('Maria Silva');
    await page.getByLabel(/Telefone|Phone|Teléfono/i).fill('912345678');
    await page.getByRole('radio', { name: /MBWay/i }).click();
    await page.getByRole('button', { name: /Confirmar|Confirm|Confirmar/i }).click();

    await page.waitForURL(/\/obrigado\?id=/);

    await expect(page.getByRole('heading', { name: /Obrigado.*Maria|Thank you.*Maria|Gracias.*Maria/i })).toBeVisible();
    await expect(page.getByText(/Como pagar via MBWay|How to pay via MBWay|Cómo pagar/i)).toBeVisible();

    const backLink = page.getByRole('link', { name: /Voltar|Back|Volver/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });
});
