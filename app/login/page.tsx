'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PinInput } from '@/components/ui/pin-input';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinComplete = async (pin: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-4">
          <span className="text-4xl">🏓</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">흥덕탁구단</h1>
        <div className="mb-6">
          <p className="text-center text-gray-600 mb-4">PIN 번호를 입력하세요</p>
          <PinInput onComplete={handlePinComplete} />
        </div>
        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}
        {isLoading && (
          <p className="text-blue-500 text-center text-sm">로그인 중...</p>
        )}
      </div>
    </div>
  );
} 