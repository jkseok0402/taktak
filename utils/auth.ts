import { cookies } from 'next/headers';

export function setLoginCookie() {
  const cookieStore = cookies();
  cookieStore.set('isLoggedIn', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
}

export function removeLoginCookie() {
  const cookieStore = cookies();
  cookieStore.delete('isLoggedIn');
}

export function isLoggedIn() {
  const cookieStore = cookies();
  return cookieStore.get('isLoggedIn')?.value === 'true';
} 