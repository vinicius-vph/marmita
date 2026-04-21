import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const WRONG_PASSWORD = 'wrong-password-for-rate-limit-test';
const MAX_ATTEMPTS = 5;

// Each test gets a unique fake IP so DB state never bleeds between runs.
// getClientIp() reads x-real-ip, which we control here.
function uniqueIp() {
  return `10.test.${Date.now()}.${Math.floor(Math.random() * 65535)}`;
}

async function postLogin(request: APIRequestContext, password: string, ip: string) {
  return request.post('/api/admin/login', {
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
      'x-real-ip': ip,
    },
    data: JSON.stringify({ password }),
  });
}

test.describe('Rate limit', () => {
  test.skip(!!process.env.CI, 'Rate limit is disabled in CI (RATE_LIMIT_DISABLED=true)');

  test('blocks login after exceeding max attempts', async ({ page, request }) => {
    const ip = uniqueIp();

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const res = await postLogin(request, WRONG_PASSWORD, ip);
      expect(res.status()).toBe(401);
    }

    const blocked = await postLogin(request, WRONG_PASSWORD, ip);
    expect(blocked.status()).toBe(429);
    expect(blocked.headers()['retry-after']).toBeTruthy();

    // UI must display the translated rate-limit error message
    await page.goto('/admin/login');
    await page.setExtraHTTPHeaders({ 'x-real-ip': ip });
    await page.locator('#password').fill(WRONG_PASSWORD);
    await page.getByRole('button', { name: /Entrar|Sign in/i }).click();
    await expect(
      page.getByText(/Demasiadas tentativas|Too many attempts|Demasiados intentos/i),
    ).toBeVisible();
  });

  test('successful login resets the attempt counter', async ({ page, request }) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      test.skip(true, 'ADMIN_PASSWORD env var required for this test');
      return;
    }

    const ip = uniqueIp();

    // Burn 4 out of 5 allowed attempts
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      await postLogin(request, WRONG_PASSWORD, ip);
    }

    // Login with the correct password — should succeed and reset the counter
    const ok = await postLogin(request, adminPassword, ip);
    expect(ok.status()).toBe(200);

    // After reset, a wrong-password attempt should return 401, not 429
    const after = await postLogin(request, WRONG_PASSWORD, ip);
    expect(after.status()).toBe(401);

    // UI must show the credential error, not the rate-limit error
    await page.goto('/admin/login');
    await page.setExtraHTTPHeaders({ 'x-real-ip': ip });
    await page.locator('#password').fill(WRONG_PASSWORD);
    await page.getByRole('button', { name: /Entrar|Sign in/i }).click();
    await expect(
      page.getByText(/Senha incorreta|Invalid credentials|Contraseña incorrecta/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Demasiadas tentativas|Too many attempts|Demasiados intentos/i),
    ).not.toBeVisible();
  });
});
