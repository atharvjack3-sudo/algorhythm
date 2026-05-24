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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-['verdana','arial','sans-serif'] text-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading Standings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-['verdana','arial','sans-serif'] pb-16">
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6">
        
        {/* --- HEADER --- */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Final Standings - Contest #{contestId}
            </h2>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              The contest has concluded. Below are the final system-tested results.
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/contests/${contestId}/problems`)}
              className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Problems
            </button>
            <button 
              onClick={() => navigate('/contests')}
              className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Contests
            </button>
          </div>
        </div>

        {/* --- LEADERBOARD MATRIX --- */}
        <div>
          <h2 className="text-lg mb-3 font-bold text-slate-900 dark:text-white">Standings</h2>
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 text-left min-w-[150px]">Who</th>
                    <th className="p-3 w-12 text-center" title="Total Solved">=</th>
                    <th className="p-3 w-20 text-center">Penalty</th>
                    
                    {/* Dynamic Problem Headers (A, B, C...) */}
                    {problems.map((p) => (
                      <th 
                        key={p.problem_id} 
                        className="p-3 w-16 text-center text-blue-600 dark:text-blue-400 cursor-pointer hover:underline transition-all" 
                        onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                        title={`Problem ${p.problem_index}`}
                      >
                        {p.problem_index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4 + problems.length} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                        Final Standings are not declared yet. Check tentative final standings <Link to={`/contests/${contestId}/problems`} className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 font-bold transition-colors">here</Link>.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row, idx) => {
                      const isCurrentUser = row.user_id === user?.id;
                      const rowClass = isCurrentUser 
                        ? "bg-blue-50/60 dark:bg-blue-900/20" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors";

                      return (
                        <tr key={row.user_id} className={rowClass}>
                          
                          {/* Rank */}
                          <td className="p-3 text-center font-medium text-slate-500 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          
                          {/* Username */}
                          <td className="p-3 text-left">
                            <span className={`font-bold ${isCurrentUser ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                              {row.username}
                            </span>
                          </td>

                          {/* Total Solved */}
                          <td className="p-3 text-center font-bold text-green-600 dark:text-green-500">
                            {row.solved_count}
                          </td>

                          {/* Total Penalty */}
                          <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                            {row.penalty}
                          </td>

                          {/* Problem Breakdown Cells */}
                          {problems.map((p) => {
                            const stat = row.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));
                            
                            if (!stat || (!stat.solved && stat.wrong_attempts === 0)) {
                              return <td key={p.problem_id} className="p-3 text-center"></td>;
                            }
                            
                            if (stat.solved) {
                              return (
                                <td key={p.problem_id} className="p-2 text-center align-middle">
                                  <div className="font-bold text-green-600 dark:text-green-500 text-[13px]">
                                    +{stat.wrong_attempts > 0 ? stat.wrong_attempts : ""}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                    {formatCFTime(stat.first_ac_time_minutes)}
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={p.problem_id} className="p-2 text-center align-middle">
                                  <div className="font-bold text-red-500 dark:text-red-400 text-[13px]">
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
    </div>
  );
}