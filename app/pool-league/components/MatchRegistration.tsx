import React, { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface IMatchRegistration {
  onMatchRegistered: () => void;
  players: Array<{
    id: string;
    name: string;
    level: number;
  }>;
}

export default function MatchRegistration({ onMatchRegistered, players }: IMatchRegistration) {
  const [formData, setFormData] = useState({
    match_date: format(new Date(), "yyyy-MM-dd"),
    winner_id: '',
    loser_id: '',
    winner_sets: 0,
    loser_sets: 0
  });

  // 가능한 세트 스코어 조합
  const possibleScores = [
    { winner: 3, loser: 0 },
    { winner: 3, loser: 1 },
    { winner: 3, loser: 2 },
  ];

  const handleScoreSelect = (winnerSets: number, loserSets: number) => {
    setFormData(prev => ({
      ...prev,
      winner_sets: winnerSets,
      loser_sets: loserSets
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 선택된 날짜의 연월일만 가져오기
      const selectedDate = new Date(formData.match_date);
      const now = new Date();
      
      // 선택된 날짜에 현재 시간 설정
      const matchDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          match_date: matchDateTime.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '경기 결과 등록에 실패했습니다.');
      }

      setFormData({
        match_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        winner_id: '',
        loser_id: '',
        winner_sets: 0,
        loser_sets: 0
      });

      onMatchRegistered();
    } catch (error) {
      console.error('Error registering match:', error);
      alert(error instanceof Error ? error.message : '경기 결과 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">경기 일자</label>
          <input
            type="date"
            value={formData.match_date}
            onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">* 경기 시간은 현재 시간으로 자동 설정됩니다.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">승자</label>
          <select
            value={formData.winner_id}
            onChange={(e) => setFormData({ ...formData, winner_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700">패자</label>
          <select
            value={formData.loser_id}
            onChange={(e) => setFormData({ ...formData, loser_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-3">세트 스코어</label>
          <div className="grid grid-cols-3 gap-3">
            {possibleScores.map(({ winner, loser }) => (
              <button
                key={`${winner}-${loser}`}
                type="button"
                onClick={() => handleScoreSelect(winner, loser)}
                className={`
                  p-4 rounded-lg border-2 text-center
                  ${formData.winner_sets === winner && formData.loser_sets === loser
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="text-2xl font-bold">{winner} : {loser}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {winner}승 {loser}패
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={formData.winner_sets === 0 && formData.loser_sets === 0}
        className="w-full px-4 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        경기 결과 등록
      </button>
    </form>
  );
} 