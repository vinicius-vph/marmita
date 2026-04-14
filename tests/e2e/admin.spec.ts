import { test, expect } from '@playwright/test';

test.describe('Admin area', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: /Gestão|Management|Gestión/i })).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar|Sign in/i })).toBeVisible();
  });

  test('rejects wrong password', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('#password').fill('wrong-password-xyz');
    await page.getByRole('button', { name: /Entrar|Sign in/i }).click();
    // API may return "Invalid credentials", "Too many requests" (rate limit), or "Forbidden"
    // PT locale maps errorDefault to "Senha incorreta."
    await expect(page.getByText(/incorreta|incorrect|incorrecta|invalid|many|forbidden/i)).toBeVisible();
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
    // PT is default locale (no prefix); other locales redirect to /en or /es
    // toHaveURL matches against the full URL, so match against the path suffix
    await expect(page).toHaveURL(/\/(en|es)?\/?$/);
  });
});
