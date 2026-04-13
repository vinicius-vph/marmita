import { test, expect } from '@playwright/test';

test.describe('Admin area', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: /Gestão|Management|Gestión/i })).toBeVisible();
    await expect(page.getByPlaceholder(/senha|password|contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar|Sign in/i })).toBeVisible();
  });

  test('rejects wrong password', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByPlaceholder(/senha|password|contraseña/i).fill('wrong-password-xyz');
    await page.getByRole('button', { name: /Entrar|Sign in/i }).click();
    await expect(page.getByText(/incorreta|incorrect|incorrecta/i)).toBeVisible();
  });

  test('redirects unauthenticated admin access to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/admin\/login/);
  });

  test('back to site link works from login', async ({ page }) => {
    await page.goto('/admin/login');
    const backLink = page.getByText(/Voltar|Back|Volver/i);
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });
});
