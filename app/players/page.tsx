'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';

interface Player {
  id: string;
  name: string;
  created_at: string;
  level: number; // 부수 (1-9)
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
  
  // 선수 정보 불러오기
  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('선수 목록을 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('선수 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // 선수 추가
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    
    if (!newPlayerName) {
      setAddError('이름은 필수입니다.');
      return;
    }

    setAddingPlayer(true);
    
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
      
      // 폼 초기화 및 목록 갱신
      setNewPlayerName('');
      setNewPlayerLevel(1);
      fetchPlayers();
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
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '선수 삭제에 실패했습니다.');
      }
      
      // 목록 갱신
      fetchPlayers();
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
      console.log('Sending update request:', {
        id: editingPlayer.id,
        name: editName,
        level: editLevel,
      });

      const response = await fetch('/api/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPlayer.id,
          name: editName,
          level: editLevel,
        }),
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || '선수 정보 수정에 실패했습니다.');
      }
      
      // 수정 모드 종료 및 목록 갱신
      setEditingPlayer(null);
      setEditName('');
      setEditLevel(1);
      fetchPlayers();
    } catch (err) {
      console.error('Error updating player:', err);
      setEditError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">선수 관리</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* 선수 추가 폼 */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">새 선수 등록</h2>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player-name" className="block text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <input
                    type="text"
                    id="player-name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="선수 이름"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="player-level" className="block text-sm font-medium text-gray-700">
                    부수
                  </label>
                  <select
                    id="player-level"
                    value={newPlayerLevel}
                    onChange={(e) => setNewPlayerLevel(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                      <option key={level} value={level}>
                        {level}부
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {addError && (
                <div className="text-red-500 text-sm">{addError}</div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingPlayer}
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                    addingPlayer ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {addingPlayer ? '등록 중...' : '선수 등록'}
                </button>
              </div>
            </form>
          </div>
          
          {/* 선수 목록 */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[3%]" />
                <col className="w-[20%]" />
                <col className="w-[25%]" />
                <col className="w-[5%]" />
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      등록된 선수가 없습니다.
                    </td>
                  </tr>
                ) : (
                  players.map((player, index) => (
                    <tr key={player.id} className={editingPlayer?.id === player.id ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
                        {editingPlayer?.id === player.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            required
                          />
                        ) : (
                          player.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {editingPlayer?.id === player.id ? (
                          <select
                            value={editLevel}
                            onChange={(e) => setEditLevel(Number(e.target.value))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                              <option key={level} value={level}>
                                {level}부
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelStyles[player.level as keyof typeof levelStyles]}`}>
                            {player.level}부
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(player.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingPlayer?.id === player.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleStartEdit(player)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {editError && (
              <div className="px-6 py-4 bg-red-50 border-t border-red-200">
                <p className="text-sm text-red-600">{editError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 