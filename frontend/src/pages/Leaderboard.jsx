import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Link } from "react-router-dom";

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING RANKINGS...
        </span>
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  // Order: 2nd, 1st, 3rd to create a podium effect on desktop
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-10">
          
          {/* --- Header --- */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Hall of Fame
              </span>
            </div>
            <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Global Leaderboard
            </h1>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em] mt-1">
              The top coders actively competing on the platform
            </p>
          </div>

          {/* --- Podium for Top 3 --- */}
          {top3.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-center items-end gap-4 md:gap-6 mt-4">
              {podiumOrder.map((user) => {
                if (!user) return null;
                const position = user.global_rank;
                const isFirst = position === 1;
                const isSecond = position === 2;
                const isThird = position === 3;

                // Determine rank-specific styling
                let colorStyles = "";
                let heightClass = "";
                let avatarColor = "";
                let accentColor = "";

                if (isFirst) {
                  colorStyles = "border-t-amber-400 dark:border-t-amber-500 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]";
                  heightClass = "sm:h-[260px]"; // Increased height
                  avatarColor = "bg-amber-500 text-white";
                  accentColor = "text-amber-600 dark:text-amber-500";
                } else if (isSecond) {
                  colorStyles = "border-t-slate-400 dark:border-t-slate-500";
                  heightClass = "sm:h-[240px]"; // Increased height
                  avatarColor = "bg-slate-400 dark:bg-slate-600 text-white";
                  accentColor = "text-slate-600 dark:text-slate-400";
                } else {
                  colorStyles = "border-t-orange-400 dark:border-t-orange-600";
                  heightClass = "sm:h-[220px]"; // Increased height
                  avatarColor = "bg-orange-500 dark:bg-orange-700 text-white";
                  accentColor = "text-orange-600 dark:text-orange-500";
                }

                const orderClass = isFirst ? "order-first sm:order-none z-10" : "order-none z-0";

                return (
                  <Link to={`/profile/${user.username}`}
                    key={user.username}
                    // Changed justify-center to justify-start
                    className={`w-full sm:w-1/3 max-w-[280px] bg-white dark:bg-slate-900 rounded-md border-t-[3px] border-x border-b border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 flex flex-col items-center justify-start p-6 transition-transform hover:-translate-y-1 ${colorStyles} ${heightClass} ${orderClass}`}
                  >
                    <div className={`w-14 h-14 rounded-[3px] flex items-center justify-center font-sans text-2xl font-bold shadow-sm mb-4 shrink-0 ${avatarColor}`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Added shrink-0 and leading-tight */}
                    <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white truncate w-full text-center mb-1 shrink-0 leading-tight">
                      {user.username}
                    </h3>

                    <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                      <span className={`font-bold text-[13px] mr-1 ${accentColor}`}>
                        {user.total_solved}
                      </span>
                      SOLVED
                    </div>

                    {/* mt-auto pushes this firmly to the bottom */}
                    <div className="mt-auto pt-4 font-mono text-3xl font-black text-slate-200 dark:text-slate-800/80 tracking-tighter select-none shrink-0">
                      #{position}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* --- Rest of Leaderboard --- */}
          {rest.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                  Global Standings
                </span>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rest.map((user) => (
                  <Link to={`/profile/${user.username}`}
                    key={user.username}
                    className="flex items-center px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="w-12 font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      #{user.global_rank}
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[3px] flex items-center justify-center font-sans text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-sans text-[14px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {user.username}
                      </h3>
                    </div>
                    
                    <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right shrink-0">
                      <span className="font-bold text-slate-700 dark:text-slate-200 mr-1.5 text-[12px]">
                        {user.total_solved}
                      </span>
                      Solved
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* --- Empty State --- */}
          {leaders.length === 0 && !loading && (
            <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center gap-4">
              <div className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                No rankings yet
              </div>
              <p className="font-sans text-[13px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                Start solving problems to appear on the global leaderboard!
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default Leaderboard;