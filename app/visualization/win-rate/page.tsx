'use client';

export const dynamic = 'force-dynamic'  // 캐싱 비활성화
export const revalidate = 0  // 캐싱 시간 0으로 설정

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { IPlayer, IMatch, IPlayerStats } from '@/types';
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

// 순위 뱃지 스타일
const rankStyles = {
  1: 'bg-yellow-500 text-white',
  2: 'bg-gray-400 text-white',
  3: 'bg-amber-600 text-white',
  default: 'bg-gray-100 text-gray-600'
};

// 승률에 따른 색상
const getWinRateColor = (winRate: number) => {
  if (winRate >= 70) return 'text-red-600';
  if (winRate >= 60) return 'text-orange-500';
  if (winRate >= 50) return 'text-blue-500';
  return 'text-gray-500';
};

export default function WinRatePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<IPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('통계를 불러오는데 실패했습니다.');
        const data = await response.json();
        
        // 데이터가 배열인지 확인
        if (!Array.isArray(data)) {
          throw new Error('잘못된 데이터 형식입니다.');
        }
        
        setPlayers(data);  // 이미 정렬된 데이터이므로 추가 정렬 불필요
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-red-500 flex items-center space-x-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
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
              <h1 className="text-2xl font-bold text-gray-900">리그통계 - 선수별 승률</h1>
              <p className="mt-1 text-sm text-gray-500">
                전체 {players.length}명의 선수 중 상위 승률: {players.length > 0 ? `${Math.round(players[0]?.winRate)}% (${players[0]?.name})` : '-'}
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
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      순위
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      이름
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
                  {players.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          rankStyles[index + 1 as keyof typeof rankStyles] || rankStyles.default
                        }`}>
                          {index + 1}
                        </span>
                      </td>
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
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-blue-600 font-medium">{player.wins}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-red-600 font-medium">{player.losses}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mx-auto mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${(player.wins / (player.wins + player.losses)) * 100}%` 
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <div className="flex flex-col items-center">
                          <span className={`${getWinRateColor(Math.round(player.winRate))} text-sm font-semibold`}>
                            {Math.round(player.winRate)}%
                          </span>
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${player.winRate}%` }}
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