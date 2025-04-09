'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { IPlayer, IMatch } from '@/types';
import { useRouter } from 'next/navigation';

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

// 승률에 따른 색상
const getWinRateColor = (winRate: number) => {
  if (winRate >= 70) return 'text-red-600';
  if (winRate >= 60) return 'text-orange-500';
  if (winRate >= 50) return 'text-blue-500';
  return 'text-gray-500';
};

export default function HeadToHeadPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [headToHead, setHeadToHead] = useState<HeadToHead[]>([]);
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
        const data = await response.json();
        const matches: IMatch[] = data.matches || [];

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

        setHeadToHead(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeadToHeadStats();
  }, [selectedPlayer, players]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl flex items-center space-x-3">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">리그통계 - 상대전적</h1>
              <p className="mt-1 text-sm text-gray-500">
                다른 선수들과의 상대전적을 확인하세요
              </p>
            </div>
            <button
              onClick={() => router.push('/visualization')}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              리그통계
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
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
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">선수를 선택하세요</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.level}부)
                  </option>
                ))}
              </select>
            </div>

            {selectedPlayer && headToHead.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        상대 선수
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        부수
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        승/패
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        승률
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {headToHead.map((record) => (
                      <tr key={record.player2.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.player2.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[record.player2.level as keyof typeof levelStyles]}`}>
                            {record.player2.level}부
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-blue-600 font-medium">{record.wins}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-red-600 font-medium">{record.losses}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full mx-auto mt-1">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ 
                                width: `${(record.wins / (record.wins + record.losses)) * 100}%` 
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className={`${getWinRateColor(Math.round(record.winRate))} text-sm font-semibold`}>
                              {Math.round(record.winRate)}%
                            </span>
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${record.winRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedPlayer && headToHead.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                아직 경기 기록이 없습니다.
              </div>
            )}

            {!selectedPlayer && (
              <div className="text-center py-8 text-gray-500">
                선수를 선택하면 상대전적이 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 