'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { IPlayer } from '@/types';
import { useRouter } from 'next/navigation';

interface IMatch {
  id: string;
  match_date: string;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  winner: string;
  loser: string;
}

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

// 순위 뱃지 스타일
const rankStyles = {
  1: 'bg-yellow-500 text-white',
  2: 'bg-gray-400 text-white',
  3: 'bg-amber-600 text-white',
  default: 'bg-gray-100 text-gray-600'
};

// 연승/연패에 따른 색상
const getStreakColor = (streak: number) => {
  if (streak >= 5) return 'text-red-600';
  if (streak >= 3) return 'text-orange-500';
  return 'text-blue-500';
};

interface PlayerStreak extends IPlayer {
  maxWinStreak: number;
  maxLoseStreak: number;
}

type SortType = 'win' | 'lose';
type SortOrder = 'desc' | 'asc';

export default function WinStreakPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortType, setSortType] = useState<SortType>('win');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
        const response = await matchesResponse.json();
        const matchesData = response.matches || [];

        console.log('API 응답 데이터:', {
          players: playersData,
          matches: matchesData
        });

        // 각 선수의 최대 연승과 최대 연패 계산
        const playerStats = playersData.map((player: IPlayer) => {
          // 해당 선수의 모든 경기 필터링
          const playerMatches = Array.isArray(matchesData) ? matchesData
            .filter((match: IMatch) => match.winner_id === player.id || match.loser_id === player.id)
            .sort((a: IMatch, b: IMatch) => {
              const dateA = a.match_date ? new Date(a.match_date).getTime() : 0;
              const dateB = b.match_date ? new Date(b.match_date).getTime() : 0;
              return dateA - dateB;  // 과거부터 현재 순으로 정렬
            }) : [];

          console.log(`${player.name}의 경기 데이터:`, playerMatches);

          let currentWinStreak = 0;
          let currentLoseStreak = 0;
          let maxWinStreak = 0;
          let maxLoseStreak = 0;

          // 모든 경기를 순회하며 연승/연패 계산
          playerMatches.forEach((match: IMatch) => {
            const isWinner = match.winner_id === player.id;
            if (isWinner) {
              currentWinStreak++;
              currentLoseStreak = 0;
              maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            } else {
              currentLoseStreak++;
              currentWinStreak = 0;
              maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
            }
          });

          console.log(`${player.name}의 연승/연패 계산 결과:`, {
            maxWinStreak,
            maxLoseStreak
          });

          return {
            ...player,
            maxWinStreak,
            maxLoseStreak
          };
        });

        setPlayers(playerStats);
      } catch (err) {
        console.error('데이터 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 정렬 함수
  const sortPlayers = () => {
    const sortedPlayers = [...players].sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? 1 : -1;
      if (sortType === 'win') {
        return (b.maxWinStreak - a.maxWinStreak) * multiplier;
      } else {
        return (b.maxLoseStreak - a.maxLoseStreak) * multiplier;
      }
    });
    setPlayers(sortedPlayers);
  };

  // 정렬 타입 변경
  const handleSortTypeChange = (type: SortType) => {
    setSortType(type);
    sortPlayers();
  };

  // 정렬 순서 변경
  const handleSortOrderChange = (order: SortOrder) => {
    setSortOrder(order);
    sortPlayers();
  };

  useEffect(() => {
    sortPlayers();
  }, [sortType, sortOrder]);

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
              <h1 className="text-2xl font-bold text-gray-900">최대 연승/연패 기록</h1>
              <p className="mt-1 text-sm text-gray-500">
                전체 {players.length}명의 선수 중 최고 연승: {players[0]?.maxWinStreak}연승 ({players[0]?.name})
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

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">정렬 기준:</span>
                  <button
                    onClick={() => handleSortTypeChange('win')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      sortType === 'win'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    최대 연승 {sortType === 'win' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => handleSortTypeChange('lose')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      sortType === 'lose'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    최대 연패 {sortType === 'lose' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      이름
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      부수
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      최대 연승
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      최대 연패
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[player.level as keyof typeof levelStyles]}`}>
                          {player.level}부
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-blue-500 text-sm font-semibold">
                            {player.maxWinStreak}
                          </span>
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(player.maxWinStreak / Math.max(...players.map(p => p.maxWinStreak))) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-red-500 text-sm font-semibold">
                            {player.maxLoseStreak}
                          </span>
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-red-500 rounded-full" 
                              style={{ width: `${(player.maxLoseStreak / Math.max(...players.map(p => p.maxLoseStreak))) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 