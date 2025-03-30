'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
}

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [player1Sets, setPlayer1Sets] = useState('3');
  const [player2Sets, setPlayer2Sets] = useState('0');
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
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!player1Id || !player2Id) {
      setError('두 선수를 모두 선택해주세요.');
      return;
    }

    if (player1Id === player2Id) {
      setError('두 선수는 동일할 수 없습니다.');
      return;
    }

    const player1SetsNum = parseInt(player1Sets);
    const player2SetsNum = parseInt(player2Sets);

    if (player1SetsNum === player2SetsNum) {
      setError('스코어는 동일할 수 없습니다.');
      return;
    }

    // 스코어가 높은 쪽이 승자
    const winnerId = player1SetsNum > player2SetsNum ? player1Id : player2Id;
    const loserId = player1SetsNum > player2SetsNum ? player2Id : player1Id;
    const winnerSets = Math.max(player1SetsNum, player2SetsNum);
    const loserSets = Math.min(player1SetsNum, player2SetsNum);

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winner_id: winnerId,
          loser_id: loserId,
          winner_sets: winnerSets,
          loser_sets: loserSets,
          match_date: matchDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '경기 결과 저장 중 오류가 발생했습니다.');
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
                <h1 className="text-xl font-bold text-gray-900">흥탁 리그관리</h1>
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
                  리그 통계
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 경기 결과 입력</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* 선수 1 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="player1" className="block text-sm font-medium text-gray-700">
                    선수 1
                  </label>
                  <select
                    id="player1"
                    value={player1Id}
                    onChange={(e) => setPlayer1Id(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">선택</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="player1-sets" className="block text-sm font-medium text-gray-700">
                    승리 세트수
                  </label>
                  <input
                    type="number"
                    id="player1-sets"
                    min="0"
                    max="5"
                    value={player1Sets}
                    onChange={(e) => setPlayer1Sets(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              {/* VS 표시 */}
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-2xl font-bold text-gray-500">VS</div>
              </div>

              {/* 선수 2 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="player2" className="block text-sm font-medium text-gray-700">
                    선수 2
                  </label>
                  <select
                    id="player2"
                    value={player2Id}
                    onChange={(e) => setPlayer2Id(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">선택</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="player2-sets" className="block text-sm font-medium text-gray-700">
                    승리 세트수
                  </label>
                  <input
                    type="number"
                    id="player2-sets"
                    min="0"
                    max="5"
                    value={player2Sets}
                    onChange={(e) => setPlayer2Sets(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
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
              <div className="text-red-600 text-sm">{error}</div>
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