import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  const token = await signAdminToken();
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 8}`,
    'Path=/',
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieOptions,
    },
  });
}
