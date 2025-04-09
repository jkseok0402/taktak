import { NextResponse } from 'next/server';
import { supabase } from '@/db';

export const dynamic = 'force-dynamic'
export const revalidate = 0

// 대시보드 데이터 조회 API
export async function GET() {
  try {
    console.log('대시보드 API 호출 시작');

    // 1. 모든 선수 데이터 가져오기
    const { data: players, error: playersError } = await supabase
      .from('users')
      .select('*')
      .order('level', { ascending: true });

    if (playersError) {
      console.error('선수 데이터 조회 오류:', playersError);
      return NextResponse.json(
        { error: '선수 데이터를 불러오는데 실패했습니다.', details: playersError },
        { status: 500 }
      );
    }

    console.log('선수 데이터 조회 완료:', players?.length || 0, '명');

    if (!players || players.length === 0) {
      console.log('등록된 선수가 없습니다.');
      return NextResponse.json({
        totalMatches: 0,
        totalPlayers: 0,
        matchDateRange: { first: null, last: null },
        highestWinRate: null,
        lowestWinRate: null,
        highestStreak: null,
        lowestStreak: null,
        playerStats: []
      });
    }

    // 2. 모든 경기 데이터 가져오기
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });

    if (matchesError) {
      console.error('경기 데이터 조회 오류:', matchesError);
      return NextResponse.json(
        { error: '경기 데이터를 불러오는데 실패했습니다.', details: matchesError },
        { status: 500 }
      );
    }

    console.log('경기 데이터 조회 완료:', matchesData?.length || 0, '경기');

    const matches = matchesData || [];

    // 3. 각 선수의 통계 계산
    const playerStats = players.map(player => {
      // 해당 선수의 모든 경기 (최신순)
      const playerMatches = matches.filter(match => 
        match.winner_id === player.id || match.loser_id === player.id
      ).sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

      // 승/패 횟수 계산
      const wins = playerMatches.filter(match => match.winner_id === player.id).length;
      const losses = playerMatches.filter(match => match.loser_id === player.id).length;
      const totalMatches = wins + losses;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      // 최근 5경기 결과 (최신순)
      const recentMatches = playerMatches
        .slice(0, 5)
        .map(match => match.winner_id === player.id ? 'W' : 'L');

      // 현재 연승/연패 계산
      let currentStreak = 0;
      for (const match of playerMatches) {
        if (currentStreak === 0) {
          currentStreak = match.winner_id === player.id ? 1 : -1;
        } else {
          const isWin = match.winner_id === player.id;
          if ((currentStreak > 0 && isWin) || (currentStreak < 0 && !isWin)) {
            currentStreak = currentStreak + (isWin ? 1 : -1);
          } else {
            break;
          }
        }
      }

      // 세트 스코어 계산
      const setsWon = playerMatches.reduce((sum, match) => 
        sum + (match.winner_id === player.id ? match.winner_sets : match.loser_sets), 0
      );
      const setsLost = playerMatches.reduce((sum, match) => 
        sum + (match.winner_id === player.id ? match.loser_sets : match.winner_sets), 0
      );

      return {
        id: player.id,
        name: player.name,
        level: player.level,
        wins,
        losses,
        winRate,
        setsWon,
        setsLost,
        currentStreak,
        recentMatches
      };
    });

    // 4. 최고/최저 승률 및 연승/연패 찾기
    const sortedByWinRate = [...playerStats].sort((a, b) => b.winRate - a.winRate);
    const highestWinRate = sortedByWinRate[0] || null;
    const lowestWinRate = sortedByWinRate[sortedByWinRate.length - 1] || null;

    const sortedByStreak = [...playerStats].sort((a, b) => Math.abs(b.currentStreak) - Math.abs(a.currentStreak));
    const highestStreak = sortedByStreak.find(p => p.currentStreak > 0) || null;
    const lowestStreak = sortedByStreak.find(p => p.currentStreak < 0) || null;

    // 5. 응답 데이터 구성
    const response = {
      totalMatches: matches.length,
      totalPlayers: players.length,
      matchDateRange: {
        first: matches[matches.length - 1]?.match_date || null,
        last: matches[0]?.match_date || null
      },
      highestWinRate: highestWinRate ? {
        player: {
          id: highestWinRate.id,
          name: highestWinRate.name,
          level: highestWinRate.level
        },
        rate: highestWinRate.winRate
      } : null,
      lowestWinRate: lowestWinRate ? {
        player: {
          id: lowestWinRate.id,
          name: lowestWinRate.name,
          level: lowestWinRate.level
        },
        rate: lowestWinRate.winRate
      } : null,
      highestStreak: highestStreak ? {
        player: {
          id: highestStreak.id,
          name: highestStreak.name,
          level: highestStreak.level
        },
        streak: highestStreak.currentStreak
      } : null,
      lowestStreak: lowestStreak ? {
        player: {
          id: lowestStreak.id,
          name: lowestStreak.name,
          level: lowestStreak.level
        },
        streak: lowestStreak.currentStreak
      } : null,
      playerStats: playerStats.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return b.winRate - a.winRate;
      })
    };

    console.log('대시보드 데이터 응답 준비 완료');
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('대시보드 데이터 로딩 에러:', error);
    return NextResponse.json(
      { error: '대시보드 데이터를 불러오는데 실패했습니다.', details: error },
      { status: 500 }
    );
  }
} 