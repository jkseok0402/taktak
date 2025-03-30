import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 모든 선수 조회 API
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('level', { ascending: true })
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '선수 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: '선수 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 선수 추가 API
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

    // level 값 검증
    if (level && (level < 1 || level > 9)) {
      return NextResponse.json(
        { error: '부수는 1부터 9까지의 값이어야 합니다.' },
        { status: 400 }
      );
    }

    // 새 선수 추가
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, level: level || 1 }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '선수 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error adding player:', error);
    return NextResponse.json(
      { error: '선수 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 선수 수정 API
export async function PUT(request: Request) {
  try {
    const { id, name, level } = await request.json();
    console.log('Received update request:', { id, name, level });

    if (!id || !name) {
      return NextResponse.json(
        { error: '선수 ID와 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    if (level < 1 || level > 9) {
      return NextResponse.json(
        { error: '부수는 1부터 9까지의 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    // 먼저 해당 ID의 선수가 존재하는지 확인
    console.log('Checking if player exists with ID:', id);
    const { data: existingPlayer, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id);

    console.log('Player check result:', {
      existingPlayer,
      checkError,
      query: `SELECT * FROM users WHERE id = '${id}'`
    });

    if (checkError || !existingPlayer || existingPlayer.length === 0) {
      console.log('Player not found:', { checkError, existingPlayer });
      return NextResponse.json(
        { error: '수정할 선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 선수 정보 수정
    console.log('Updating player with data:', { id, name, level });
    const { data, error } = await supabase
      .from('users')
      .update({ name, level })
      .eq('id', id)
      .select();

    console.log('Update response:', { data, error });

    if (error) {
      console.error('Error updating player:', error);
      return NextResponse.json(
        { error: '선수 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '수정할 선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 필요한 필드만 포함하여 응답
    const updatedPlayer = {
      id: data[0].id,
      name: data[0].name,
      level: data[0].level,
      created_at: data[0].created_at,
    };

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Error in PUT /api/players:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 