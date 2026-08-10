import i18nConfig from '@app/i18nConfig';
import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';

import { envs } from '../middleware-envs';

export async function proxy(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  if (pathname === '/admin') {
    return NextResponse.redirect(new URL(envs.adminUrl));
  }

  if (envs.protectedRoutes.includes(pathname)) {
    const cookieName = 'connect.sid';
    const token = req.cookies.get(cookieName)?.value ?? '';

    const response = await fetch(`${envs.apiUrl}/me`, {
      cache: 'no-cache',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: `${cookieName}=${encodeURIComponent(token)}`,
      },
    });

    if (response.status === 401) {
      const loginUrl = new URL(`${envs.basePath}/login`, origin);
      loginUrl.searchParams.set('path', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  req.headers.set('x-path', pathname);
  return i18nRouter(req, i18nConfig);
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
};
