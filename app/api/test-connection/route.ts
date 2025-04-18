import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/supabase';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json(
        { success: true, message: 'Supabase 연결 성공' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Supabase 연결 실패' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Supabase 연결 테스트 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류 발생' },
      { status: 500 }
    );
  }
} 