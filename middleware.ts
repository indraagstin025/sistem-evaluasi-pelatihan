import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-token';

const PUBLIC_PAGE_PREFIXES = [
  '/login',
  '/unggah-inovasi',
  '/pasca-pelatihan/unggah-inovasi',
];

const PUBLIC_API_PREFIXES = ['/api/auth/login', '/api/auth/logout', '/api/public'];

const ADMIN_ONLY_KEGIATAN_SUBROUTES = [
  '/input-data',
  '/pembagian-tim',
  '/pantau-wawancara',
  '/perbandingan',
  '/ekspose',
  '/hasil-survei',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg' ||
    pathname === '/logo-jabar.png' ||
    PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  const rawToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(rawToken);

  if (PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (pathname === '/login' && session) {
      const target = session.mustChangePassword ? '/ganti-sandi' : '/kegiatan';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Autentikasi diperlukan. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '/login') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Wajib ganti sandi sebelum mengakses menu aplikasi
  if (session.mustChangePassword) {
    const allowedApiWhenPending = [
      '/api/auth/me',
      '/api/auth/change-password',
      '/api/auth/logout',
    ];
    if (pathname.startsWith('/api/')) {
      if (allowedApiWhenPending.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.json(
        { success: false, error: 'Wajib mengganti kata sandi awal terlebih dahulu.' },
        { status: 403 }
      );
    }
    if (pathname !== '/ganti-sandi') {
      return NextResponse.redirect(new URL('/ganti-sandi', request.url));
    }
    return NextResponse.next();
  }

  // Batasi rute halaman khusus Super Admin dari Evaluator (route /api tetap ditangani guard JSON 403)
  if (!pathname.startsWith('/api/') && session.role === 'EVALUATOR') {
    const isAdminPage =
      pathname.startsWith('/pengguna') ||
      ADMIN_ONLY_KEGIATAN_SUBROUTES.some((sub) => pathname.includes(sub));
    if (isAdminPage) {
      return NextResponse.redirect(new URL('/kegiatan', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
