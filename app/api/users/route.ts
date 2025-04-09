import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // 모든 경기 결과 조회 (최근 경기 정보를 위해)
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        winner_id,
        loser_id,
        winner_sets,
        loser_sets,
        winner:winner_id(id, name),
        loser:loser_id(id, name)
      `)
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (matchesError) {
      throw matchesError;
    }

    // 선수별 최근 5경기 정보 계산
    const recentMatches: { [key: string]: IRecentMatch[] } = {};
    
    (users as IUser[]).forEach(user => {
      const typedMatches = matches as unknown as IMatchResponse[];
      recentMatches[user.id] = typedMatches
        .filter(match => match.winner_id === user.id || match.loser_id === user.id)
        .map(match => ({
          id: match.id,
          date: match.match_date,
          winner: match.winner.name,
          loser: match.loser.name,
          winnerSets: match.winner_sets,
          loserSets: match.loser_sets,
          isWin: match.winner_id === user.id
        }))
        .slice(0, 5);
    });

    // 선수 정보에 최근 5경기 정보 추가
    const playersWithStats = (users as IUser[]).map(user => ({
      ...user,
      recent_matches: recentMatches[user.id] || []
    }));

    return NextResponse.json({
      players: playersWithStats
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '선수 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 