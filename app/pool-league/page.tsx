'use client';

export const dynamic = 'force-dynamic'  // 캐싱 비활성화
export const revalidate = 0  // 캐싱 시간 0으로 설정

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';

interface IPlayer {
  id: string;
  name: string;
  level: number;
}

interface IPoolLeagueStats {
  player_id: string;
  player_name: string;
  player_level: number;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  win_rate: number;
  total_matches: number;
}

interface IMatchResult {
  id: string;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  match_date: string;
  winner: {
    id: string;
    name: string;
    level: number;
  };
  loser: {
    id: string;
    name: string;
    level: number;
  };
}

interface IPlayerStats {
  id: string;
  name: string;
  level: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  winRate?: number;
  totalGames?: number;
  recentMatches: Array<{
    id: string;
    date: string;
    isWin: boolean;
    winner: string;
    loser: string;
    winnerSets: number;
    loserSets: number;
  }>;
}

interface IMatch {
  id: string;
  winner_id: string;
  loser_id: string;
  winner_sets: number;
  loser_sets: number;
  match_date: string;
  created_at: string;
  winners: {
    id: string;
    name: string;
    level: number;
  };
  losers: {
    id: string;
    name: string;
    level: number;
  };
}

interface DateRange {
  firstMatchDate: string;
  lastMatchDate: string;
}

interface IMatchAnalysis {
  id: string;
  analysis: string;
}

