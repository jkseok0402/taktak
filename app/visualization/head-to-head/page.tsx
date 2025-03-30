'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { IPlayer, IMatch } from '@/types';

// 부수별 스타일 정의
const levelStyles = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-green-100 text-green-800',
  5: 'bg-blue-100 text-blue-800',
  6: 'bg-indigo-100 text-indigo-800',
  7: 'bg-purple-100 text-purple-800',
  8: 'bg-pink-100 text-pink-800',
  9: 'bg-gray-100 text-gray-800',
} as const;

interface HeadToHead {
  player1: IPlayer;
  player2: IPlayer;
  wins: number;
  losses: number;
  winRate: number;
}

export default function HeadToHeadPage() {
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [headToHeadStats, setHeadToHeadStats] = useState<HeadToHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('선수 목록을 불러오는데 실패했습니다.');
        const data: IPlayer[] = await response.json();
        setPlayers(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  useEffect(() => {
    const fetchHeadToHeadStats = async () => {
      if (!selectedPlayer) return;

      try {
        setLoading(true);
        const response = await fetch('/api/matches');
        if (!response.ok) throw new Error('경기 기록을 불러오는데 실패했습니다.');
        const matches: IMatch[] = await response.json();

        // 선택된 선수의 모든 상대와의 전적 계산
        const stats = players
          .filter(player => player.id !== selectedPlayer)
          .map(opponent => {
            const matchesWithOpponent = matches.filter(
              (match: IMatch) =>
                (match.winner_id === selectedPlayer && match.loser_id === opponent.id) ||
                (match.winner_id === opponent.id && match.loser_id === selectedPlayer)
            );

            const wins = matchesWithOpponent.filter(
              (match: IMatch) => match.winner_id === selectedPlayer
            ).length;

            const total = matchesWithOpponent.length;
            const losses = total - wins;
            const winRate = total > 0 ? (wins / total) * 100 : 0;

            return {
              player1: players.find(p => p.id === selectedPlayer)!,
              player2: opponent,
              wins,
              losses,
              winRate: Math.round(winRate * 10) / 10
            };
          })
          .sort((a, b) => b.winRate - a.winRate);

        setHeadToHeadStats(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeadToHeadStats();
  }, [selectedPlayer, players]);

  if (loading && !selectedPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">리그통계 - 상대전적</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <label htmlFor="player" className="block text-sm font-medium text-gray-700 mb-2">
                선수 선택
              </label>
              <select
                id="player"
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">선수를 선택하세요</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.level}부)
                  </option>
                ))}
              </select>
            </div>

            {selectedPlayer && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상대 선수
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        부수
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        승
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        패
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        승률
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {headToHeadStats.map((stat) => (
                      <tr key={stat.player2.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.player2.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[stat.player2.level as keyof typeof levelStyles]}`}>
                            {stat.player2.level}부
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {stat.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {stat.losses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {stat.winRate}%
                        </td>
                      </tr>
                    ))}
                    {headToHeadStats.length === 0 && selectedPlayer && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          경기 기록이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 