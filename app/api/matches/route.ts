import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        winner:winner_id(id, name),
        loser:loser_id(id, name)
      `)
      .order('match_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: '경기 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winner_id, loser_id, winner_sets, loser_sets, match_date } = body;

    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          winner_id,
          loser_id,
          winner_sets,
          loser_sets,
          match_date,
        }
      ])
      .select(`
        *,
        winner:winner_id(id, name),
        loser:loser_id(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: '경기 결과가 저장되었습니다.',
      data
    });
  } catch (error) {
    console.error('Error saving match:', error);
    return NextResponse.json(
      { error: '경기 결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 