'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { IPlayer, IMatch, IPlayerStats } from '@/types';

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

export default function WinRatePage() {
  const [players, setPlayers] = useState<IPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWinRates = async () => {
      try {
        // 선수 목록 가져오기
        const playersResponse = await fetch('/api/players');
        if (!playersResponse.ok) {
          throw new Error('선수 목록을 가져오는데 실패했습니다.');
        }
        const playersData: IPlayer[] = await playersResponse.json();

        // 경기 기록 가져오기
        const matchesResponse = await fetch('/api/matches');
        if (!matchesResponse.ok) {
          throw new Error('경기 기록을 가져오는데 실패했습니다.');
        }
        const matchesData: IMatch[] = await matchesResponse.json();

        // 선수별 승/패 계산
        const playerStats = playersData.map((player: IPlayer) => {
          const playerMatches = matchesData.filter(
            (match: IMatch) => match.winner_id === player.id || match.loser_id === player.id
          );
          const wins = playerMatches.filter((match: IMatch) => match.winner_id === player.id).length;
          const losses = playerMatches.filter((match: IMatch) => match.loser_id === player.id).length;
          const total = wins + losses;
          const winRate = total > 0 ? (wins / total) * 100 : 0;

          return {
            id: player.id,
            name: player.name,
            level: player.level,
            wins,
            losses,
            winRate: Math.round(winRate * 10) / 10,
          };
        });

        // 승률 기준으로 정렬
        playerStats.sort((a: IPlayerStats, b: IPlayerStats) => b.winRate - a.winRate);
        setPlayers(playerStats);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchWinRates();
  }, []);

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">리그통계 - 선수별 승률</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
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
                {players.map((player, index) => (
                  <tr key={player.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[player.level as keyof typeof levelStyles]}`}>
                        {player.level}부
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {player.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {player.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {player.winRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 