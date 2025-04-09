'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

interface IPlayer {
  id: string;
  name: string;
  level: number;
}

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    match_date: formatInTimeZone(new Date(), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm"),
    winner_id: '',
    loser_id: '',
    winner_sets: 3,
    loser_sets: 0
  });

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) {
          throw new Error('선수 목록을 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        // 선수 이름 기준으로 가나다순 정렬
        const sortedPlayers = data.sort((a: IPlayer, b: IPlayer) => 
          a.name.localeCompare(b.name, 'ko-KR')
        );
        setPlayers(sortedPlayers);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 같은 선수를 선택했는지 확인
      if (formData.winner_id === formData.loser_id) {
        alert('같은 선수를 선택할 수 없습니다.');
        return;
      }

      // 입력된 시간을 그대로 ISO 문자열로 변환 (이미 한국 시간임)
      const match_date = new Date(formData.match_date).toISOString();

      // 세트 스코어를 비교하여 winner와 loser를 결정
      const player1Id = formData.winner_id;
      const player2Id = formData.loser_id;
      const player1Sets = formData.winner_sets;
      const player2Sets = formData.loser_sets;

      // 세트 스코어가 높은 선수가 winner가 되도록 데이터 재구성
      const matchData = {
        match_date: match_date,
        winner_id: player1Sets > player2Sets ? player1Id : player2Id,
        loser_id: player1Sets > player2Sets ? player2Id : player1Id,
        winner_sets: Math.max(player1Sets, player2Sets),
        loser_sets: Math.min(player1Sets, player2Sets)
      };

      console.log('Sending match data:', matchData);

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || '경기 결과 저장에 실패했습니다.');
      }

      router.push('/matches');
    } catch (err) {
      console.error('Error details:', err);
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium text-gray-900">경기 결과 입력</h2>
            <Link
              href="/matches"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              돌아가기
            </Link>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="match_date" className="block text-sm font-medium text-gray-700">
                경기 날짜 및 시간
              </label>
              <input
                type="datetime-local"
                id="match_date"
                name="match_date"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="winner_id" className="block text-sm font-medium text-gray-700">
                  선수 1
                </label>
                <select
                  id="winner_id"
                  name="winner_id"
                  value={formData.winner_id}
                  onChange={(e) => setFormData({ ...formData, winner_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">선수 선택</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.level}부)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="loser_id" className="block text-sm font-medium text-gray-700">
                  선수 2
                </label>
                <select
                  id="loser_id"
                  name="loser_id"
                  value={formData.loser_id}
                  onChange={(e) => setFormData({ ...formData, loser_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">선수 선택</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.level}부)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="winner_sets" className="block text-sm font-medium text-gray-700">
                  선수 1 세트 수
                </label>
                <input
                  type="number"
                  id="winner_sets"
                  name="winner_sets"
                  min="0"
                  value={formData.winner_sets}
                  onChange={(e) => setFormData({ ...formData, winner_sets: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="loser_sets" className="block text-sm font-medium text-gray-700">
                  선수 2 세트 수
                </label>
                <input
                  type="number"
                  id="loser_sets"
                  name="loser_sets"
                  min="0"
                  value={formData.loser_sets}
                  onChange={(e) => setFormData({ ...formData, loser_sets: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/matches')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 