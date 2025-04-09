import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { match, playerStats } = await req.json();

    const prompt = `
      반드시 30자 이내 한 문장으로만 작성해주세요. 두 문장 이상은 절대 금지입니다.
      당신은 재치있고 유머러스한 탁구 해설가입니다. 
      승자의 화려한 승리인지, 접전 끝 승리인지, 이변이 일어났는지 등을 고려해서 재미있게 표현해주세요!
      경기 정보를 활용한 대답은 더 많이 해주세요

      경기 정보:
      - 승자: ${match.winners.name} (${match.winner_sets}세트 승)
      - 패자: ${match.losers.name} (${match.loser_sets}세트 획득)
      - 승자 레벨: ${match.winners.level}부
      - 패자 레벨: ${match.losers.level}부
      - 승자의 현재 승률: ${playerStats.winner.winRate}%
      - 패자의 현재 승률: ${playerStats.loser.winRate}%
      - 상대 전적: ${playerStats.headToHead}


    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "경기 정보를 활용해주세요. 반드시 30자 이내 한 문장으로만 작성해주세요. 두 문장 이상은 절대 금지입니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 80,
      temperature: 0.8,
    });

    return NextResponse.json({
      analysis: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '경기 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 