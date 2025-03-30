'use client';

import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';

const menuItems = [
  {
    name: '선수별 승률',
    href: '/visualization/win-rate',
    description: '모든 선수의 승률을 한눈에 확인',
    icon: '📊'
  },
  {
    name: '최대 연승 기록',
    href: '/visualization/win-streak',
    description: '선수별 최대 연승 기록 확인',
    icon: '🏆'
  },
  {
    name: '상대전적',
    href: '/visualization/head-to-head',
    description: '선수별 상대전적 확인',
    icon: '🤼'
  }
];

export default function VisualizationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">리그통계</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div
                key={item.href}
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => router.push(item.href)}
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{item.icon}</div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{item.name}</h2>
                      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 