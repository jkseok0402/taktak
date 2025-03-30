import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 선수 삭제 API
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('Attempting to delete player with ID:', id);

    // 먼저 해당 선수가 존재하는지 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError) {
      console.error('Error checking user existence:', userError);
      return NextResponse.json(
        { error: '선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('Found user:', userData);

    // 먼저 관련된 경기 기록 삭제
    const { error: matchesError } = await supabase
      .from('matches')
      .delete()
      .or(`winner_id.eq.${id},loser_id.eq.${id}`);

    if (matchesError) {
      console.error('Error deleting matches:', matchesError);
      return NextResponse.json(
        { error: '관련 경기 기록 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 선수 삭제
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting player:', deleteError);
      return NextResponse.json(
        { error: `선수 삭제에 실패했습니다: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log('Successfully deleted player and all related records');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting player:', error);
    return NextResponse.json(
      { error: '선수 삭제 중 예상치 못한 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 