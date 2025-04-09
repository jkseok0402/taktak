import { NextResponse } from 'next/server';
import { supabase } from '@/db';

// GET: 선수 목록 조회
export async function GET() {
  try {
    console.log('Fetching players...');
    
    // Supabase 연결 확인
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return NextResponse.json(
        { error: '데이터베이스 연결에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    // 테이블 존재 여부 확인
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (tablesError) {
      console.error('Error checking users table:', tablesError);
      return NextResponse.json(
        { error: '선수 테이블에 접근할 수 없습니다.' },
        { status: 500 }
      );
    }
    
    // 선수 목록 조회
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching players:', error);
      return NextResponse.json(
        { error: '선수 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }
    
    console.log(`Found ${data?.length || 0} players`);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error fetching players:', error);
    return NextResponse.json(
      { error: '선수 목록을 가져오는 중 예상치 못한 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 선수 등록
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, level } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: '이름은 필수입니다.' },
        { status: 400 }
      );
    }
    
    if (!level || level < 1 || level > 9) {
      return NextResponse.json(
        { error: '부수는 1부터 9까지의 값이어야 합니다.' },
        { status: 400 }
      );
    }
    
    console.log('Creating new player:', { name, level });
    
    // 선수 등록
    const { data: player, error: playerError } = await supabase
      .from('users')
      .insert([{ name, level }])
      .select()
      .single();
    
    if (playerError) {
      console.error('Error creating player:', playerError);
      return NextResponse.json(
        { error: '선수 등록에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    console.log('Player created:', player);
    
    return NextResponse.json({
      success: true,
      message: '선수가 성공적으로 등록되었습니다.',
      player
    });
  } catch (error) {
    console.error('Unexpected error creating player:', error);
    return NextResponse.json(
      { error: '선수 등록 중 예상치 못한 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 선수 정보 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, level } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: '선수 ID는 필수입니다.' },
        { status: 400 }
      );
    }
    
    if (!name) {
      return NextResponse.json(
        { error: '이름은 필수입니다.' },
        { status: 400 }
      );
    }
    
    if (!level || level < 1 || level > 9) {
      return NextResponse.json(
        { error: '부수는 1부터 9까지의 값이어야 합니다.' },
        { status: 400 }
      );
    }
    
    console.log('Updating player:', { id, name, level });
    
    // 선수 정보 수정
    const { data: player, error: playerError } = await supabase
      .from('users')
      .update({ name, level })
      .eq('id', id)
      .select()
      .single();
    
    if (playerError) {
      console.error('Error updating player:', playerError);
      return NextResponse.json(
        { error: '선수 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    if (!player) {
      return NextResponse.json(
        { error: '선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    console.log('Player updated:', player);
    
    return NextResponse.json({
      success: true,
      message: '선수 정보가 성공적으로 수정되었습니다.',
      player
    });
  } catch (error) {
    console.error('Unexpected error updating player:', error);
    return NextResponse.json(
      { error: '선수 정보 수정 중 예상치 못한 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 