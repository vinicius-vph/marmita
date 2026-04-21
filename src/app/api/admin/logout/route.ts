import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, getAdminSession, revokeAdminToken, checkOrigin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const token = await getAdminSession();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  try {
    await revokeAdminToken(token);
  } catch (err) {
    console.error('Token revocation failed during logout:', err);
    return NextResponse.json({ error: 'Logout incomplete: token revocation failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
