'use client';

export const dynamic = 'force-dynamic'  // 캐싱 비활성화
export const revalidate = 0  // 캐싱 시간 0으로 설정

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

interface IDashboardData {
  totalMatches: number;
  totalPlayers: number;
  matchDateRange: {
    first: string | null;
    last: string | null;
  };
  highestWinRate: {
    player: {
      id: string;
      name: string;
      level: number;
    };
    rate: number;
  } | null;
  lowestWinRate: {
    player: {
      id: string;
      name: string;
      level: number;
    };
    rate: number;
  } | null;
  highestStreak: {
    player: {
      id: string;
      name: string;
      level: number;
    };
    streak: number;
  } | null;
  lowestStreak: {
    player: {
      id: string;
      name: string;
      level: number;
    };
    streak: number;
  } | null;
  playerStats: Array<{
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
  }>;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('통계를 불러오는데 실패했습니다.');
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('통계 로딩 에러:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">데이터가 없습니다.</div>
      </div>
    );
  }

  const chartData = dashboardData.playerStats
    .sort((a, b) => b.winRate - a.winRate)
    .map(player => ({
      name: player.name,
      승률: Math.round(player.winRate),
      경기수: player.wins + player.losses,
      승리: player.wins,
      패배: player.losses,
    }));

  const sortedStats = [...dashboardData.playerStats].sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return (b.wins + b.losses) - (a.wins + a.losses);
  });

  // 승률 차트 데이터
  const winRateData = sortedStats.slice(0, 5).map(player => ({
    name: player.name,
    승률: Math.round(player.winRate),
  }));

  // 경기 수 차트 데이터
  const matchCountData = sortedStats.slice(0, 5).map(player => ({
    name: player.name,
    경기수: player.wins + player.losses,
  }));

  // 승/패 차트 데이터
  const winLossData = sortedStats.slice(0, 5).map(player => ({
    name: player.name,
    승리: player.wins,
    패배: player.losses,
  }));

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate flex justify-between items-center">
                      <span>총 경기 수</span>
                      <span>총 등록선수</span>
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 flex justify-between items-center">
                      <span>{dashboardData.totalMatches}경기</span>
                      <span>{dashboardData.totalPlayers}명</span>
                    </dd>
                    <dd className="text-sm text-gray-500">
                      {dashboardData.matchDateRange.first && dashboardData.matchDateRange.last && (
                        `${new Date(dashboardData.matchDateRange.first).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} ~ ${new Date(dashboardData.matchDateRange.last).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}`
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      최대/최소승률
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.highestWinRate && (
                        <div className="flex justify-between items-start gap-4">
                          <div className="text-green-600 text-sm">
                            {Math.round(dashboardData.highestWinRate.rate)}% ({' '}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[dashboardData.highestWinRate.player.level as keyof typeof levelStyles]}`}>
                              {dashboardData.highestWinRate.player.level}부
                            </span>{' '}
                            {dashboardData.highestWinRate.player.name})
                          </div>
                          {dashboardData.lowestWinRate && (
                            <div className="text-red-600 text-sm">
                              {Math.round(dashboardData.lowestWinRate.rate)}% ({' '}
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[dashboardData.lowestWinRate.player.level as keyof typeof levelStyles]}`}>
                                {dashboardData.lowestWinRate.player.level}부
                              </span>{' '}
                              {dashboardData.lowestWinRate.player.name})
                            </div>
                          )}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      최고 연승/연패
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.highestStreak && (
                        <div className="flex justify-between items-start gap-4">
                          <div className="text-green-600 text-sm">
                            {dashboardData.highestStreak.streak}연승 ({' '}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[dashboardData.highestStreak.player.level as keyof typeof levelStyles]}`}>
                              {dashboardData.highestStreak.player.level}부
                            </span>{' '}
                            {dashboardData.highestStreak.player.name})
                          </div>
                          {dashboardData.lowestStreak && (
                            <div className="text-red-600 text-sm">
                              {Math.abs(dashboardData.lowestStreak.streak)}연패 ({' '}
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[dashboardData.lowestStreak.player.level as keyof typeof levelStyles]}`}>
                                {dashboardData.lowestStreak.player.level}부
                              </span>{' '}
                              {dashboardData.lowestStreak.player.name})
                            </div>
                          )}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 승률 차트 */}
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-2">선수별 승률</h2>
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={35}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  width={40}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  allowDecimals={false}
                  orientation="left"
                  type="number"
                  padding={{ top: 10, bottom: 0 }}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, '승률']}
                  cursor={{ fillOpacity: 0.1 }}
                />
                <Bar 
                  dataKey="승률" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 최근 경기 결과 */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-2">선수별 통계</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선수
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최근 5경기
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 경기
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    승률
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연승/연패
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.playerStats.map((player) => (
                  <tr key={player.id}>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-1">
                        {player.name}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        {player.recentMatches.map((result, i) => (
                          <span
                            key={i}
                            className={`inline-block w-5 h-5 text-center leading-5 rounded-full mr-1 text-xs ${
                              result === 'W' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                      <span className="font-medium">
                        {player.wins + player.losses}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          player.winRate >= 70 ? 'bg-green-100 text-green-800' :
                          player.winRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(player.winRate)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          player.currentStreak > 0 ? 'bg-green-100 text-green-800' :
                          player.currentStreak < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {player.currentStreak > 0 ? `${player.currentStreak}연승` : 
                           player.currentStreak < 0 ? `${Math.abs(player.currentStreak)}연패` : 
                           '없음'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 