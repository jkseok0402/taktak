import { NextResponse } from 'next/server';
import { supabase } from '@/db';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // 1. 모든 선수 데이터 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('level', { ascending: true });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: '선수 정보를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    // 2. 모든 매치 정보 가져오기
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        winner_id,
        loser_id,
        winner_sets,
        loser_sets,
        match_date
      `)
      .order('match_date', { ascending: false });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: '매치 정보를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    // 3. 각 선수별 통계 계산
    const playerStats = users.map(user => {
      // 해당 선수의 모든 경기
      const userMatches = matches.filter(match => 
        match.winner_id === user.id || match.loser_id === user.id
      );

      // 승/패 계산
      const wins = userMatches.filter(match => match.winner_id === user.id).length;
      const losses = userMatches.filter(match => match.loser_id === user.id).length;
      const totalGames = wins + losses;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      // 세트 승/패 계산
      const setsWon = userMatches.reduce((sum, match) => 
        sum + (match.winner_id === user.id ? match.winner_sets : match.loser_sets), 0
      );
      const setsLost = userMatches.reduce((sum, match) => 
        sum + (match.winner_id === user.id ? match.loser_sets : match.winner_sets), 0
      );

      return {
        id: user.id,
        name: user.name,
        level: user.level,
        wins,
        losses,
        winRate,
        setsWon,
        setsLost,
        totalGames
      };
    });

    // 승률 기준으로 정렬
    const sortedStats = playerStats.sort((a, b) => {
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return b.totalGames - a.totalGames;  // 승률이 같으면 경기수가 많은 순
    });

    return NextResponse.json(sortedStats);

  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return NextResponse.json({ error: '통계를 불러오는데 실패했습니다.' }, { status: 500 });
  }
} 