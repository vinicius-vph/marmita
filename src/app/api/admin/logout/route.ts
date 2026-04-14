import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, getAdminSession, revokeAdminToken } from '@/lib/auth';

export async function POST() {
  const token = await getAdminSession();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // SEC-11: add token to denylist so it cannot be reused even before expiry
  await revokeAdminToken(token);

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ success: true });
}
