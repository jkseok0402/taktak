'use client';

export const dynamic = 'force-dynamic'  // 캐싱 비활성화
export const revalidate = 0  // 캐싱 시간 0으로 설정

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';

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

interface IStats {
  id: string;
  name: string;
  level: number;
  wins: number;
  losses: number;
  winRate: number;
  setsWon: number;
  setsLost: number;
  currentStreak: number;
  recentMatches: string[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<IStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error('통계를 불러오는데 실패했습니다.');
      const data = await response.json();
      setStats(data.playerStats);
    } catch (err) {
      console.error('통계 로딩 에러:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // 30초마다 데이터 갱신
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
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

  // 승률 기준으로 정렬
  const sortedStats = [...stats].sort((a, b) => {
    // 승률이 같은 경우 경기수가 많은 선수가 위로
    if (b.winRate === a.winRate) {
      return (b.wins + b.losses) - (a.wins + a.losses);
    }
    return b.winRate - a.winRate;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h2 className="text-lg font-semibold mb-2">선수 통계</h2>
          <p className="text-sm text-gray-600 mb-4">
            전체 {sortedStats.length}명의 선수 중 최고 승률: {sortedStats.length > 0 ? (
              <span>
                <span className="font-semibold text-blue-600">{Math.round(sortedStats[0].winRate)}%</span>
                <span> (</span>
                <span className="font-semibold">{sortedStats[0].name}</span>
                <span>)</span>
              </span>
            ) : '-'}
          </p>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순위
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부수
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      승률
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      경기
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세트
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연승/연패
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최근 5경기
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStats.map((player, index) => (
                    <tr key={player.id}>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm
                          ${index === 0 ? 'bg-yellow-400 text-white' : 
                            index === 1 ? 'bg-gray-300 text-white' : 
                            index === 2 ? 'bg-amber-600 text-white' : 
                            'text-gray-500'}`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {player.name}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[player.level as keyof typeof levelStyles]}`}>
                          {player.level}부
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                        <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${player.winRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{Math.round(player.winRate)}%</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm">
                        <span className="text-blue-600">{player.wins}</span>
                        <span className="text-gray-500"> / </span>
                        <span className="text-red-600">{player.losses}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm">
                        <span className="text-blue-600">{player.setsWon}</span>
                        <span className="text-gray-500"> / </span>
                        <span className="text-red-600">{player.setsLost}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm">
                        {player.currentStreak > 0 ? (
                          <span className="text-green-600">{player.currentStreak}연승</span>
                        ) : player.currentStreak < 0 ? (
                          <span className="text-red-600">{Math.abs(player.currentStreak)}연패</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {player.recentMatches.map((result, i) => (
                            <span
                              key={i}
                              className={`w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center rounded-full text-xs font-medium
                                ${result === 'W' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {result}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 