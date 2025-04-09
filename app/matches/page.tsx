'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface IPlayer {
  id: string;
  name: string;
  level: number;
}

interface IMatch {
  id: string;
  match_date: string;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  created_at: string;
  winners: IPlayer;
  losers: IPlayer;
}

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

// 날짜를 한국어 형식으로 변환하는 함수
function formatDate(dateString: string) {
  return formatInTimeZone(
    new Date(dateString),
    'Asia/Seoul',
    'yyyy년 MM월 dd일 HH:mm',
    { locale: ko }
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // 선수 목록을 가져오는 함수
  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('선수 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      const sortedPlayers = data.sort((a: IPlayer, b: IPlayer) => 
        a.name.localeCompare(b.name, 'ko-KR')
      );
      setPlayers(sortedPlayers);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  };

  // 경기 결과를 가져오는 함수
  const fetchMatches = async (playerId?: string, page: number = 1) => {
    try {
      setLoading(true);
      const url = playerId 
        ? `/api/matches?playerId=${playerId}&page=${page}&limit=${itemsPerPage}`
        : `/api/matches?page=${page}&limit=${itemsPerPage}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('경기 결과를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      const sortedMatches = data.matches.sort((a: IMatch, b: IMatch) => 
        new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      );
      setMatches(sortedMatches);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchMatches(undefined, currentPage);
  }, [currentPage]);

  // 선수 선택 시 경기 결과 필터링
  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setCurrentPage(1); // 선수 변경 시 첫 페이지로 리셋
    fetchMatches(playerId || undefined, 1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchMatches(selectedPlayerId || undefined, newPage);
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
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-gray-900">경기 결과</h2>
              <select
                value={selectedPlayerId}
                onChange={(e) => handlePlayerChange(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">전체 선수</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.level}부)
                  </option>
                ))}
              </select>
            </div>
            <Link
              href="/matches/new"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              경기 결과 입력
            </Link>
          </div>
          
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="bg-gray-50 rounded-lg p-3 relative">
                <div className="text-sm text-gray-500 mb-2">
                  {formatDate(match.match_date)}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-green-600 font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[match.winners.level as keyof typeof levelStyles]} mr-2`}>
                        {match.winners.level}부
                      </span>
                      {match.winners.name}
                    </div>
                  </div>
                  <div className="flex items-center mx-2 text-lg font-semibold">
                    <span className="text-green-600">{match.winner_sets}</span>
                    <span className="mx-1">-</span>
                    <span className="text-red-600">{match.loser_sets}</span>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-red-600 font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[match.losers.level as keyof typeof levelStyles]} mr-2`}>
                        {match.losers.level}부
                      </span>
                      {match.losers.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('정말로 이 경기 결과를 삭제하시겠습니까?')) {
                      try {
                        const response = await fetch(`/api/matches/${match.id}`, { 
                          method: 'DELETE',
                        });
                        const data = await response.json();
                        
                        if (!response.ok) {
                          throw new Error(data.error || '삭제에 실패했습니다.');
                        }

                        // 성공적으로 삭제된 경우 UI 업데이트
                        setMatches(prevMatches => 
                          prevMatches.filter(m => m.id !== match.id)
                        );
                      } catch (err) {
                        console.error('Delete error:', err);
                        alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
                      }
                    }
                  }}
                  className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {/* 페이지네이션 컨트롤 */}
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-3 py-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 