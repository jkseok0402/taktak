'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // 3초 후 대시보드로 리다이렉트
    const redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-red-500 mb-4">페이지를 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-6">
          요청하신 페이지가 존재하지 않습니다. 3초 후 대시보드로 이동합니다.
        </p>
        <Link 
          href="/dashboard" 
          className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-200"
        >
          지금 대시보드로 이동
        </Link>
      </div>
    </div>
  );
} 