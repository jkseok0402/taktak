import { NextResponse } from 'next/server';
import { supabase } from '@/db';

// 동적 라우트 설정
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, stats } = body;

    // player_stats 테이블 업데이트
    const { error } = await supabase
      .from('player_stats')
      .upsert({
        player_id: playerId,
        ...stats,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating player stats:', error);
    return NextResponse.json(
      { error: '선수 통계 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
} 