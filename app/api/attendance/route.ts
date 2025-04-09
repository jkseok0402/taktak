import { supabase } from '@/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. 모든 유저 정보 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, level');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: '유저 정보를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    // 2. 모든 매치의 고유한 날짜 가져오기
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('match_date, winner_id, loser_id')
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: '매치 정보를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    // 고유한 경기 날짜 추출 (날짜만 비교)
    const uniqueMatchDates = [...new Set(
      matches.map(match => {
        const date = new Date(match.match_date);
        return date.toISOString().split('T')[0];
      })
    )].sort().reverse(); // 날짜 기준 내림차순 정렬

    // 각 선수별 참석 정보 계산
    const attendanceStats = users.map(user => {
      // 해당 선수가 참여한 경기의 날짜들 추출 (날짜만 비교)
      const userMatchDates = matches
        .filter(match => match.winner_id === user.id || match.loser_id === user.id)
        .map(match => {
          const date = new Date(match.match_date);
          return date.toISOString().split('T')[0];
        });

      // 중복 제거된 참석 날짜 목록
      const uniqueDates = [...new Set(userMatchDates)];
      
      // 최근 10개 경기 날짜에 대한 참석 여부 계산
      const recentAttendance = uniqueMatchDates.slice(0, 10).map(date => ({
        date,
        attended: uniqueDates.includes(date)
      }));

      return {
        id: user.id,
        name: user.name,
        level: user.level,
        attendanceCount: uniqueDates.length,
        totalDays: uniqueMatchDates.length,
        attendanceRate: Math.round((uniqueDates.length / uniqueMatchDates.length) * 100),
        recentAttendance
      };
    });

    // 4. 참석률 기준 내림차순 정렬
    const sortedStats = attendanceStats.sort((a, b) => {
      if (b.attendanceRate === a.attendanceRate) {
        return b.attendanceCount - a.attendanceCount;
      }
      return b.attendanceRate - a.attendanceRate;
    });

    return NextResponse.json(sortedStats);
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    return NextResponse.json({ error: '참석률 계산 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 