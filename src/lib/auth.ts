import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/env';
import { createAdminClient } from '@/lib/supabase/server';

const getSecret = () => new TextEncoder().encode(env.AUTH_SECRET);
export const COOKIE_NAME = 'admin_session';

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(crypto.randomUUID())
    .setExpirationTime('1h')
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== 'admin') return false;

    // SEC-11: check revocation denylist
    if (payload.jti) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('revoked_tokens')
        .select('jti')
        .eq('jti', payload.jti)
        .maybeSingle();
      if (data) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Returns the raw token string when valid, null otherwise.
// Callers can use truthiness check unchanged: if (!session) ...
export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const valid = await verifyAdminToken(token);
  return valid ? token : null;
}

// SEC-11: revoke a token by adding its JTI to the denylist.
export async function revokeAdminToken(token: string): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.jti || !payload.exp) return;

    const supabase = createAdminClient();
    await supabase.from('revoked_tokens').insert({
      jti: payload.jti,
      expires_at: new Date(payload.exp * 1000).toISOString(),
    });
  } catch {
    // Invalid token — nothing to revoke
  }
}

// SEC-08: verify the request Origin matches the server Host (CSRF defence-in-depth).
// Returns true when:
//   - the Origin header is absent (same-origin fetches may omit it)
//   - the Origin host matches the Host header
export function checkOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;

  const host = req.headers.get('host');
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
