import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CORRECT_PIN = '121212';

export async function POST(request: Request) {
  const { pin } = await request.json();

  if (pin === CORRECT_PIN) {
    // 로그인 성공 시 쿠키 설정
    cookies().set('isLoggedIn', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600, // 1시간
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, error: '잘못된 PIN 번호입니다.' },
    { status: 401 }
  );
} 