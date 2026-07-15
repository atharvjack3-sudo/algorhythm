import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const formatCFTime = (mins) => {
  if (mins === undefined || mins === null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export default function ContestResults() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    async function load() {
      try {
        const res = await api.get(`/contests/${contestId}/results`);
        setProblems(res.data.problems);
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error("Failed to fetch results", err);
        // If backend returns 403 (Contest not ended) or 404, redirect to contests
        navigate("/contests");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [contestId, user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse">
          LOADING STANDINGS...
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-[#07080a] text-slate-800 dark:text-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
          
          {/* --- HEADER --- */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Final Standings
                </span>
              </div>
              <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white">
                Contest #{contestId}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/contests/${contestId}/problems`)}
                className="font-mono text-[11px] font-semibold tracking-[0.06em] rounded transition-all cursor-pointer bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                Problems ↗
              </button>
              <button 
                onClick={() => navigate('/contests')}
                className="font-mono text-[11px] font-semibold tracking-[0.06em] rounded transition-all cursor-pointer bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                ← Contests
              </button>
            </div>
          </div>

          {/* --- LEADERBOARD MATRIX --- */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-12">Rank</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-left min-w-[150px]">Programmer</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-12" title="Total Solved">=</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-20">Penalty</th>
                    
                    {/* Dynamic Problem Headers (A, B, C...) */}
                    {problems.map((p) => (
                      <th 
                        key={p.problem_id} 
                        className="px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.1em] text-blue-600 dark:text-blue-400 uppercase text-center w-16 cursor-pointer hover:text-blue-500 dark:hover:text-blue-300 transition-colors" 
                        onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                        title={`Problem ${p.problem_index}`}
                      >
                        {p.problem_index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4 + problems.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs tracking-[0.06em]">
                        Final standings are not declared yet. Check <Link to={`/contests/${contestId}/problems`} className="dark:text-orange-500 text-orange-600 hover:underline">tentative standings here.</Link>
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row, idx) => {
                      const isCurrentUser = row.user_id === user?.id;
                      const rowClass = isCurrentUser 
                        ? "bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 border-b border-blue-100 dark:border-blue-900/50 transition-colors" 
                        : "border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50";

                      return (
                        <tr key={row.user_id} className={rowClass}>
                          
                          {/* Rank */}
                          <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          
                          {/* Username */}
                          <td className="px-4 py-3 text-left">
                            <span className={`font-sans text-[13px] font-semibold ${isCurrentUser ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
                              {row.username}
                            </span>
                          </td>

                          {/* Total Solved */}
                          <td className="px-4 py-3 text-center font-mono text-[11px] font-bold text-green-600 dark:text-green-500">
                            {row.solved_count}
                          </td>

                          {/* Total Penalty */}
                          <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {row.penalty}
                          </td>

                          {/* Problem Breakdown Cells */}
                          {problems.map((p) => {
                            const stat = row.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));
                            
                            if (!stat || (!stat.solved && stat.wrong_attempts === 0)) {
                              return <td key={p.problem_id} className="px-4 py-2 text-center"></td>;
                            }
                            
                            if (stat.solved) {
                              return (
                                <td key={p.problem_id} className="px-4 py-2 text-center align-middle">
                                  <div className="font-mono font-bold text-green-600 dark:text-green-500 text-[11px]">
                                    +{stat.wrong_attempts > 0 ? stat.wrong_attempts : ""}
                                  </div>
                                  <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {formatCFTime(stat.first_ac_time_minutes)}
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={p.problem_id} className="px-4 py-2 text-center align-middle">
                                  <div className="font-mono font-bold text-red-500 dark:text-red-400 text-[11px]">
                                    -{stat.wrong_attempts}
                                  </div>
                                </td>
                              );
                            }
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}