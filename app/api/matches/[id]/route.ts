import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/db';

// 특정 경기 결과 삭제 API
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: '삭제할 경기 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting match:', error);
      return NextResponse.json(
        { error: '경기 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '경기가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Error in DELETE /api/matches/[id]:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 경기 결과 수정 API
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { winner_id, loser_id, winner_sets, loser_sets, match_date } = body;

    // 필수 필드 확인
    if (!winner_id || !loser_id || !winner_sets || !loser_sets || !match_date) {
      return NextResponse.json(
        { error: '모든 필드는 필수입니다.' },
        { status: 400 }
      );
    }

    // 승자와 패자가 같은지 확인
    if (winner_id === loser_id) {
      return NextResponse.json(
        { error: '승자와 패자는 같을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 데이터 유효성 검사
    if (winner_sets < 0 || loser_sets < 0) {
      return NextResponse.json(
        { error: '세트 수는 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 경기 결과 수정
    const { data, error } = await supabase
      .from('matches')
      .update({
        winner_id,
        loser_id,
        winner_sets,
        loser_sets,
        match_date: new Date(match_date).toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        winner:winner_id(id, name, level),
        loser:loser_id(id, name, level)
      `)
      .single();

    if (error) {
      console.error('Error updating match:', error);
      return NextResponse.json(
        { error: '경기 결과 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: '경기 결과 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
} 