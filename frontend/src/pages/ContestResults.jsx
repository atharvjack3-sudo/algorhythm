import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ContestResults() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showPopup, setShowPopup] = useState(false);
  const [popupUser, setPopupUser] = useState(null);
  const [popupData, setPopupData] = useState([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const res = await api.get(`/contests/${contestId}/results`);
        setProblems(res.data.problems);
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error("Failed to fetch results", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [contestId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] flex items-center justify-center transition-colors duration-300">
        <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Standings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* --- HEADER --- */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Final Standings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Leaderboard and problem statistics for Contest #{contestId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider rounded">
              Contest Concluded
            </span>
          </div>
        </div>

        {/* --- PROBLEM SUMMARY --- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 mb-8 shadow-sm">
          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
            Problem Set
            <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
              {problems.length}
            </span>
          </h3>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {problems.map((p) => (
              <div key={p.problem_id} className="flex items-center gap-2.5 group">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline cursor-pointer">
                  {p.problem_index}
                </span>
                <span className="text-[13px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {p.title}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                  p.difficulty === "hard"
                    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
                    : p.difficulty === "medium"
                    ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                    : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                }`}>
                  {p.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- LEADERBOARD --- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-sm mb-10">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold tracking-widest uppercase border-dashed border-2 border-slate-100 dark:border-slate-800 m-4 rounded-lg">
              No Participants Recorded
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-16 px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-center">
                    #
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    Participant
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-center">
                    Solved
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-right">
                    Penalty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {leaderboard.map((row, idx) => {
                  const rankColor = 
                    idx === 0 ? "text-amber-500 dark:text-amber-400 font-bold" :
                    idx === 1 ? "text-slate-400 dark:text-slate-300 font-bold" :
                    idx === 2 ? "text-orange-500 dark:text-orange-400 font-bold" :
                    "text-slate-600 dark:text-slate-400";

                  return (
                    <tr key={row.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className={`px-4 py-3 text-center text-[13px] font-mono ${rankColor}`}>
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                          {row.username}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.get(`/contests/${contestId}/results/${row.user_id}`);
                              setPopupData(res.data);
                              setPopupUser(row.username); // Showing username instead of raw ID for better UX
                              setShowPopup(true);
                            } catch {
                              alert("Unable to load problem breakdown");
                            }
                          }}
                          className="font-mono text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                          title="View submissions breakdown"
                        >
                          {row.solved_count}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] text-slate-500 dark:text-slate-400">
                        {row.penalty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* --- FOOTER CTA --- */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            ← Back to Contests
          </button>
        </div>

        {/* --- USER BREAKDOWN MODAL --- */}
        {showPopup && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[500px] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Results for <span className="font-mono text-blue-600 dark:text-blue-400">{popupUser}</span>
                </h3>
                <button 
                  onClick={() => setShowPopup(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Modal Body / Table */}
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0">Problem</th>
                      <th className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 text-center">Status</th>
                      <th className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {popupData.map((p) => (
                      <tr key={p.problem_index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{p.problem_index}</span>
                            <span className="text-[12px] text-slate-600 dark:text-slate-400 line-clamp-1">{p.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {p.solved ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                              Accepted
                            </div>
                          ) : p.wrong_attempts > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-200 dark:border-rose-500/20">
                              -{p.wrong_attempts}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 font-mono">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {p.solved ? `${p.first_ac_time_minutes}m` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
