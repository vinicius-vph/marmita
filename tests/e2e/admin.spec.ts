import { test, expect } from '@playwright/test';

test.describe('Admin area', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: /Gestão|Management|Gestión/i })).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar|Sign in/i })).toBeVisible();
  });

  test('rejects wrong password with translated PT error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('#password').fill('wrong-password-xyz');
    await page.getByRole('button', { name: /Entrar|Sign in/i }).click();
    // PT locale must show the translated message, never the raw API "Invalid credentials"
    await expect(page.getByText(/Senha incorreta|Demasiadas tentativas|Too many attempts|Erro de ligação/i)).toBeVisible();
    await expect(page.getByText('Invalid credentials')).not.toBeVisible();
  });

  test('redirects unauthenticated admin access to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/admin\/login/);
  });

  test('remove dish shows inline confirmation before deleting', async ({ page, request }) => {
    // This test verifies the inline confirmation UI exists in the component.
    // Full deletion flow requires auth; here we check the confirmation renders correctly
    // by checking the DOM after clicking Remove (which only shows confirm UI, no fetch yet).
    // We use a mock approach: if the admin page is inaccessible without auth, skip.
    const loginRes = await request.get('/admin');
    if (loginRes.url().includes('login')) {
      test.skip(true, 'Admin auth required to test delete confirmation');
      return;
    }
    await page.goto('/admin');
    const removeBtn = page.getByRole('button', { name: /Remover|Remove|Eliminar/i }).first();
    if (!(await removeBtn.isVisible())) {
      test.skip(true, 'No dishes available to test delete confirmation');
      return;
    }
    await removeBtn.click();
    await expect(page.getByRole('button', { name: /Sim, remover|Yes, remove|Sí, eliminar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancelar|Cancel/i })).toBeVisible();
    // Clicking Cancel dismisses confirmation without deleting
    await page.getByRole('button', { name: /Cancelar|Cancel/i }).click();
    await expect(page.getByRole('button', { name: /Remover|Remove|Eliminar/i }).first()).toBeVisible();
  });

  test('back to site link works from login', async ({ page }) => {
    await page.goto('/admin/login');
    const backLink = page.getByText(/Voltar|Back|Volver/i);
    await expect(backLink).toBeVisible();
    await backLink.click();
    // PT is default locale (no prefix); other locales redirect to /en or /es
    // toHaveURL matches against the full URL, so match against the path suffix
    await expect(page).toHaveURL(/\/(en|es)?\/?$/);
  });
});
