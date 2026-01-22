import React, { useEffect, useState } from "react";
import { api } from "../api/client";

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getBoard() {
      try {
        const res = await api.get("/leaderboard");
        setLeaders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    getBoard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-gray-900">Global Leaderboard</h1>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-lg">Top coders competing on Algorhythm</p>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="mb-16">
            <div className="flex items-end justify-center gap-4 max-w-4xl mx-auto">
              {podiumOrder.map((user, index) => {
                const position = user.global_rank;
                const isFirst = position === 1;
                const isSecond = position === 2;
                const isThird = position === 3;

                return (
                  <div
                    key={user.username}
                    className={`flex flex-col items-center ${
                      isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3'
                    }`}
                    style={{ width: '33%' }}
                  >
                    {/* Avatar and Crown */}
                    <div className="relative mb-4">
                      {isFirst && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                          <svg className="w-10 h-10 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ${
                          isFirst
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-200'
                            : isSecond
                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 ring-4 ring-gray-200'
                            : 'bg-gradient-to-br from-amber-600 to-amber-700 ring-4 ring-amber-300'
                        }`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* User Info */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{user.username}</h3>
                    <p className="text-sm text-gray-500 mb-2">Rank #{position}</p>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-cyan-600">{user.total_solved}</p>
                      <p className="text-xs text-gray-500">Problems Solved</p>
                    </div>

                    {/* Podium Block */}
                    <div
                      className={`w-full rounded-t-2xl flex flex-col items-center justify-center shadow-lg transition-all ${
                        isFirst
                          ? 'bg-gradient-to-b from-amber-400 to-amber-500 h-48'
                          : isSecond
                          ? 'bg-gradient-to-b from-gray-300 to-gray-400 h-36'
                          : 'bg-gradient-to-b from-amber-600 to-amber-700 h-28'
                      }`}
                    >
                      <div className="text-6xl font-bold text-white mb-2">
                        {position}
                      </div>
                      <div className="text-white text-sm font-medium">
                        {isFirst ? '🏆 Champion' : isSecond ? '🥈 Runner-up' : '🥉 Third Place'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        {rest.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rankings</h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-100">
                {rest.map((user, index) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-cyan-600">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                        <p className="text-sm text-gray-500">{user.total_solved} problems solved</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-700">#{user.global_rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {leaders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No rankings yet</h3>
            <p className="text-gray-600">Start solving problems to appear on the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;