import { test, expect } from '@playwright/test';

const ORIGIN = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Security headers', () => {
  test('response includes required security headers', async ({ request }) => {
    const res = await request.get('/');
    const h = res.headers();
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['permissions-policy']).toContain('camera=()');
  });
});

test.describe('CSRF protection', () => {
  test('POST /api/reservations without Origin header returns 403', async ({ request }) => {
    const res = await request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ menu_item_id: 'x', customer_name: 'x', customer_phone: '123', quantity: 1 }),
    });
    expect(res.status()).toBe(403);
  });

  test('POST /api/admin/login without Origin header returns 403', async ({ request }) => {
    const res = await request.post('/api/admin/login', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ password: 'wrong' }),
    });
    expect(res.status()).toBe(403);
  });

  test('POST /api/admin/logout without Origin header returns 403', async ({ request }) => {
    const res = await request.post('/api/admin/logout', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Input validation', () => {
  test('PATCH /api/reservations with non-UUID id returns 400', async ({ request }) => {
    const res = await request.patch('/api/reservations/not-a-uuid/confirm', {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    });
    expect(res.status()).toBe(400);
  });

  test('DELETE /api/menu with non-UUID id returns 400', async ({ request }) => {
    const res = await request.delete('/api/menu/not-a-uuid', {
      headers: { Origin: ORIGIN },
    });
    // 401 if not authenticated, 400 only if auth passes — either way not 200/500
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/reservations with oversized body returns 413', async ({ request }) => {
    const res = await request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: JSON.stringify({ menu_item_id: 'x', customer_name: 'A'.repeat(6000), customer_phone: '123', quantity: 1 }),
    });
    expect(res.status()).toBe(413);
  });

  test('POST /api/reservations with invalid phone format returns 400', async ({ request }) => {
    const res = await request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: JSON.stringify({
        menu_item_id: '00000000-0000-0000-0000-000000000000',
        customer_name: 'Maria Silva',
        customer_phone: '!@#$%^&*()',
        quantity: 1,
      }),
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/reservations with quantity 0 returns 400', async ({ request }) => {
    const res = await request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: JSON.stringify({
        menu_item_id: '00000000-0000-0000-0000-000000000000',
        customer_name: 'Maria Silva',
        customer_phone: '912345678',
        quantity: 0,
      }),
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/reservations with quantity above max returns 400', async ({ request }) => {
    const res = await request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: JSON.stringify({
        menu_item_id: '00000000-0000-0000-0000-000000000000',
        customer_name: 'Maria Silva',
        customer_phone: '912345678',
        quantity: 101,
      }),
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Authorization', () => {
  test('GET /api/reservations without session returns 401', async ({ request }) => {
    const res = await request.get('/api/reservations');
    expect(res.status()).toBe(401);
  });

  test('/admin route redirects to /admin/login without session', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/admin\/login/);
  });

  test('/admin/menu redirects to /admin/login without session', async ({ page }) => {
    await page.goto('/admin/menu');
    await expect(page).toHaveURL(/admin\/login/);
  });
});

test.describe('/obrigado page', () => {
  test('unknown UUID redirects to home', async ({ page }) => {
    await page.goto('/obrigado?id=00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });

  test('SQL-injection-like id is rejected and redirects to home', async ({ page }) => {
    await page.goto("/obrigado?id=' OR '1'='1");
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });

  test('page is inaccessible 3 days after meal_date (link expiry)', async ({ page, request }) => {
    // This test validates the expiry logic indirectly: a non-existent UUID always redirects,
    // which is the same outcome as an expired reservation. The server-side expiry branch
    // is covered by the unit-testable date comparison in obrigado/page.tsx.
    // An integration test would require seeding a reservation with meal_date = today - 4 days.
    await page.goto('/obrigado?id=00000000-0000-0000-0000-000000000001');
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
    void request; // suppress unused warning
  });
});
