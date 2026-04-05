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
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
          </div>
          <div className="text-center">
            <h3 className="text-slate-900 dark:text-white font-semibold tracking-tight">Loading Rankings</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 animate-pulse">Fetching global leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform -rotate-12 transition-transform hover:rotate-0 duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Global Leaderboard</h1>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform rotate-12 transition-transform hover:rotate-0 duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">The top coders actively competing on Algorhythm</p>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="mb-20">
            <div className="flex items-end justify-center gap-2 sm:gap-6 max-w-4xl mx-auto px-2">
              {podiumOrder.map((user, index) => {
                const position = user.global_rank;
                const isFirst = position === 1;
                const isSecond = position === 2;
                const isThird = position === 3;

                return (
                  <div
                    key={user.username}
                    className={`flex flex-col items-center relative ${
                      isFirst ? 'order-2 z-20' : isSecond ? 'order-1 z-10' : 'order-3 z-10'
                    }`}
                    style={{ width: isFirst ? '38%' : '31%' }}
                  >
                    {/* Avatar and Crown */}
                    <div className={`relative mb-5 flex flex-col items-center transition-transform hover:-translate-y-2 ${isFirst ? '-mt-8' : ''}`}>
                      {isFirst && (
                        <div className="absolute -top-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                          </svg>
                        </div>
                      )}
                      
                      <div
                        className={`rounded-full flex items-center justify-center font-bold text-white shadow-xl transition-all ${
                          isFirst
                            ? 'w-24 h-24 sm:w-28 sm:h-28 text-4xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 ring-[6px] ring-amber-400/30 dark:ring-amber-500/20 shadow-amber-500/40'
                            : isSecond
                            ? 'w-20 h-20 sm:w-24 sm:h-24 text-3xl bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 ring-[5px] ring-slate-400/30 dark:ring-slate-500/20 shadow-slate-500/20'
                            : 'w-20 h-20 sm:w-24 sm:h-24 text-3xl bg-gradient-to-br from-orange-400 via-orange-600 to-amber-800 ring-[5px] ring-orange-500/30 dark:ring-orange-600/20 shadow-orange-700/20'
                        }`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="text-center mb-6 w-full px-2">
                      <h3 className={`font-bold text-slate-900 dark:text-white truncate ${isFirst ? 'text-xl sm:text-2xl mb-1' : 'text-lg sm:text-xl mb-0.5'}`}>
                        {user.username}
                      </h3>
                      <div className="inline-flex flex-col items-center justify-center px-4 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 w-full mt-2 transition-colors">
                        <span className={`font-black tracking-tight leading-none ${isFirst ? 'text-2xl text-amber-500' : 'text-xl text-blue-600 dark:text-blue-400'}`}>
                          {user.total_solved}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                          Solved
                        </span>
                      </div>
                    </div>

                    {/* Podium Block */}
                    <div
                      className={`w-full rounded-t-[2rem] flex flex-col items-center justify-start pt-6 sm:pt-8 shadow-2xl relative overflow-hidden transition-all border-t border-white/20 ${
                        isFirst
                          ? 'bg-gradient-to-b from-amber-400 to-amber-600 h-48 sm:h-56'
                          : isSecond
                          ? 'bg-gradient-to-b from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-800 h-36 sm:h-44'
                          : 'bg-gradient-to-b from-orange-500 to-amber-700 h-28 sm:h-36'
                      }`}
                    >
                      {/* Reflection highlight */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                      
                      <div className="text-5xl sm:text-7xl font-black text-white/90 drop-shadow-md relative z-10 tracking-tighter">
                        {position}
                      </div>
                      <div className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2 relative z-10 hidden sm:block">
                        {isFirst ? 'Champion' : isSecond ? 'Runner-up' : 'Third Place'}
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
            <div className="flex items-center gap-3 mb-6 px-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Global Rankings</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {rest.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-full flex items-center justify-center shrink-0 transition-colors">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[15px] text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {user.username}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{user.total_solved}</span> problems solved
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end pl-4 shrink-0">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 transition-colors">
                        <span className="text-[15px] font-black text-slate-400 dark:text-slate-500">#{user.global_rank}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {leaders.length === 0 && !loading && (
          <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto transition-colors">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-100 dark:border-slate-700 transition-colors">
              <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">No rankings yet</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Start solving problems to appear on the leaderboard!</p>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default Leaderboard;