import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getSecret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    const token = request.cookies.get('admin_session')?.value;
    if (token) {
      try {
        await jwtVerify(token, getSecret());
        return NextResponse.redirect(new URL('/admin', request.url));
      } catch {
        // token inválido — deixa aceder ao login normalmente
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
