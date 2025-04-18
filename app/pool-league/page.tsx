'use client';

export const dynamic = 'force-dynamic'; // 항상 서버에서 동적으로 렌더링
export const revalidate = 0; // 캐싱 시간을 0으로 설정

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
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
  const [matchAnalyses, setMatchAnalyses] = useState<{ summary?: string }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [remainingMatches, setRemainingMatches] = useState<Array<[string, string]>>([]);
  const [selectedMatch, setSelectedMatch] = useState<[string, string] | null>(null);
  const [matchResult, setMatchResult] = useState({
    winner_sets: 0,
    loser_sets: 0
  });
  const [filteredPlayer, setFilteredPlayer] = useState<string>('');

  // 선수 선택 상태를 로컬 스토리지에서 불러오는 함수
  const loadSelectedPlayersFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedPlayers = localStorage.getItem('selectedPlayers');
      return savedPlayers ? JSON.parse(savedPlayers) : [];
    }
    return [];
  };

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(loadSelectedPlayersFromStorage());

  // 날짜 선택 핸들러 수정
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    // loadData는 selectedDate가 변경될 때 useEffect에서 자동으로 호출됨
  };

  // 데이터 초기화 함수
  const resetData = () => {
    setDailyRankings([]);
    setAllMatches([]);
    setPlayers([]);
    setError(null);
  };

  // 경기 순서 생성 함수 수정
  const generateMatchOrder = (playerIds: string[]) => {
    if (playerIds.length < 2) return [];
    
    // 선수 ID를 정렬하여 일관된 순서 보장
    const sortedPlayerIds = [...playerIds].sort();
    let matches: Array<[string, string]> = [];
    let adjustedPlayerIds = [...sortedPlayerIds];
    
    // 홀수인 경우 더미 플레이어 추가
    if (adjustedPlayerIds.length % 2 !== 0) {
      adjustedPlayerIds.push('dummy');
    }
    
    const n = adjustedPlayerIds.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;

    for (let round = 0; round < rounds; round++) {
      let roundMatches: Array<[string, string]> = [];
      
      // 첫 번째 선수는 고정
      const firstPlayer = adjustedPlayerIds[0];
      
      // 나머지 선수들은 시계 방향으로 회전
      let others = adjustedPlayerIds.slice(1);
      for (let i = 0; i < round; i++) {
        others.unshift(others.pop()!);
      }
      
      // 각 라운드의 매치 생성
      for (let i = 0; i < matchesPerRound; i++) {
        const player1 = i === 0 ? firstPlayer : others[i - 1];
        const player2 = others[others.length - 1 - i];
        
        // 더미 플레이어가 포함된 매치는 제외
        if (player1 !== 'dummy' && player2 !== 'dummy') {
          roundMatches.push([player1, player2]);
        }
      }
      
      matches = [...matches, ...roundMatches];
    }
    
    return matches;
  };

  // loadPlayers 함수 수정
  const loadPlayers = async () => {
    try {
      const timestamp = new Date().getTime(); // 캐시 무효화를 위한 타임스탬프
      const response = await fetch(`/api/users?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

      if (!response.ok) {
        throw new Error('선수 데이터를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (!data || !data.players || !Array.isArray(data.players)) {
        throw new Error('선수 데이터 형식이 올바르지 않습니다.');
      }

      setPlayers(data.players);
    } catch (err) {
      console.error('선수 데이터 로딩 에러:', err);
      setError(err instanceof Error ? err.message : '선수 데이터를 불러오는데 실패했습니다.');
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    // 이전 데이터 초기화
    setDailyRankings([]);
    setAllMatches([]);
    setPlayers([]);
    
    // 오늘 날짜 설정 (이 상태 변경이 다른 useEffect를 트리거하여 loadData() 호출함)
    const today = getCurrentKoreanDate();
    console.log(`[초기 로딩] 오늘 날짜 설정: ${today}`);
    setSelectedDate(today);
  }, []); // 빈 의존성 배열

  // 매 3분마다 자동 새로고침
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('자동 새로고침 실행...');
      if (selectedDate) {
        loadData();
      }
    }, 3 * 60 * 1000); // 3분마다
    
    return () => clearInterval(intervalId);
  }, [selectedDate]);

  // 선택된 날짜가 변경될 때 데이터 로드
  useEffect(() => {
    if (selectedDate) {
      loadData();
    }
  }, [selectedDate]); // selectedDate만 의존성으로 설정

  // 데이터 로드 상태 디버깅
  useEffect(() => {
    console.log(`allMatches 개수: ${allMatches.length}, dailyRankings 개수: ${dailyRankings.length}`);
  }, [allMatches, dailyRankings]);

  // loadData 함수 수정
  const loadData = async () => {
    if (!selectedDate) return;

    try {
      console.log(`[${new Date().toISOString()}] 날짜 로딩 시작: ${selectedDate}`);
      setLoading(true);
      setError(null);

      // 한국 시간 기준으로 시작과 끝 설정 (UTC+9 고려)
      const selectedKST = new Date(selectedDate + 'T00:00:00+09:00');
      
      // UTC 기준 시작 시간 (한국 시간 00:00:00)
      const startUTC = new Date(selectedKST);
      
      // UTC 기준 종료 시간 (한국 시간 23:59:59.999)
      const endUTC = new Date(selectedKST);
      endUTC.setHours(23, 59, 59, 999);
      
      // ISO 형식으로 변환
      const startDate = startUTC.toISOString();
      const endDate = endUTC.toISOString();

      console.log('날짜 범위 조회:', { 
        선택날짜: selectedDate,
        시작시간UTC: startDate,
        종료시간UTC: endDate,
        KST변환시작: new Date(startDate).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}),
        KST변환종료: new Date(endDate).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})
      });

      // 캐시 무효화를 위한 타임스탬프 추가
      const timestamp = new Date().getTime();

      // 선수 정보와 경기 데이터를 병렬로 로드
      const [playersResponse, matchesResponse] = await Promise.all([
        fetch(`/api/users?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/matches?${new URLSearchParams({
          startDate,
          endDate,
          t: timestamp.toString() // 타임스탬프 추가
        }).toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
      ]);

      if (!playersResponse.ok || !matchesResponse.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const [playersData, matchesData] = await Promise.all([
        playersResponse.json(),
        matchesResponse.json()
      ]);

      if (!playersData || !playersData.players || !Array.isArray(playersData.players)) {
        throw new Error('선수 데이터 형식이 올바르지 않습니다.');
      }

      if (!matchesData || !matchesData.matches || !Array.isArray(matchesData.matches)) {
        throw new Error('경기 데이터 형식이 올바르지 않습니다.');
      }

      // 모든 필요한 데이터를 준비한 후 한 번에 상태 업데이트
      const newPlayers = playersData.players;
      const newMatches = matchesData.matches;
      const dailyStats = calculateDailyStats(newMatches, newPlayers);
      
      // 순차적으로 상태 업데이트
      setPlayers(newPlayers);
      setAllMatches(newMatches);
      setDailyRankings(dailyStats);

    } catch (err) {
      console.error('데이터 로딩 에러:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      console.log(`[${new Date().toISOString()}] 날짜 로딩 완료: ${selectedDate}`);
    }
  };

  // 현재 날짜를 한국 시간으로 가져오는 함수 수정
  const getCurrentKoreanDate = () => {
    const now = new Date();
    return format(now, 'yyyy-MM-dd');
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return format(date, 'yyyy년 MM월 dd일', { locale: ko });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // 시간 포맷 함수
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Time formatting error:', error);
      return '';
    }
  };

  // analyzeMatches 함수 수정
  const analyzeMatches = async () => {
    if (isAnalyzing || !allMatches.length || !dailyRankings.length) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      // 데이터 형식을 맞추기 위해 matches와 rankings를 변환
      const formattedMatches = allMatches.map(match => {
        // winners와 losers 객체가 존재하는지 확인
        if (!match.winners || !match.losers) {
          throw new Error('경기 데이터가 올바르지 않습니다.');
        }

        return {
          ...match,
          winners: {
            id: match.winner_id,
            name: match.winners.name || '이름 없음',
            level: match.winners.level || 1
          },
          losers: {
            id: match.loser_id,
            name: match.losers.name || '이름 없음',
            level: match.losers.level || 1
          }
        };
      });

      const formattedRankings = dailyRankings.map(rank => ({
        ...rank,
        player_name: rank.player_name || '이름 없음',
        win_rate: rank.win_rate || 0,
        wins: rank.wins || 0,
        losses: rank.losses || 0
      }));

      const response = await fetch('/api/match-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matches: formattedMatches,
          rankings: formattedRankings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '분석 요청 실패');
      }
      
      const data = await response.json();
      setMatchAnalyses({ summary: data.analysis });
    } catch (error) {
      console.error('Match analysis error:', error);
      setError(error instanceof Error ? error.message : '경기 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 경기 결과가 변경될 때마다 분석 실행
  useEffect(() => {
    if (allMatches.length > 0 && dailyRankings.length > 0) {
      analyzeMatches();
    }
  }, [allMatches, dailyRankings]);

  // 경기 결과 등록 함수 수정
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '경기 결과 등록에 실패했습니다.');
      }

      // 전체 데이터 리로드
      await loadData();
      return true;

    } catch (err) {
      console.error('경기 결과 등록 에러:', err);
      setError(err instanceof Error ? err.message : '경기 결과 등록에 실패했습니다.');
      throw err;
    }
  };

  // 경기 결과 입력 핸들러 수정
  const handleMatchResultSubmit = async (player1Id: string, player2Id: string, player1Sets: number, player2Sets: number) => {
    try {
      const winner_id = player1Sets > player2Sets ? player1Id : player2Id;
      const loser_id = player1Sets > player2Sets ? player2Id : player1Id;
      const winner_sets = Math.max(player1Sets, player2Sets);
      const loser_sets = Math.min(player1Sets, player2Sets);

      // 현재 날짜를 한국 시간 기준으로 설정 (UTC+9)
      const now = new Date();
      // ISO 문자열로 현재 날짜 가져오기 - 서버는 UTC로 처리
      const match_date = now.toISOString();

      // 경기 결과 제출
      const success = await handleSubmitMatch({
        winner_id,
        loser_id,
        winner_sets,
        loser_sets,
        match_date
      });

      if (success) {
        // 입력 폼 초기화
        setSelectedMatch(null);
        setMatchResult({ winner_sets: 0, loser_sets: 0 });
        
        // 상태 초기화 후 새로운 데이터 로드
        setAllMatches([]);
        setDailyRankings([]);
        
        // 지연 후 데이터 다시 로드
        setTimeout(() => {
          loadData();
        }, 500);
      }
    } catch (err) {
      console.error('경기 결과 등록 실패:', err);
      setError('경기 결과 등록에 실패했습니다.');
    }
  };

  // 당일 통계 계산 함수
  const calculateDailyStats = (matches: IMatch[], players: IPlayer[]): IPoolLeagueStats[] => {
    // 참여한 선수들의 통계 초기화
    const playerStats = new Map<string, IPoolLeagueStats>();
    
    // 경기 결과로 통계 계산
    matches.forEach(match => {
      // 승자 통계 업데이트
      if (!playerStats.has(match.winner_id)) {
        const winner = players.find(p => p.id === match.winner_id);
        if (winner) {
          playerStats.set(match.winner_id, {
            player_id: winner.id,
            player_name: winner.name,
            player_level: winner.level,
            wins: 0,
            losses: 0,
            sets_won: 0,
            sets_lost: 0,
            win_rate: 0,
            total_matches: 0
          });
        }
      }

      // 패자 통계 업데이트
      if (!playerStats.has(match.loser_id)) {
        const loser = players.find(p => p.id === match.loser_id);
        if (loser) {
          playerStats.set(match.loser_id, {
            player_id: loser.id,
            player_name: loser.name,
            player_level: loser.level,
            wins: 0,
            losses: 0,
            sets_won: 0,
            sets_lost: 0,
            win_rate: 0,
            total_matches: 0
          });
        }
      }

      const winnerStats = playerStats.get(match.winner_id);
      const loserStats = playerStats.get(match.loser_id);

      if (winnerStats) {
        winnerStats.wins += 1;
        winnerStats.sets_won += match.winner_sets;
        winnerStats.sets_lost += match.loser_sets;
        winnerStats.total_matches += 1;
        winnerStats.win_rate = (winnerStats.wins / winnerStats.total_matches) * 100;
      }

      if (loserStats) {
        loserStats.losses += 1;
        loserStats.sets_won += match.loser_sets;
        loserStats.sets_lost += match.winner_sets;
        loserStats.total_matches += 1;
        loserStats.win_rate = (loserStats.wins / loserStats.total_matches) * 100;
      }
    });

    // 정렬된 결과 반환
    const statsArray = Array.from(playerStats.values());
    
    // 정렬 로직 수정
    const sortedStats = [...statsArray].sort((a, b) => {
      // 1. 승수가 높은 순
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }

      // 2. 승수가 같을 경우 승자승 비교
      const headToHeadMatches = matches.filter(m => 
        (m.winner_id === a.player_id && m.loser_id === b.player_id) ||
        (m.winner_id === b.player_id && m.loser_id === a.player_id)
      );

      if (headToHeadMatches.length > 0) {
        const aWinsAgainstB = headToHeadMatches.filter(m => m.winner_id === a.player_id).length;
        const bWinsAgainstA = headToHeadMatches.filter(m => m.winner_id === b.player_id).length;
        
        if (aWinsAgainstB !== bWinsAgainstA) {
          return bWinsAgainstA - aWinsAgainstB; // 승자승이 높은 선수가 더 높은 순위
        }
      }

      // 3. 득실차 비교
      const aDiff = a.sets_won - a.sets_lost;
      const bDiff = b.sets_won - b.sets_lost;
      return bDiff - aDiff;
    });

    // 정렬 후 상태 로깅
    console.log("정렬된 결과:", sortedStats.map(player => ({
      name: player.player_name,
      wins: player.wins,
      setDiff: player.sets_won - player.sets_lost
    })));

    return sortedStats;
  };

  // 선수 선택 핸들러 수정
  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSelection = prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId];
      
      // 선수 선택이 변경될 때마다 로컬 스토리지에 저장
      localStorage.setItem('selectedPlayers', JSON.stringify(newSelection));
      
      // 선수 선택이 변경될 때만 매치 순서 생성
      const orderedMatches = generateMatchOrder(newSelection);
      setRemainingMatches(orderedMatches);
      
      return newSelection;
    });
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
      
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* 헤더 섹션 - 수정된 부분 */}
        <div className="flex flex-row items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">🏓 실시간 풀리그</h1>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="p-2 border-2 border-gray-300 rounded-lg text-sm sm:text-base"
            />
          </div>
        </div>

        {/* 메인 컨텐츠 영역 - 수직 배치 */}
        <div className="space-y-4 sm:space-y-6">
          {/* 1. AI 경기 분석 */}
          {allMatches.length > 0 && (
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">AI 경기 분석</h2>
              <div className="space-y-4">
                {matchAnalyses.summary ? (
                  <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                    <p className="text-base sm:text-lg md:text-xl text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {matchAnalyses.summary}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. 오늘의 경기 결과 */}
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">오늘의 경기 결과</h2>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">순위</th>
                      <th className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">선수</th>
                      <th className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">승</th>
                      <th className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">패</th>
                      <th className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">승률</th>
                      <th className="hidden sm:table-cell p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">진행률</th>
                      <th className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">득실차</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...dailyRankings].map((stat, index) => {
                      const possibleMatches = dailyRankings.length - 1;
                      const totalMatches = stat.wins + stat.losses;
                      const progressRate = Math.round((totalMatches / possibleMatches) * 100);
                            
                      return (
                        <tr key={stat.player_id} className={`hover:bg-gray-50 ${
                          index === 0 ? 'bg-yellow-50' :
                          index === 1 ? 'bg-gray-50' :
                          index === 2 ? 'bg-orange-50' :
                          ''
                        }`}>
                          <td className="p-2 sm:p-3 text-center">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-sm sm:text-base font-semibold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold rounded-full text-white ${
                                stat.player_level === 1 ? 'bg-red-500' :
                                stat.player_level === 2 ? 'bg-orange-500' :
                                stat.player_level === 3 ? 'bg-yellow-500' :
                                stat.player_level === 4 ? 'bg-green-500' :
                                stat.player_level === 5 ? 'bg-blue-500' :
                                stat.player_level === 6 ? 'bg-indigo-500' :
                                stat.player_level === 7 ? 'bg-purple-500' :
                                'bg-gray-500'
                              }`}>
                                {stat.player_level}부
                              </span>
                              <span>{stat.player_name}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold">{stat.wins}</td>
                          <td className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold">{stat.losses}</td>
                          <td className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold">{stat.win_rate.toFixed(1)}%</td>
                          <td className="hidden sm:table-cell p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg">
                            {totalMatches}/{possibleMatches} ({progressRate}%)
                          </td>
                          <td className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold">{stat.sets_won - stat.sets_lost}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. 전체 매트릭스 */}
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">전체 매트릭스</h2>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 sm:p-3 text-left text-sm sm:text-base md:text-lg font-semibold text-gray-600">선수</th>
                      {[...dailyRankings]
                        .sort((a, b) => a.player_name.localeCompare(b.player_name, 'ko'))
                        .map(player => (
                          <th key={player.player_id} className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg font-semibold text-gray-600">
                              {player.player_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                    {[...dailyRankings]
                      .sort((a, b) => a.player_name.localeCompare(b.player_name, 'ko'))
                      .map(player => (
                          <tr key={player.player_id} className="hover:bg-gray-50">
                          <td className="p-2 sm:p-3 text-left text-sm sm:text-base md:text-lg">{player.player_name}</td>
                          {[...dailyRankings]
                            .sort((a, b) => a.player_name.localeCompare(b.player_name, 'ko'))
                            .map(opponent => {
                              if (player.player_id === opponent.player_id) {
                                return (
                                  <td key={opponent.player_id} className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg text-gray-400">
                                    -
                                  </td>
                                );
                              }

                              const match = allMatches.find(m => 
                                (m.winner_id === player.player_id && m.loser_id === opponent.player_id) ||
                                (m.winner_id === opponent.player_id && m.loser_id === player.player_id)
                              );

                              if (!match) {
                                return (
                                  <td key={opponent.player_id} className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg text-gray-400">
                                    -
                                  </td>
                                );
                              }

                              const isWin = match.winner_id === player.player_id;
                              const score = isWin
                                ? `${match.winner_sets}-${match.loser_sets}`
                                : `${match.loser_sets}-${match.winner_sets}`;

                              return (
                                <td key={opponent.player_id} className="p-2 sm:p-3 text-center text-sm sm:text-base md:text-lg">
                                  <span className={`font-medium ${
                                    isWin ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {score}
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

          {/* 4. 경기 현황 */}
          {selectedPlayers.length > 1 && (
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">경기 현황</h2>
                <div className="w-full sm:w-auto">
                  <select
                    value={filteredPlayer}
                    onChange={(e) => setFilteredPlayer(e.target.value)}
                    className="w-full sm:w-48 p-2 border-2 border-gray-300 rounded-lg text-sm sm:text-base"
                  >
                    <option value="">전체 선수 보기</option>
                    {selectedPlayers.map(playerId => {
                      const player = players.find(p => p.id === playerId);
                      return player ? (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.level}부)
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {generateMatchOrder(selectedPlayers)
                  .filter(([player1Id, player2Id]) => {
                    if (!filteredPlayer) return true;
                    return player1Id === filteredPlayer || player2Id === filteredPlayer;
                  })
                  .map(([player1Id, player2Id], index) => {
                    const player1 = players.find(p => p.id === player1Id);
                    const player2 = players.find(p => p.id === player2Id);
                    const isSelected = selectedMatch?.[0] === player1Id && selectedMatch?.[1] === player2Id;
                    
                    const matchPlayed = allMatches.find(m => 
                      (m.winner_id === player1Id && m.loser_id === player2Id) ||
                      (m.winner_id === player2Id && m.loser_id === player1Id)
                    );

                    const getLevelBadgeColor = (level: number) => {
                      switch (level) {
                        case 1: return 'bg-red-500';
                        case 2: return 'bg-orange-500';
                        case 3: return 'bg-yellow-500';
                        case 4: return 'bg-green-500';
                        case 5: return 'bg-blue-500';
                        case 6: return 'bg-indigo-500';
                        case 7: return 'bg-purple-500';
                        default: return 'bg-gray-500';
                      }
                    };

                    const PlayerDisplay = ({ player }: { player: IPlayer | undefined }) => {
                      if (!player) return null;
                      return (
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold rounded-full text-white ${getLevelBadgeColor(player.level)}`}>
                            {player.level}부
                          </span>
                          <span>{player.name}</span>
                        </div>
                      );
                    };

                    if (matchPlayed) {
                      const winner = matchPlayed.winner_id === player1Id ? player1 : player2;
                      const loser = matchPlayed.winner_id === player1Id ? player2 : player1;
                      const winnerSets = matchPlayed.winner_sets;
                      const loserSets = matchPlayed.loser_sets;
                      
                      return (
                        <div key={`${player1Id}-${player2Id}`} 
                             className="bg-green-50 border-2 border-green-300 rounded-lg p-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl text-sm">
                            완료
                          </div>
                          <div className="flex flex-col items-center text-base sm:text-lg md:text-xl mt-4">
                            <span className="text-gray-600 font-semibold mb-2">{index + 1}번째 경기</span>
                            <div className="flex items-center gap-2 mb-2">
                              <PlayerDisplay player={winner} />
                              <span className="mx-2 font-bold text-green-600">{winnerSets}</span>
                              <span className="mx-1">:</span>
                              <span className="mx-2 font-bold text-red-600">{loserSets}</span>
                              <PlayerDisplay player={loser} />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={`${player1Id}-${player2Id}`} className="relative">
                        <button
                          onClick={() => setSelectedMatch([player1Id, player2Id])}
                          className={`w-full p-3 rounded-lg text-base sm:text-lg md:text-xl transition-colors relative overflow-hidden
                            ${isSelected
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-yellow-50 border-2 border-yellow-300 hover:border-yellow-400'
                            }`}
                        >
                          <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 rounded-bl text-sm">
                            대기중
                          </div>
                          <div className="flex flex-col items-center mt-4">
                            <span className="text-gray-600 font-semibold mb-2">{index + 1}번째 경기</span>
                            <div className="flex items-center gap-2">
                              <PlayerDisplay player={player1} />
                              <span className="mx-2">vs</span>
                              <PlayerDisplay player={player2} />
                            </div>
                          </div>
                        </button>

                        {isSelected && (
                          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-lg z-10 border-2 border-blue-200">
                            <div className="flex flex-col space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-base sm:text-lg md:text-xl mb-1">
                                    <PlayerDisplay player={player1} />
                                  </label>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-3]"
                                    min="0"
                                    max="3"
                                    className="w-full h-12 sm:h-14 text-center text-xl sm:text-2xl md:text-3xl border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={matchResult.winner_sets}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setMatchResult(prev => ({
                                        ...prev,
                                        winner_sets: value === '' ? 0 : parseInt(value)
                                      }));
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </div>
                                <div>
                                  <label className="block text-base sm:text-lg md:text-xl mb-1">
                                    <PlayerDisplay player={player2} />
                                  </label>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-3]"
                                    min="0"
                                    max="3"
                                    className="w-full h-12 sm:h-14 text-center text-xl sm:text-2xl md:text-3xl border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={matchResult.loser_sets}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setMatchResult(prev => ({
                                        ...prev,
                                        loser_sets: value === '' ? 0 : parseInt(value)
                                      }));
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedMatch(null);
                                    setMatchResult({ winner_sets: 0, loser_sets: 0 });
                                  }}
                                  className="px-4 py-2 text-base sm:text-lg md:text-xl bg-gray-200 rounded hover:bg-gray-300"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleMatchResultSubmit(
                                    player1Id,
                                    player2Id,
                                    matchResult.winner_sets,
                                    matchResult.loser_sets
                                  )}
                                  className="px-4 py-2 text-base sm:text-lg md:text-xl bg-blue-500 text-white rounded hover:bg-blue-600"
                                  disabled={matchResult.winner_sets === 0 && matchResult.loser_sets === 0}
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 5. 경기 진행 현황 */}
          {selectedPlayers.length > 1 && (
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">경기 진행 현황</h2>
              {(() => {
                const totalMatches = generateMatchOrder(selectedPlayers).length;
                const completedMatches = allMatches.length;
                const progressPercentage = Math.round((completedMatches / totalMatches) * 100) || 0;
                
                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center text-base sm:text-xl mb-2">
                      <span>전체 {totalMatches}경기 중 {completedMatches}경기 완료</span>
                      <span className="font-bold">{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. 참가 선수 선택 */}
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">참가 선수 선택</h2>
              <button
                onClick={loadPlayers}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {players.map(player => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerSelection(player.id)}
                  className={`p-2 sm:p-3 text-base sm:text-lg md:text-xl rounded-lg flex items-center justify-center space-x-2 ${
                    selectedPlayers.includes(player.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold rounded-full text-white ${
                    player.level === 1 ? 'bg-red-500' :
                    player.level === 2 ? 'bg-orange-500' :
                    player.level === 3 ? 'bg-yellow-500' :
                    player.level === 4 ? 'bg-green-500' :
                    player.level === 5 ? 'bg-blue-500' :
                    player.level === 6 ? 'bg-indigo-500' :
                    player.level === 7 ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}>
                    {player.level}부
                  </span>
                  <span className="truncate">{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 로딩 및 에러 표시 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg text-lg sm:text-xl md:text-2xl">
            데이터를 불러오는 중...
          </div>
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg text-base sm:text-lg md:text-xl z-50">
          {error}
        </div>
      )}
    </div>
  );
} 