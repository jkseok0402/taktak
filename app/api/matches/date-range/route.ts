import { NextResponse } from 'next/server';
import { supabase } from '@/db';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // 가장 오래된 경기와 가장 최근 경기의 날짜를 가져옴
    const { data: matches, error } = await supabase
      .from('matches')
      .select('match_date')
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Error fetching match dates:', error);
      return NextResponse.json({ error: '경기 날짜를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        firstMatchDate: null,
        lastMatchDate: null
      });
    }

    // 날짜만 추출 (시간 제외)
    const firstMatchDate = matches[0].match_date.split('T')[0];
    const lastMatchDate = matches[matches.length - 1].match_date.split('T')[0];

    return NextResponse.json({
      firstMatchDate,
      lastMatchDate
    });

  } catch (error) {
    console.error('Error in GET /api/matches/date-range:', error);
    return NextResponse.json({ error: '날짜 범위를 불러오는데 실패했습니다.' }, { status: 500 });
  }
} 