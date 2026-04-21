import type { NextRequest } from 'next/server';

const store = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: NextRequest): string {
  // X-Forwarded-For is client-controllable and cannot be trusted without a
  // validated proxy in front. Only x-real-ip is safe (set by Nginx / platform).
  // In development (no proxy) all requests fall back to 'unknown', which still
  // correctly enforces the per-bucket rate limit across all local attempts.
  return req.headers.get('x-real-ip')?.trim() ?? 'unknown';
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

export function checkRateLimit(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
