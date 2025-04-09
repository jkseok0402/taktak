import { NextResponse } from 'next/server';
import { supabase } from '@/db';
import { formatInTimeZone } from 'date-fns-tz';

export const dynamic = 'force-dynamic';

// 모든 매치 조회 API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const playerId = searchParams.get('playerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 기본 쿼리 설정
    let matchesQuery = supabase
      .from('matches')
      .select(`
        *,
        winners:winner_id(*),
        losers:loser_id(*)
      `)
      .order('match_date', { ascending: false });

    // 날짜 필터 적용
    if (startDate && endDate) {
      matchesQuery = matchesQuery
        .gte('match_date', startDate)
        .lte('match_date', endDate);
    }

    // 특정 선수 필터 적용
    if (playerId) {
      matchesQuery = matchesQuery.or(`winner_id.eq.${playerId},loser_id.eq.${playerId}`);
    }

    // 페이지네이션 적용 (페이지네이션이 요청된 경우에만)
    if (searchParams.has('page')) {
      const offset = (page - 1) * limit;
      matchesQuery = matchesQuery
        .range(offset, offset + limit - 1);
    }

    const { data: matches, error } = await matchesQuery;

    if (error) {
      throw error;
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error in GET /api/matches:', error);
    return NextResponse.json(
      { error: '경기 기록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 매치 추가 API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { match_date, winner_id, loser_id, winner_sets, loser_sets } = body;

    // 필수 필드 검증
    if (!match_date || !winner_id || !loser_id || winner_sets === undefined || loser_sets === undefined) {
      console.log('Missing required fields:', {
        match_date,
        winner_id,
        loser_id,
        winner_sets,
        loser_sets
      });
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 같은 날짜의 동일 선수간 경기 결과가 있는지 확인
    const matchDate = new Date(match_date);
    const startOfDay = new Date(matchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(matchDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Checking for existing matches:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      winner_id,
      loser_id
    });

    const { data: existingMatches, error: existingMatchesError } = await supabase
      .from('matches')
      .select()
      .gte('match_date', startOfDay.toISOString())
      .lte('match_date', endOfDay.toISOString())
      .or(
        `and(winner_id.eq.${winner_id},loser_id.eq.${loser_id}),` +
        `and(winner_id.eq.${loser_id},loser_id.eq.${winner_id})`
      );

    if (existingMatchesError) {
      console.error('Error checking existing matches:', existingMatchesError);
      return NextResponse.json(
        { error: '기존 경기 결과 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (existingMatches && existingMatches.length > 0) {
      console.log('Found existing matches:', existingMatches);
      return NextResponse.json(
        { error: '동일한 날짜에 같은 선수간의 경기 결과가 이미 등록되어 있습니다.' },
        { status: 400 }
      );
    }

    // 경기 결과 저장 (시간은 이미 한국 시간으로 입력됨)
    const { data: match, error: insertError } = await supabase
      .from('matches')
      .insert({
        match_date,
        winner_id,
        loser_id,
        winner_sets,
        loser_sets
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving match:', insertError);
      return NextResponse.json(
        { error: '경기 결과 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: '경기 결과가 성공적으로 저장되었습니다.',
      match 
    });
  } catch (error) {
    console.error('Error in POST /api/matches:', error);
    return NextResponse.json(
      { error: '경기 결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');

    if (!matchId) {
      return NextResponse.json({ error: '경기 ID가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('matches')
      .delete()
      .eq('id', parseInt(matchId))
      .select();

    if (error) {
      throw error;
    }

    if (!data?.length) {
      return NextResponse.json({ error: '해당 경기를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ message: '경기가 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: '경기 삭제에 실패했습니다.' }, { status: 500 });
  }
}

// 플레이어 통계 업데이트 함수
async function updatePlayerStats(
  playerId: string,
  isWinner: boolean,
  setsWon: number,
  setsLost: number
) {
  // 현재 플레이어 통계 조회
  const { data: stats, error: fetchError } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 결과가 없는 경우
    console.error('Error fetching player stats:', fetchError);
    throw new Error('플레이어 통계 조회 중 오류가 발생했습니다.');
  }
  
  const now = new Date();
  
  if (!stats) {
    // 통계가 없으면 새로 생성
    const newStats = {
      player_id: playerId,
      wins: isWinner ? 1 : 0,
      losses: isWinner ? 0 : 1,
      win_rate: isWinner ? 100 : 0,
      sets_won: setsWon,
      sets_lost: setsLost,
      current_streak: isWinner ? 1 : -1,
      recent_matches: JSON.stringify([{
        date: now.toISOString(),
        result: isWinner ? 'win' : 'loss',
        sets: `${setsWon}-${setsLost}`
      }])
    };
    
    const { error: insertError } = await supabase
      .from('player_stats')
      .insert(newStats);

    if (insertError) {
      console.error('Error inserting player stats:', insertError);
      throw new Error('새로운 플레이어 통계 생성 중 오류가 발생했습니다.');
    }
  } else {
    const newWins = stats.wins + (isWinner ? 1 : 0);
    const newLosses = stats.losses + (isWinner ? 0 : 1);
    const totalMatches = newWins + newLosses;
    const newWinRate = totalMatches > 0 ? (newWins / totalMatches) * 100 : 0;
    
    // 연승/연패 계산
    let newStreak = stats.current_streak;
    if ((isWinner && stats.current_streak > 0) || (!isWinner && stats.current_streak < 0)) {
      // 같은 결과가 계속되면 연승/연패 증가
      newStreak = isWinner ? stats.current_streak + 1 : stats.current_streak - 1;
    } else {
      // 결과가 바뀌면 연승/연패 초기화 후 새로운 값 설정
      newStreak = isWinner ? 1 : -1;
    }
    
    // 최근 매치 기록 업데이트
    const recentMatches = JSON.parse(stats.recent_matches as string);
    recentMatches.unshift({
      date: now.toISOString(),
      result: isWinner ? 'win' : 'loss',
      sets: `${setsWon}-${setsLost}`
    });
    
    // 최대 5개까지만 유지
    if (recentMatches.length > 5) {
      recentMatches.pop();
    }
    
    // 통계 업데이트
    const updateData = {
      wins: newWins,
      losses: newLosses,
      win_rate: newWinRate,
      sets_won: stats.sets_won + setsWon,
      sets_lost: stats.sets_lost + setsLost,
      current_streak: newStreak,
      recent_matches: JSON.stringify(recentMatches)
    };
    
    const { error: updateError } = await supabase
      .from('player_stats')
      .update(updateData)
      .eq('player_id', playerId);

    if (updateError) {
      console.error('Error updating player stats:', updateError);
      throw new Error('플레이어 통계 업데이트 중 오류가 발생했습니다.');
    }
  }
} 