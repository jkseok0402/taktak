import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';
  const isLoginPage = request.nextUrl.pathname === '/login';

  // 로그인 페이지가 아니고 로그인되지 않은 경우
  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 이미 로그인된 상태에서 로그인 페이지 접근 시
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 