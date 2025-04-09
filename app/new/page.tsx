'use client';

import { useState } from 'react';

interface IPlayer {
  id: string;
  name: string;
  level: number;
}

export default function NewMatchPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<IPlayer | null>(null);
  const [selectedLoser, setSelectedLoser] = useState<IPlayer | null>(null);
  const [winnerSets, setWinnerSets] = useState(0);
  const [loserSets, setLoserSets] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 현재 시간을 포함한 ISO 문자열 생성
      const now = new Date();
      const match_date = now.toISOString();

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winner_id: selectedWinner?.id,
          loser_id: selectedLoser?.id,
          winner_sets: winnerSets,
          loser_sets: loserSets,
          match_date: match_date // ISO 형식의 날짜+시간 문자열
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '경기 결과 등록에 실패했습니다.');
      }

      // 폼 초기화
      setSelectedWinner(null);
      setSelectedLoser(null);
      setWinnerSets(0);
      setLoserSets(0);
      setError('');
      setSuccess(true);

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting match:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* 여기에 폼 UI를 구현하세요 */}
    </div>
  );
} 