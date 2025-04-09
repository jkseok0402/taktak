'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { name: '대시보드', path: '/dashboard' },
    { name: '경기 결과', path: '/matches' },
    { name: '리그 통계', path: '/visualization' },
    { name: '선수 통계', path: '/stats' },
    { name: '실시간 풀리그', path: '/pool-league' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 font-['Noto_Sans_KR']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-500 transition-all duration-300 tracking-tight"
              >
                흥덕탁구단
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 relative group tracking-normal ${
                    isActive(item.path)
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform scale-x-0 transition-transform duration-200 group-hover:scale-x-100 ${
                    isActive(item.path) ? 'scale-x-100' : ''
                  }`} />
                </Link>
              ))}
            </div>
          </div>

          {/* 선수 관리 메뉴 */}
          <div className="hidden sm:flex sm:items-center">
            <Link
              href="/players"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 relative group tracking-normal ${
                isActive('/players')
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              선수 관리
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform scale-x-0 transition-transform duration-200 group-hover:scale-x-100 ${
                isActive('/players') ? 'scale-x-100' : ''
              }`} />
            </Link>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="sr-only">메뉴 열기</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`sm:hidden ${isOpen ? 'block' : 'hidden'} bg-white border-t border-gray-100`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`block pl-4 pr-4 py-3 text-base font-medium transition-all duration-200 tracking-normal ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/players"
            className={`block pl-4 pr-4 py-3 text-base font-medium transition-all duration-200 tracking-normal ${
              isActive('/players')
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
            }`}
            onClick={() => setIsOpen(false)}
          >
            선수 관리
          </Link>
        </div>
      </div>
    </nav>
  );
} 