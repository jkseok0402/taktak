'use client';

export const dynamic = 'force-dynamic'  // 캐싱 비활성화
export const revalidate = 0  // 캐싱 시간 0으로 설정

import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Link from 'next/link';

export default function VisualizationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          <h1 className="text-xl font-bold text-gray-900 mb-4">리그통계</h1>
          
          <div className="space-y-4">
            <Link
              href="/visualization/win-rate"
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 16H3V20H7V16Z" />
                    <path d="M11 12H7V20H11V12Z" />
                    <path d="M15 8H11V20H15V8Z" />
                    <path d="M19 4H15V20H19V4Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">선수별 승률</h2>
                  <p className="text-sm text-gray-500">모든 선수의 승률을 한눈에 확인</p>
                </div>
              </div>
            </Link>

            <Link
              href="/visualization/win-streak"
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">최대 연승/연패 기록</h2>
                  <p className="text-sm text-gray-500">선수별 최대 연승/연패 기록 확인</p>
                </div>
              </div>
            </Link>

            <Link
              href="/visualization/attendance"
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7V10Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">선수별 참석률</h2>
                  <p className="text-sm text-gray-500">모든 선수의 참석률을 한눈에 확인</p>
                </div>
              </div>
            </Link>

            <Link
              href="/visualization/head-to-head"
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">상대전적</h2>
                  <p className="text-sm text-gray-500">선수별 상대전적 확인</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 