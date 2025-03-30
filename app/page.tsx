'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Next.js router를 사용하여 클라이언트 측에서 리다이렉트
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-xl mb-8">흥탁 리그관리 페이지로 이동 중...</div>
      
      <div className="space-y-4">
        <Link href="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
