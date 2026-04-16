import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { signAdminToken, COOKIE_NAME, checkOrigin } from '@/lib/auth';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/rate-limit';
import { env } from '@/env';

const MAX_BODY = 1_000; // 1 KB is plenty for a password payload

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`login:${ip}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }

  const text = await req.text();
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let password: string | undefined;
  try {
    ({ password } = JSON.parse(text));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const expectedBuf = Buffer.from(env.ADMIN_PASSWORD);
  const providedBuf = Buffer.from(typeof password === 'string' ? password : '');
  const passwordMatch =
    providedBuf.length === expectedBuf.length &&
    timingSafeEqual(expectedBuf, providedBuf);

  if (!password || !passwordMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  resetRateLimit(`login:${ip}`);
  const token = await signAdminToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
  });

  return NextResponse.json({ success: true });
}
