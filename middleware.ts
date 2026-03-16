import { NextRequest, NextResponse } from 'next/server';

const locales = ['de', 'en', 'es'];
const defaultLocale = 'de';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ─── Domain Redirect: stoneartinstallation.com → akurock.com ───
  // Redirect all traffic from stoneartinstallation.com (and www.) to akurock.com
  if (
    hostname.includes('stoneartinstallation.com') ||
    hostname.includes('stoneartinstallation.at') ||
    hostname.includes('stonearts-installation.com')
  ) {
    const redirectUrl = new URL(`https://www.akurock.com${pathname}`);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl, 301);
  }

  // ─── Admin Auth Gate ───
  // Protect /admin and /api/admin/* with HTTP Basic Auth
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return new NextResponse('Admin access not configured. Set ADMIN_PASSWORD environment variable.', {
        status: 503,
      });
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="stonearts Admin"' },
      });
    }

    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = atob(base64Credentials);
      const [, password] = credentials.split(':');

      if (password !== adminPassword) {
        return new NextResponse('Invalid credentials', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="stonearts Admin"' },
        });
      }
    } catch {
      return new NextResponse('Invalid authorization header', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="stonearts Admin"' },
      });
    }

    // Auth passed — let the request through
    return NextResponse.next();
  }

  // ─── Static File / API Skip ───
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/js') ||
    pathname.startsWith('/css') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/data') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(svg|ico|png|jpg|jpeg|webp|mp4|webm|json|css|js|woff|woff2|ttf|eot|xml|txt)$/)
  ) {
    return NextResponse.next();
  }

  // ─── Locale Routing ───
  // Check if path already has a locale prefix
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Detect preferred locale from Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  let detectedLocale = defaultLocale;
  for (const locale of locales) {
    if (acceptLanguage.toLowerCase().includes(locale)) {
      detectedLocale = locale;
      break;
    }
  }

  // Redirect to locale-prefixed URL
  const newUrl = new URL(`/${detectedLocale}${pathname === '/' ? '' : pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    // Match all paths except _next internals, static files, etc.
    '/((?!_next|images|js|css|fonts|videos|documents|data|public|.*\\..*).*)',
  ],
};
