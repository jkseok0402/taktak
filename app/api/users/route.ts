import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface IUser {
  id: string;
  name: string;
  level: number;
}

interface IMatchResponse {
  id: string;
  match_date: string;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  winner: {
    id: string;
    name: string;
  };
  loser: {
    id: string;
    name: string;
  };
}

interface IRecentMatch {
  id: string;
  date: string;
  winner: string;
  loser: string;
  winnerSets: number;
  loserSets: number;
  isWin: boolean;
}

export async function GET() {
  try {
    // 모든 선수 정보 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (usersError) {
      throw usersError;
    }

    return new NextResponse(
      JSON.stringify({ players: users }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching players:', error);
    return new NextResponse(
      JSON.stringify({ error: '선수 목록을 가져오는데 실패했습니다.' }),
      { status: 500 }
    );
  }
} 