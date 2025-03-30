import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface PlayerStats {
  id: string;
  name: string;
  level: number;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_sets_won: number;
  total_sets_lost: number;
  set_difference: number;
  current_streak: number;
  last_5_matches: string[];
  match_dates: string[];
}

export async function GET() {
  try {
    // 모든 경기 결과 조회
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });

    if (matchesError) throw matchesError;

    // 모든 사용자 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) throw usersError;

    // 각 선수의 통계 계산
    const stats: { [key: string]: PlayerStats } = {};

    // 초기화
    users.forEach(user => {
      stats[user.id] = {
        id: user.id,
        name: user.name,
        level: user.level,
        total_matches: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        total_sets_won: 0,
        total_sets_lost: 0,
        set_difference: 0,
        current_streak: 0,
        last_5_matches: [],
        match_dates: []
      };
    });

    // 경기 결과로 통계 계산
    matches.forEach(match => {
      // 승자 통계
      if (stats[match.winner_id]) {
        stats[match.winner_id].wins++;
        stats[match.winner_id].total_sets_won += match.winner_sets;
        stats[match.winner_id].total_sets_lost += match.loser_sets;
        stats[match.winner_id].last_5_matches.unshift('W');
        stats[match.winner_id].match_dates.push(match.match_date);
      }

      // 패자 통계
      if (stats[match.loser_id]) {
        stats[match.loser_id].losses++;
        stats[match.loser_id].total_sets_won += match.loser_sets;
        stats[match.loser_id].total_sets_lost += match.winner_sets;
        stats[match.loser_id].last_5_matches.unshift('L');
        stats[match.loser_id].match_dates.push(match.match_date);
      }
    });

    // 추가 통계 계산
    Object.values(stats).forEach(player => {
      // 총 경기 수 계산 (승리 + 패배)
      player.total_matches = player.wins + player.losses;

      // 승률 계산
      player.win_rate = player.total_matches > 0 
        ? (player.wins / player.total_matches) * 100 
        : 0;

      // 세트 득실 계산
      player.set_difference = player.total_sets_won - player.total_sets_lost;

      // 최근 5경기만 유지
      player.last_5_matches = player.last_5_matches.slice(0, 5);

      // 연승 계산
      let streak = 0;
      for (const result of player.last_5_matches) {
        if (result === 'W') streak++;
        else break;
      }
      player.current_streak = streak;
    });

    // 승률 기준으로 정렬
    const sortedStats = Object.values(stats).sort((a, b) => {
      if (b.win_rate !== a.win_rate) {
        return b.win_rate - a.win_rate;
      }
      return b.set_difference - a.set_difference;
    });

    return NextResponse.json(sortedStats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    return NextResponse.json(
      { error: '통계 계산 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 