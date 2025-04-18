import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI API 키 확인
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { matches, rankings } = await req.json();

    if (!matches || !rankings || !Array.isArray(matches) || !Array.isArray(rankings)) {
      return NextResponse.json(
        { error: '잘못된 데이터 형식입니다.' },
        { status: 400 }
      );
    }

    // 데이터 유효성 검사
    const validMatches = matches.filter(match => 
      match.winners && match.losers && 
      match.winners.name && match.losers.name &&
      match.winner_sets !== undefined && match.loser_sets !== undefined
    );

    if (validMatches.length === 0) {
      return NextResponse.json(
        { error: '유효한 경기 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 선수 이름에 '선수' 붙이기
    const formattedMatches = validMatches.map(match => ({
      ...match,
      winners: {
        ...match.winners,
        name: `${match.winners.name} 선수`
      },
      losers: {
        ...match.losers,
        name: `${match.losers.name} 선수`
      }
    }));

    const formattedRankings = rankings
      .filter(rank => rank.player_name && rank.win_rate !== undefined)
      .map(rank => ({
        ...rank,
        player_name: `${rank.player_name} 선수`,
        win_rate: rank.win_rate || 0,
        wins: rank.wins || 0,
        losses: rank.losses || 0
      }));

    if (formattedRankings.length === 0) {
      return NextResponse.json(
        { error: '유효한 순위 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const prompt = `
      당신은 열정적이고 전문적인 탁구 해설가입니다.
      오늘의 모든 경기 결과를 종합적으로 분석하고 중계해주세요.
      선수 이름을 언급할 때는 반드시 '선수'를 붙여서 언급해주세요. (예: "김철수 선수")
      
      1. 오늘의 하이라이트나 주목할 만한 경기를 언급해주세요.
      2. 특별한 이변이나 흥미로운 승부가 있었다면 설명해주세요.
      3. 선수들의 전반적인 컨디션과 경기력을 평가해주세요.
      4. 오늘의 MVP나 주목할 만한 선수를 선정해주세요.
      5. 웃음기 있는 유머러스한 문구를 포함해주세요.
      
      반드시 50자 이내로 작성해주세요.

      오늘의 경기 결과:
      ${formattedMatches.map(match => `
      - ${match.winners.name}(${match.winners.level}부) vs ${match.losers.name}(${match.losers.level}부) : ${match.winner_sets}-${match.loser_sets}
      `).join('')}

      현재 순위:
      ${formattedRankings.map((rank, index) => `
      ${index + 1}위: ${rank.player_name} (승률: ${rank.win_rate.toFixed(1)}%, ${rank.wins}승 ${rank.losses}패)
      `).join('')}
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "당신은 열정적이고 전문적인 탁구 해설가입니다. 오늘의 경기 결과를 종합적으로 분석하고, 흥미진진한 중계를 해주세요. 선수 이름을 언급할 때는 반드시 '선수'를 붙여서 언급해주세요. 반드시 80자 이내로 작성해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 200,
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('AI 분석 결과를 생성할 수 없습니다.');
    }

    return NextResponse.json({
      analysis: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '경기 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 