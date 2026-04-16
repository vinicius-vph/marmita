import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { verifyAdminToken } from '@/lib/auth';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const localeMatch = pathname.match(/^\/(en|es)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : '';
  const stripped = locale ? pathname.slice(locale.length + 1) || '/' : pathname;
  const base = locale ? `/${locale}` : '';

  if (stripped.startsWith('/admin')) {
    const token = request.cookies.get('admin_session')?.value;

    if (stripped === '/admin/login') {
      if (token && await verifyAdminToken(token)) {
        return NextResponse.redirect(new URL(`${base}/admin`, request.url));
      }
      return intlMiddleware(request);
    }

    if (!token || !await verifyAdminToken(token)) {
      return NextResponse.redirect(new URL(`${base}/admin/login`, request.url));
    }

    return intlMiddleware(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
