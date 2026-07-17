import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Trophy, ExternalLink, ChevronLeft, TerminalSquare } from "lucide-react";

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
        
        navigate("/contests");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [contestId, user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-[#050608] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.2em] animate-pulse uppercase relative z-10">
          FETCHING LEADERBOARD...
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
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      <div className="relative min-h-[calc(100vh-56px)] w-full bg-slate-100 dark:bg-[#050608] text-slate-800 dark:text-slate-200 py-8 px-4 sm:px-6 font-sans transition-colors duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8">
          
          {/* --- HEADER --- */}
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 rounded-[3px] border border-orange-200 dark:border-orange-500/30 shadow-sm">
                <Trophy size={28} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
                  Contest #{contestId}
                </h1>
                <p className="font-mono text-[11px] font-bold text-slate-500 tracking-[0.15em] uppercase mt-2">
                  Final Standings & Performance Matrix
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
              <button 
                onClick={() => navigate('/contests')}
                className="font-sans text-[12px] font-bold tracking-wider rounded-[3px] transition-all cursor-pointer bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 uppercase"
              >
                <ChevronLeft size={14} /> Contests
              </button>
              <button 
                onClick={() => navigate(`/contests/${contestId}/problems`)}
                className="font-sans text-[12px] font-bold tracking-wider rounded-[3px] transition-all cursor-pointer bg-orange-500 text-white border border-orange-500 px-4 py-2 hover:bg-orange-600 flex items-center gap-2 uppercase shadow-sm"
              >
                <TerminalSquare size={14} /> View Problems
              </button>
            </div>
          </div>

          {/* --- LEADERBOARD --- */}
          <div className="bg-white w-full dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full border-collapse whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22]">
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center w-12">Rank</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-left min-w-[150px]">Programmer</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center w-12" title="Total Solved">=</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center w-20">Penalty</th>
                    
                    {/* Problem Headers (A, B, C...) */}
                    {problems.map((p) => (
                      <th 
                        key={p.problem_id} 
                        className="px-5 py-3.5 font-mono text-[11px] font-bold tracking-[0.15em] text-orange-600 dark:text-orange-500 uppercase text-center w-16 cursor-pointer hover:text-orange-700 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" 
                        onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                        title={`Problem ${p.problem_index}`}
                      >
                        {p.problem_index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4 + problems.length} className="px-5 py-20 text-center bg-white dark:bg-[#0d1117]">
                        <div className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase flex flex-col items-center justify-center gap-3">
                          <span>[ Final standings not declared ]</span>
                          <Link to={`/contests/${contestId}/problems`} className="dark:text-orange-500 text-orange-600 hover:underline flex items-center gap-1.5">
                            <ExternalLink size={12} /> View Tentative Standings
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row, idx) => {
                      const isCurrentUser = row.user_id === user?.id;
                      const rowClass = isCurrentUser 
                        ? "bg-orange-50/60 dark:bg-orange-500/10 hover:bg-orange-100/60 dark:hover:bg-orange-500/20 transition-colors border-l-2 border-l-orange-500" 
                        : "transition-colors group odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-l-2 border-l-transparent";

                      return (
                        <tr key={row.user_id} className={rowClass}>
                          
                          {/* Rank */}
                          <td className="px-5 py-4 text-center font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          
                          {/* Username */}
                          <td className="px-5 py-4 text-left">
                            <span className={`font-sans text-[14px] font-bold ${isCurrentUser ? "text-orange-600 dark:text-orange-500" : "text-slate-800 dark:text-slate-200"}`}>
                              {row.username}
                            </span>
                          </td>

                          {/* Total Solved */}
                          <td className="px-5 py-4 text-center font-mono text-[12px] font-bold text-emerald-600 dark:text-emerald-500">
                            {row.solved_count}
                          </td>

                          {/* Total Penalty */}
                          <td className="px-5 py-4 text-center font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {row.penalty}
                          </td>

                          {/* Problem Breakdown Cells */}
                          {problems.map((p) => {
                            const stat = row.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));
                            
                            if (!stat || (!stat.solved && stat.wrong_attempts === 0)) {
                              return <td key={p.problem_id} className="px-5 py-4 text-center"></td>;
                            }
                            
                            if (stat.solved) {
                              return (
                                <td key={p.problem_id} className="px-5 py-2.5 text-center align-middle border-l border-slate-100 dark:border-slate-800/60">
                                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-500 text-[12px]">
                                    +{stat.wrong_attempts > 0 ? stat.wrong_attempts : ""}
                                  </div>
                                  <div className="font-mono text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                                    {formatCFTime(stat.first_ac_time_minutes)}
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={p.problem_id} className="px-5 py-2.5 text-center align-middle border-l border-slate-100 dark:border-slate-800/60">
                                  <div className="font-mono font-bold text-red-500 dark:text-red-500 text-[12px]">
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