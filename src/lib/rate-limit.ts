import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export function getClientIp(req: NextRequest): string {
  // X-Forwarded-For is client-controllable and cannot be trusted without a
  // validated proxy in front. Only x-real-ip is safe (set by Nginx / platform).
  // In development (no proxy) all requests fall back to 'unknown', which still
  // correctly enforces the per-bucket rate limit across all local attempts.
  return req.headers.get('x-real-ip')?.trim() ?? 'unknown';
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

export async function checkRateLimit(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (process.env.RATE_LIMIT_DISABLED === 'true') return { allowed: true };

  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { count, error: countError } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gt('attempted_at', windowStart);

  if (countError) {
    // Fail open to avoid locking out users on DB errors
    return { allowed: true };
  }

  if ((count ?? 0) >= maxAttempts) {
    const { data: oldest } = await supabase
      .from('login_attempts')
      .select('attempted_at')
      .eq('key', key)
      .gt('attempted_at', windowStart)
      .order('attempted_at', { ascending: true })
      .limit(1)
      .single();

    const retryAfter = oldest
      ? Math.ceil((new Date(oldest.attempted_at).getTime() + windowMs - Date.now()) / 1000)
      : windowMs / 1000;

    return { allowed: false, retryAfter };
  }

  await supabase.from('login_attempts').insert({ key });

  // Fire-and-forget cleanup of expired rows
  supabase
    .from('login_attempts')
    .delete()
    .lt('attempted_at', windowStart)
    .then(() => {});

  return { allowed: true };
}

export async function resetRateLimit(key: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from('login_attempts').delete().eq('key', key);
}
