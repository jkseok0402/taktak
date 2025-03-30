'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  match_date: string;
  winner: Player;
  loser: Player;
}

export default function EditMatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  // 상태 관리
  const [players, setPlayers] = useState<Player[]>([]);
  const [winnerId, setWinnerId] = useState('');
  const [loserId, setLoserId] = useState('');
  const [winnerSets, setWinnerSets] = useState('3');
  const [loserSets, setLoserSets] = useState('0');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 선수 목록 불러오기
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('선수 목록을 불러오는데 실패했습니다.');
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      }
    };

    const fetchMatch = async () => {
      try {
        const response = await fetch(`/api/matches`);
        if (!response.ok) throw new Error('경기 정보를 불러오는데 실패했습니다.');
        const data = await response.json();
        const match = data.find((m: Match) => m.id === id);
        
        if (!match) {
          throw new Error('경기 정보를 찾을 수 없습니다.');
        }
        
        setWinnerId(match.winner_id);
        setLoserId(match.loser_id);
        setWinnerSets(match.winner_sets.toString());
        setLoserSets(match.loser_sets.toString());
        setMatchDate(new Date(match.match_date).toISOString().split('T')[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchPlayers(), fetchMatch()]);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!winnerId || !loserId) {
      setError('승자와 패자를 모두 선택해주세요.');
      return;
    }

    if (winnerId === loserId) {
      setError('승자와 패자는 동일할 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winner_id: winnerId,
          loser_id: loserId,
          winner_sets: parseInt(winnerSets),
          loser_sets: parseInt(loserSets),
          match_date: matchDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '경기 결과 수정 중 오류가 발생했습니다.');
      }

      router.push('/matches');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">탁구 통계</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  대시보드
                </Link>
                <Link href="/matches" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  경기 결과
                </Link>
                <Link href="/stats" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  선수 통계
                </Link>
                <Link href="/visualization" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  리그통계
                </Link>
                <Link href="/players" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  선수 관리
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">경기 결과 수정</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="winner" className="block text-sm font-medium text-gray-700">
                승자
              </label>
              <select
                id="winner"
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">승자 선택</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="loser" className="block text-sm font-medium text-gray-700">
                패자
              </label>
              <select
                id="loser"
                value={loserId}
                onChange={(e) => setLoserId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">패자 선택</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="winner-sets" className="block text-sm font-medium text-gray-700">
                승리 세트 수
              </label>
              <input
                type="number"
                id="winner-sets"
                min="0"
                max="5"
                value={winnerSets}
                onChange={(e) => setWinnerSets(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="loser-sets" className="block text-sm font-medium text-gray-700">
                패배 세트 수
              </label>
              <input
                type="number"
                id="loser-sets"
                min="0"
                max="5"
                value={loserSets}
                onChange={(e) => setLoserSets(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="match-date" className="block text-sm font-medium text-gray-700">
                경기 날짜
              </label>
              <input
                type="date"
                id="match-date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/matches')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 