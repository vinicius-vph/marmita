import { test, expect } from '@playwright/test';

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'Admin authentication required');
      return;
    }
  });

  test('renders reservations heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Reservas|Reservations|Reservas/i })).toBeVisible();
  });

  test('shows received and pending total cards', async ({ page }) => {
    await expect(page.getByText(/Recebido|Received|Recibido/i)).toBeVisible();
    await expect(page.getByText(/Pendente|Pending|Pendiente/i)).toBeVisible();
  });

  test('filter buttons All, Pending and Paid are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Todos|^All|^Todos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pendentes|Pending|Pendientes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Confirmados|Paid|Confirmados/i })).toBeVisible();
  });

  test('clicking Pending filter shows only pending reservations', async ({ page }) => {
    const pendingBtn = page.getByRole('button', { name: /Pendentes|Pending|Pendientes/i });
    await pendingBtn.click();

    // After filtering, no paid badges should be visible
    const paidBadges = page.locator('span').filter({ hasText: /✓ Pago|✓ Paid|✓ Pagado/i });
    await expect(paidBadges).toHaveCount(0);
  });

  test('confirm payment button changes reservation to paid', async ({ page }) => {
    const confirmBtn = page.getByRole('button', { name: /Confirmar pagamento|Confirm payment|Confirmar pago/i }).first();

    if (await confirmBtn.count() === 0) {
      test.skip(true, 'No pending reservations available');
      return;
    }

    await confirmBtn.click();

    // Button should disappear and paid badge appear in its place
    await expect(page.locator('span').filter({ hasText: /✓ Pago|✓ Paid|✓ Pagado/i }).first()).toBeVisible();
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

  test('export PDF and Excel buttons appear with reservations', async ({ page }) => {
    const pdfBtn = page.getByRole('button', { name: /Exportar PDF|Export PDF/i });
    const excelBtn = page.getByRole('button', { name: /Exportar Excel|Export Excel/i });
    const hasReservations = await page.getByRole('button', { name: /Confirmar pagamento|Confirm payment|Confirmar pago/i }).count();
    const hasPaidBadge = await page.locator('span').filter({ hasText: /✓ Pago|✓ Paid|✓ Pagado/i }).count();

    if (hasReservations === 0 && hasPaidBadge === 0) {
      await expect(pdfBtn).toBeDisabled();
      await expect(excelBtn).toBeDisabled();
    } else {
      await expect(pdfBtn).toBeVisible();
      await expect(pdfBtn).toBeEnabled();
      await expect(excelBtn).toBeVisible();
      await expect(excelBtn).toBeEnabled();
    }
  });
  test.describe('Contact privacy', () => {
    const showBtnName = /^Mostrar|^Show/i;
    const hideBtnName = /^Ocultar|^Hide/i;

    test('phone is masked by default and revealed on demand', async ({ page }) => {
      const showBtn = page.getByRole('button', { name: showBtnName }).first();
      if (await showBtn.count() === 0) {
        test.skip(true, 'No reservations available');
        return;
      }

      await expect(page.getByText(/^\d?•• ••• \d{3}$/).first()).toBeVisible();

      await showBtn.click();
      await expect(page.getByRole('button', { name: hideBtnName }).first()).toBeVisible();

      await page.getByRole('button', { name: hideBtnName }).first().click();
      await expect(page.getByRole('button', { name: hideBtnName })).toHaveCount(0);
    });

    test('reservations API never returns plaintext name or phone', async ({ request }) => {
      const res = await request.get('/api/reservations');
      expect(res.ok()).toBeTruthy();
      const rows = await res.json();
      for (const row of rows) {
        expect(row).not.toHaveProperty('customer_name');
        expect(row).not.toHaveProperty('customer_phone');
        expect(row.customer_phone_masked).toMatch(/•/);
      }
    });

    test('reveal endpoint requires admin session', async ({ playwright, baseURL }) => {
      const anon = await playwright.request.newContext({ baseURL });
      const res = await anon.post('/api/reservations/00000000-0000-4000-8000-000000000000/reveal', {
        headers: { Origin: baseURL! },
      });
      expect(res.status()).toBe(401);
      await anon.dispose();
    });
  });
});
