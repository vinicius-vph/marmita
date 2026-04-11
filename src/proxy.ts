import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);
const getSecret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detectar locale no path (en|es) e remover para verificar rota
  const localeMatch = pathname.match(/^\/(en|es)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : '';
  const stripped = locale ? pathname.slice(locale.length + 1) || '/' : pathname;
  const base = locale ? `/${locale}` : '';

  if (stripped.startsWith('/admin')) {
    const token = request.cookies.get('admin_session')?.value;

    if (stripped === '/admin/login') {
      if (token) {
        try {
          await jwtVerify(token, getSecret());
          return NextResponse.redirect(new URL(`${base}/admin`, request.url));
        } catch {
          // token inválido — deixa aceder ao login normalmente
        }
      }
      // intlMiddleware faz o rewrite interno para [locale]/admin/login
      return intlMiddleware(request);
    }

    if (!token) {
      return NextResponse.redirect(new URL(`${base}/admin/login`, request.url));
    }

    try {
      await jwtVerify(token, getSecret());
      // intlMiddleware faz o rewrite interno para [locale]/admin/...
      return intlMiddleware(request);
    } catch {
      return NextResponse.redirect(new URL(`${base}/admin/login`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
