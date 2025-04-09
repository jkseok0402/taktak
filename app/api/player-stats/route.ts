import { NextResponse } from 'next/server';
import { supabase } from '@/db';
import { formatInTimeZone } from 'date-fns-tz';

// 동적 라우트 설정
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 기본 쿼리 설정
    let matchesQuery = supabase
      .from('matches')
      .select(`
        *,
        winner:winner_id(id, name, level),
        loser:loser_id(id, name, level)
      `)
      .order('match_date', { ascending: false });

    // 날짜 필터 적용 (match_date 컬럼 기준)
    if (startDate && endDate) {
      // 한국 시간으로 변환
      const koreanStartDate = formatInTimeZone(new Date(startDate), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ssXXX");
      const koreanEndDate = formatInTimeZone(new Date(endDate), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ssXXX");

      matchesQuery = matchesQuery
        .gte('match_date', koreanStartDate)
        .lte('match_date', koreanEndDate);
    }

    const { data: matches, error: matchesError } = await matchesQuery;

    if (matchesError) {
      throw matchesError;
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ stats: [] });
    }

    // 해당 날짜에 경기를 한 선수들의 ID를 수집
    const playerIds = new Set<string>();
    matches.forEach(match => {
      playerIds.add(match.winner.id);
      playerIds.add(match.loser.id);
    });

    // 경기를 한 선수들의 정보만 가져오기
    const { data: matchedUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', Array.from(playerIds))
      .order('level', { ascending: true });

    if (usersError) {
      throw usersError;
    }

    // 선수 통계 계산
    const playerStats = new Map<string, {
      player_id: string;
      player_name: string;
      player_level: number;
      wins: number;
      losses: number;
      sets_won: number;
      sets_lost: number;
      win_rate: number;
      total_matches: number;
    }>();

    // 경기를 한 선수들의 초기 통계를 설정
    matchedUsers.forEach(user => {
      playerStats.set(user.id, {
        player_id: user.id,
        player_name: user.name,
        player_level: user.level,
        wins: 0,
        losses: 0,
        sets_won: 0,
        sets_lost: 0,
        win_rate: 0,
        total_matches: 0
      });
    });

    // 경기 데이터로 통계 업데이트
    for (const match of matches) {
      const winner = match.winner;
      const loser = match.loser;

      // 승자 통계 업데이트
      const winnerStats = playerStats.get(winner.id)!;
      winnerStats.wins++;
      winnerStats.sets_won += match.winner_sets;
      winnerStats.sets_lost += match.loser_sets;
      winnerStats.total_matches++;
      winnerStats.win_rate = (winnerStats.wins / winnerStats.total_matches) * 100;

      // 패자 통계 업데이트
      const loserStats = playerStats.get(loser.id)!;
      loserStats.losses++;
      loserStats.sets_won += match.loser_sets;
      loserStats.sets_lost += match.winner_sets;
      loserStats.total_matches++;
      loserStats.win_rate = (loserStats.wins / loserStats.total_matches) * 100;
    }

    // 통계 데이터를 배열로 변환
    const stats = Array.from(playerStats.values()).map(stat => ({
      ...stat,
      created_at: formatInTimeZone(new Date(), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ssXXX")
    }));

    // 승률과 레벨로 정렬 (승률이 같으면 레벨이 높은 순)
    stats.sort((a, b) => {
      if (b.win_rate === a.win_rate) {
        return b.player_level - a.player_level;
      }
      return b.win_rate - a.win_rate;
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in GET /api/player-stats:', error);
    return NextResponse.json(
      { error: '선수 통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 