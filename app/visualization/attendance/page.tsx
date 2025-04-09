'use client';

export const dynamic = 'force-dynamic'  // 캐싱 비활성화
export const revalidate = 0  // 캐싱 시간 0으로 설정

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface IAttendance {
  date: string;
  attended: boolean;
}

interface IAttendanceStats {
  id: string;
  name: string;
  attendanceCount: number;
  totalDays: number;
  attendanceRate: number;
  recentAttendance: IAttendance[];
}

// 순위 뱃지 스타일
const rankStyles = {
  1: 'bg-yellow-500 text-white',
  2: 'bg-gray-400 text-white',
  3: 'bg-amber-600 text-white',
  default: 'bg-gray-100 text-gray-600'
};

export default function AttendancePage() {
  const router = useRouter();
  const [stats, setStats] = useState<IAttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/attendance');
        if (!response.ok) throw new Error('참석 통계를 불러오는데 실패했습니다.');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching attendance stats:', err);
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MM/dd', { locale: ko });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-2xl mx-auto py-2 px-2 sm:px-4">
        <div className="px-2 py-2 sm:px-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">리그통계 - 선수별 참석률</h1>
              <p className="mt-1 text-sm text-gray-500">
                {stats.length}명의 선수 중 상위 참석률: {stats[0]?.attendanceRate.toFixed(1)}% ({stats[0]?.name})
              </p>
            </div>
            <button
              onClick={() => router.push('/visualization')}
              className="flex items-center px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      순위
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      이름
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      참석/전체
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      참석률
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      최근 참석
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-2 py-2 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          rankStyles[index + 1 as keyof typeof rankStyles] || rankStyles.default
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        <span className="text-blue-600 font-medium">{player.attendanceCount}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-600">{player.totalDays}</span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{player.attendanceRate.toFixed(1)}%</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${player.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex space-x-1 justify-center">
                          {player.recentAttendance.slice(-3).map((attendance, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">{formatDate(attendance.date)}</span>
                              <span
                                className={`w-4 h-4 mt-1 flex items-center justify-center rounded-full text-xs font-medium
                                  ${attendance.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                              >
                                {attendance.attended ? '○' : '×'}
                              </span>
                            </div>
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
      </div>
    </div>
  );
} 