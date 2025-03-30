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

interface PlayerStreak extends IPlayer {
  maxWinStreak: number;
  maxLoseStreak: number;
}

export default function WinStreakPage() {
  const [players, setPlayers] = useState<PlayerStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersResponse, matchesResponse] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/matches')
        ]);

        if (!playersResponse.ok || !matchesResponse.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }

        const playersData: IPlayer[] = await playersResponse.json();
        const matchesData: IMatch[] = await matchesResponse.json();

        // 각 선수의 최대 연승과 최대 연패 계산
        const playerStats = playersData.map((player: IPlayer) => {
          const playerMatches = matchesData
            .filter((match: IMatch) => match.winner_id === player.id || match.loser_id === player.id)
            .sort((a: IMatch, b: IMatch) => {
              const dateA = a.match_date ? new Date(a.match_date).getTime() : 0;
              const dateB = b.match_date ? new Date(b.match_date).getTime() : 0;
              return dateA - dateB;
            });

          let currentWinStreak = 0;
          let currentLoseStreak = 0;
          let maxWinStreak = 0;
          let maxLoseStreak = 0;

          // 모든 경기를 순회하며 연승/연패 계산
          playerMatches.forEach((match: IMatch) => {
            if (match.winner_id === player.id) {
              currentWinStreak++;
              currentLoseStreak = 0;
              maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            } else {
              currentLoseStreak++;
              currentWinStreak = 0;
              maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
            }
          });

          return {
            ...player,
            maxWinStreak,
            maxLoseStreak
          };
        });

        // 최대 연승 기준으로 정렬
        const sortedPlayers = playerStats.sort((a: PlayerStreak, b: PlayerStreak) => b.maxWinStreak - a.maxWinStreak);
        setPlayers(sortedPlayers);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">최대 연승/연패 기록</h1>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선수
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부수
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최대 연승
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최대 연패
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[player.level as keyof typeof levelStyles]}`}>
                        {player.level}부
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {player.maxWinStreak}연승
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {player.maxLoseStreak}연패
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