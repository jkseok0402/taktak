'use client';

export const dynamic = 'force-dynamic'  // 캐싱 비활성화
export const revalidate = 0  // 캐싱 시간 0으로 설정

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  created_at: string;
  level: number;
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
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 새 선수 추가 상태
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerLevel, setNewPlayerLevel] = useState<number>(1);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [addError, setAddError] = useState('');

  // 선수 수정 상태
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editError, setEditError] = useState('');
  
  // 선수 목록 조회
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/players');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '선수 목록을 가져오는데 실패했습니다.');
      }
      
      if (Array.isArray(data)) {
        setPlayers(data);
      } else {
        throw new Error('서버로부터 잘못된 데이터 형식을 받았습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '선수 목록을 가져오는데 실패했습니다.');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // 새 선수 추가
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddingPlayer(true);
    
    if (!newPlayerName) {
      setAddError('이름은 필수입니다.');
      setAddingPlayer(false);
      return;
    }

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlayerName,
          level: newPlayerLevel,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '선수 등록에 실패했습니다.');
      }
      
      setNewPlayerName('');
      setNewPlayerLevel(1);
      await fetchPlayers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setAddingPlayer(false);
    }
  };

  // 선수 삭제
  const handleDeletePlayer = async (id: string) => {
    if (!confirm('정말로 이 선수를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '선수 삭제에 실패했습니다.');
      }
      
      await fetchPlayers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // 선수 수정 시작
  const handleStartEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditLevel(player.level);
    setEditError('');
  };

  // 선수 수정 취소
  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditName('');
    setEditLevel(1);
    setEditError('');
  };

  // 선수 수정 저장
  const handleSaveEdit = async () => {
    if (!editingPlayer) return;

    setEditError('');
    
    if (!editName) {
      setEditError('이름은 필수입니다.');
      return;
    }

    try {
      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          level: editLevel,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '선수 정보 수정에 실패했습니다.');
      }
      
      setEditingPlayer(null);
      setEditName('');
      setEditLevel(1);
      await fetchPlayers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">선수 등록</h2>
          </div>
          <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                type="text"
                id="name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                placeholder="선수 이름"
              />
            </div>
            <div className="w-full sm:w-32">
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                부수
              </label>
              <select
                id="level"
                value={newPlayerLevel}
                onChange={(e) => setNewPlayerLevel(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm text-sm"
              >
                {[1,2,3,4,5,6,7,8,9].map(level => (
                  <option key={level} value={level}>{level}부</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={addingPlayer}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {addingPlayer ? '등록 중...' : '선수 등록'}
              </button>
            </div>
          </form>
          {addError && (
            <div className="mt-2 text-sm text-red-600">{addError}</div>
          )}
        </div>

        {/* 선수 목록 */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">선수 목록</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부수</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {editingPlayer?.id === player.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        <div className="font-medium text-gray-900">{player.name}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {editingPlayer?.id === player.id ? (
                        <select
                          value={editLevel}
                          onChange={(e) => setEditLevel(Number(e.target.value))}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {[1,2,3,4,5,6,7,8,9].map(level => (
                            <option key={level} value={level}>{level}부</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${levelStyles[player.level]}`}>
                          {player.level}부
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                      {formatDate(player.created_at)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right space-x-2">
                      {editingPlayer?.id === player.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900 text-sm"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(player)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4 inline" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 