import { NextResponse } from 'next/server';
import { supabase } from '@/db';

// DELETE: 선수 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('Attempting to delete player with ID:', id);

    // Supabase 연결 확인
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return NextResponse.json(
        { error: '데이터베이스 연결에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 먼저 해당 선수가 존재하는지 확인
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching player:', fetchError);
      return NextResponse.json(
        { error: '선수 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!existingPlayer) {
      console.error('Player not found');
      return NextResponse.json(
        { error: '선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('Found player:', existingPlayer);

    // 트랜잭션으로 처리하여 모든 삭제 작업이 성공적으로 완료되거나 모두 롤백되도록 함
    try {
      // 관련된 경기 기록 삭제
      console.log('Deleting related matches...');
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .or(`winner_id.eq.${id},loser_id.eq.${id}`);

      if (matchesError) {
        console.error('Error deleting matches:', matchesError);
        return NextResponse.json(
          { error: '경기 기록 삭제 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      console.log('Matches deleted successfully');

      // 선수 삭제
      console.log('Deleting player...');
      const { error: playerError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (playerError) {
        console.error('Error deleting player:', playerError);
        return NextResponse.json(
          { error: '선수 삭제 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      console.log(`Deleted player: ${existingPlayer.name}`);

      console.log('Successfully deleted player and all related records');
      return NextResponse.json({ 
        success: true,
        message: '선수가 성공적으로 삭제되었습니다.',
        deletedPlayer: existingPlayer
      });
    } catch (error) {
      console.error('Error in transaction:', error);
      return NextResponse.json(
        { error: '선수 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error deleting player:', error);
    return NextResponse.json(
      { error: '선수 삭제 중 예상치 못한 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, level } = await request.json();

    // 필수 필드 검증
    if (!name || !level) {
      return NextResponse.json(
        { error: '이름과 부수는 필수 입력 사항입니다.' },
        { status: 400 }
      );
    }

    // Supabase 연결 확인
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return NextResponse.json(
        { error: '데이터베이스 연결에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 먼저 해당 선수가 존재하는지 확인
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching player:', fetchError);
      return NextResponse.json(
        { error: '선수 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!existingPlayer) {
      return NextResponse.json(
        { error: '선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 선수 정보 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ name, level })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('선수 정보 수정 중 오류 발생:', error);
      return NextResponse.json(
        { error: '선수 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '선수 정보가 성공적으로 수정되었습니다.',
      updatedPlayer: data
    });
  } catch (error) {
    console.error('선수 정보 수정 중 오류 발생:', error);
    return NextResponse.json(
      { error: '선수 정보 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
} 