export default function PoolLeaguePage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyRankings, setDailyRankings] = useState<IPoolLeagueStats[]>([]);
  const [allMatches, setAllMatches] = useState<IMatch[]>([]);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [matchAnalyses, setMatchAnalyses] = useState<{ [key: string]: string }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 날짜 선택 핸들러
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  // 데이터 초기화 함수
  const resetData = () => {
    setDailyRankings([]);
    setAllMatches([]);
    setPlayers([]);
    setError(null);
  };

  // 데이터 로딩 함수
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      resetData();
      
      // 선택된 날짜의 시작과 끝을 한국 시간으로 설정
      const startDate = formatInTimeZone(
        new Date(selectedDate + 'T00:00:00'),
        'Asia/Seoul',
        "yyyy-MM-dd'T'00:00:00XXX"
      );
      const endDate = formatInTimeZone(
        new Date(selectedDate + 'T23:59:59'),
        'Asia/Seoul',
        "yyyy-MM-dd'T'23:59:59XXX"
      );

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);

      // 선수 정보 먼저 가져오기
      const playersResponse = await fetch('/api/users');
      if (!playersResponse.ok) {
        throw new Error('선수 정보를 불러오는데 실패했습니다.');
      }
      const playersData = await playersResponse.json();
      console.log('선수 정보 데이터:', playersData);

      if (playersData.players) {
        setPlayers(playersData.players);
      }

      // 선수 통계 가져오기
      const statsResponse = await fetch(`/api/player-stats?${queryParams.toString()}`);
      if (!statsResponse.ok) {
        throw new Error('선수 통계를 불러오는데 실패했습니다.');
      }
      const statsData = await statsResponse.json();
      console.log('선수 통계 데이터:', statsData);

      if (statsData.stats) {
        setDailyRankings(statsData.stats);
      }

      // 경기 기록 가져오기 (전체 매트릭스용)
      const matchesResponse = await fetch(`/api/matches?${queryParams.toString()}`);
      if (!matchesResponse.ok) {
        throw new Error('경기 기록을 불러오는데 실패했습니다.');
      }
      const matchesData = await matchesResponse.json();
      console.log('경기 기록 데이터:', matchesData);

      if (matchesData.matches) {
        setAllMatches(matchesData.matches);
      }

    } catch (err) {
      console.error('데이터 로딩 에러:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 날짜 설정
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await fetch('/api/matches/date-range');
        if (!response.ok) {
          throw new Error('날짜 범위를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        
        // match_date 기준으로 날짜 범위 설정
        setDateRange({
          firstMatchDate: data.firstMatchDate ? formatInTimeZone(new Date(data.firstMatchDate), 'Asia/Seoul', 'yyyy-MM-dd') : null,
          lastMatchDate: data.lastMatchDate ? formatInTimeZone(new Date(data.lastMatchDate), 'Asia/Seoul', 'yyyy-MM-dd') : null
        });
        
        // 날짜가 선택되지 않은 경우 가장 최근 match_date로 설정
        if (!selectedDate && data.lastMatchDate) {
          setSelectedDate(formatInTimeZone(new Date(data.lastMatchDate), 'Asia/Seoul', 'yyyy-MM-dd'));
        }
      } catch (err) {
        console.error('Error fetching date range:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      }
    };

    fetchDateRange();
  }, []);

  // 선택된 날짜가 변경될 때마다 데이터 로드
  useEffect(() => {
    if (selectedDate) {
      loadData();
    }
  }, [selectedDate]);

  useEffect(() => {
    const analyzeLatestMatch = async () => {
      if (isAnalyzing || !allMatches.length || !dailyRankings.length) return;

      const latestMatch = allMatches[0];
      if (matchAnalyses[latestMatch.id]) return;

      setIsAnalyzing(true);
      try {
        await analyzeMatch(latestMatch);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeLatestMatch();
  }, [allMatches, dailyRankings]);

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    try {
      return formatInTimeZone(new Date(dateString), 'Asia/Seoul', 'yyyy년 MM월 dd일', { locale: ko });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  const analyzeMatch = async (match: IMatch) => {
    try {
      const winner = dailyRankings.find(p => p.player_id === match.winner_id);
      const loser = dailyRankings.find(p => p.player_id === match.loser_id);
      
      if (!winner || !loser) return;

      const winnerWinRate = ((winner.wins / (winner.wins + winner.losses)) * 100).toFixed(1);
      const loserWinRate = ((loser.wins / (loser.wins + loser.losses)) * 100).toFixed(1);

      console.log('API 요청 데이터:', {
        matchId: match.id,
        winner: winner.player_name,
        loser: loser.player_name,
        winnerWinRate,
        loserWinRate
      });
      
      const response = await fetch('/api/match-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match,
          playerStats: {
            winner: {
              ...winner,
              winRate: winnerWinRate,
            },
            loser: {
              ...loser,
              winRate: loserWinRate,
            },
          },
        }),
      });

      if (!response.ok) throw new Error('분석 요청 실패');
      
      const data = await response.json();
      console.log('AI 분석 응답:', data);
      
      setMatchAnalyses(prev => ({
        ...prev,
        [match.id]: data.analysis,
      }));
    } catch (error) {
      console.error('Match analysis error:', error);
    }
  };

  // 경기 결과 등록
  const handleSubmitMatch = async (matchData: any) => {
    try {
      setError(null);
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '경기 결과 등록에 실패했습니다.');
      }

      // 성공적으로 등록 후 데이터 갱신
      await loadData();
      return true;
    } catch (err) {
      console.error('경기 결과 등록 에러:', err);
      setError(err instanceof Error ? err.message : '경기 결과 등록에 실패했습니다.');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">데이터를 불러오는 중...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto py-2 px-2 sm:px-4 lg:px-6">
        <div className="px-2 py-2 sm:px-0">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-2">실시간 풀리그</h1>
            <div className="flex items-center space-x-2">
              <label htmlFor="date" className="text-sm font-medium text-gray-700">
                날짜 선택
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={dateRange?.firstMatchDate || undefined}
                max={dateRange?.lastMatchDate || undefined}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {allMatches.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-sm text-yellow-700">
                    선택한 날짜에 경기 결과가 없습니다.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* AI 분석 결과 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-2 py-2 sm:p-3">
                  <h2 className="text-base font-medium text-gray-900 mb-2">
                    AI 경기 분석
                  </h2>
                  <div className="space-y-2">
                    {allMatches.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-500">
                              {format(new Date(allMatches[0].match_date), 'HH:mm')}
                            </span>
                            <span className="text-xs font-medium">
                              {allMatches[0].winners?.name} vs {allMatches[0].losers?.name}
                            </span>
                          </div>
                          <span className="text-xs font-medium">
                            {allMatches[0].winner_sets} - {allMatches[0].loser_sets}
                          </span>
                        </div>
                        {matchAnalyses[allMatches[0].id] ? (
                          <p className="text-sm text-gray-600 break-words whitespace-pre-wrap line-clamp-2 min-h-[2.5rem]">
                            {matchAnalyses[allMatches[0].id]}
                          </p>
                        ) : (
                          <div className="flex items-center justify-center h-[2.5rem]">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 일일 순위 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-2 py-3 sm:p-4">
                  <h2 className="text-base font-medium text-gray-900 mb-3">
                    {formatDate(selectedDate)} 순위
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">선수</th>
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">승</th>
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">패</th>
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">총 경기</th>
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">승률</th>
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">세트</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dailyRankings.map((player, index) => {
                          const totalGames = player.wins + player.losses;
                          const winRate = totalGames > 0
                            ? ((player.wins / totalGames) * 100).toFixed(1)
                            : '0.0';
                            
                          return (
                            <tr key={player.player_id} className={`hover:bg-gray-50 ${
                              index === 0 ? 'bg-yellow-50' :
                              index === 1 ? 'bg-gray-50' :
                              index === 2 ? 'bg-orange-50' :
                              ''
                            }`}>
                              <td className="px-2 py-2 whitespace-nowrap">
                                <div className="flex items-center justify-center">
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                    index === 2 ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-50 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center justify-center px-1.5 py-0.5 mr-1.5 text-xs font-bold leading-none rounded ${
                                    player.player_level === 1 ? 'bg-red-500 text-white' :
                                    player.player_level === 2 ? 'bg-orange-500 text-white' :
                                    player.player_level === 3 ? 'bg-yellow-500 text-white' :
                                    player.player_level === 4 ? 'bg-green-500 text-white' :
                                    player.player_level === 5 ? 'bg-blue-500 text-white' :
                                    player.player_level === 6 ? 'bg-indigo-500 text-white' :
                                    player.player_level === 7 ? 'bg-purple-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }`}>
                                    {player.player_level}부
                                  </span>
                                  <span className="text-xs font-medium text-gray-900">{player.player_name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-green-600 font-medium text-center">
                                {player.wins}
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-red-600 font-medium text-center">
                                {player.losses}
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 font-medium text-center">
                                {totalGames}
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-blue-600 font-medium text-center">
                                {winRate}%
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 text-center">
                                <span className="font-medium">{player.sets_won}</span>
                                <span className="text-gray-500 mx-1">-</span>
                                <span className="font-medium">{player.sets_lost}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 전체 매트릭스 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-2 py-3 sm:p-4">
                  <h2 className="text-base font-medium text-gray-900 mb-3">전체 매트릭스</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">선수</th>
                          {[...dailyRankings].sort((a, b) => a.player_name.localeCompare(b.player_name, 'ko')).map(player => (
                            <th key={player.player_id} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {player.player_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...dailyRankings].sort((a, b) => a.player_name.localeCompare(b.player_name, 'ko')).map(player => (
                          <tr key={player.player_id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 mr-1.5 text-xs font-bold leading-none rounded ${
                                  player.player_level === 1 ? 'bg-red-500 text-white' :
                                  player.player_level === 2 ? 'bg-orange-500 text-white' :
                                  player.player_level === 3 ? 'bg-yellow-500 text-white' :
                                  player.player_level === 4 ? 'bg-green-500 text-white' :
                                  player.player_level === 5 ? 'bg-blue-500 text-white' :
                                  player.player_level === 6 ? 'bg-indigo-500 text-white' :
                                  player.player_level === 7 ? 'bg-purple-500 text-white' :
                                  'bg-gray-500 text-white'
                                }`}>
                                  {player.player_level}부
                                </span>
                                <span className="text-xs font-medium text-gray-900">{player.player_name}</span>
                              </div>
                            </td>
                            {[...dailyRankings].sort((a, b) => a.player_name.localeCompare(b.player_name, 'ko')).map(opponent => {
                              if (player.player_id === opponent.player_id) {
                                return (
                                  <td key={opponent.player_id} className="px-2 py-2 whitespace-nowrap text-xs text-gray-400">
                                    -
                                  </td>
                                );
                              }

                              // 해당 선수들의 경기 결과 찾기 (match_date 기준)
                              const match = allMatches.find(m => 
                                (m.winner_id === player.player_id && m.loser_id === opponent.player_id) ||
                                (m.winner_id === opponent.player_id && m.loser_id === player.player_id)
                              );

                              if (!match) {
                                return (
                                  <td key={opponent.player_id} className="px-2 py-2 whitespace-nowrap text-xs text-gray-400">
                                    -
                                  </td>
                                );
                              }

                              const isWin = match.winner_id === player.player_id;

                              return (
                                <td key={opponent.player_id} className="px-2 py-2 whitespace-nowrap text-xs">
                                  <span className={`font-medium ${
                                    isWin ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {isWin ? 'Win' : 'Lose'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 