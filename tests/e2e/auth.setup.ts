import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // Write empty state so dependent projects don't fail to load it
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto('/admin/login');
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Entrar|Sign in/i }).click();

  // Successful login redirects to /admin (with optional locale prefix)
  await page.waitForURL(/\/admin$/, { timeout: 10_000 });

  await page.context().storageState({ path: authFile });
});
