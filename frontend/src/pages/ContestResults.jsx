import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ContestResults() {
  const { contestId } = useParams();
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
        console.log(res);
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
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
          </div>
          <div className="text-center">
            <h3 className="text-slate-900 dark:text-white font-bold tracking-tight uppercase">Retrieving Battle Logs</h3>
            <p className="text-sm font-medium text-blue-500 dark:text-blue-400 mt-1 animate-pulse uppercase tracking-widest">Processing Data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 bg-[#f8f9fa] dark:bg-[#0a0c10] min-h-screen font-sans transition-colors duration-300">
      
      {/* --- HEADER / MISSION DEBRIEF --- */}
      <header className="mb-16 border-l-[6px] border-blue-600 dark:border-blue-500 pl-5 transition-colors">
        <p className="text-blue-600 dark:text-blue-500 font-black text-[10px] md:text-xs uppercase tracking-[0.4em] mb-2 transition-colors">
          Operation: Concluded
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">
          CONTEST <span className="text-blue-600 dark:text-blue-500">#{contestId}</span> RESULTS
        </h1>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="bg-slate-200/50 dark:bg-slate-800 px-3 py-1 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase italic transition-colors">
            Archive Verified
          </span>
          <span className="bg-blue-100 dark:bg-blue-500/10 px-3 py-1 rounded-md text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase italic underline underline-offset-4 decoration-2 transition-colors border border-blue-200 dark:border-blue-500/20">
            Hall of Fame
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* --- LEFT SIDE MISSION OBJECTIVES (PROBLEMS) --- */}
        <section className="lg:col-span-4">
          <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              ></path>
            </svg>
            Mission Objectives
          </h2>
          <div className="space-y-3">
            {problems.map((p) => (
              <div
                key={p.problem_id}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 transition-all cursor-default shadow-sm hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-black text-sm shadow-inner dark:shadow-none transition-colors">
                    {p.problem_index}
                  </span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5 transition-colors">
                      Mission{" "}
                      {p.problem_index === "A"
                        ? "Alpha"
                        : p.problem_index === "B"
                          ? "Beta"
                          : p.problem_index === "C"
                            ? "Gamma"
                            : "Delta"}
                    </p>
                    <p className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
                      {p.title}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border transition-colors ${
                    p.difficulty === "hard"
                      ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
                      : p.difficulty === "medium"
                        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                  }`}
                >
                  {p.difficulty}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* --- RIGHT SIDE RUNNING LEADERBOARD --- */}
        <section className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              Final Rankings
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">
                No Combatants Recorded
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 transition-colors">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-blue-600 dark:bg-blue-500 text-white uppercase text-[10px] font-black tracking-[0.2em] transition-colors">
                    <th className="px-6 py-5 rounded-tl-[2rem]">Rank</th>
                    <th className="px-6 py-5">Combatant</th>
                    <th className="px-6 py-5 text-center">Tasks Cleared</th>
                    <th className="px-6 py-5 text-right rounded-tr-[2rem]">Time (w/ Penalty)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {leaderboard.map((row, idx) => {
                    const isTop3 = idx < 3;
                    const rankColor =
                      idx === 0
                        ? "bg-amber-400 text-white shadow-amber-200 dark:shadow-none" // Gold
                        : idx === 1
                          ? "bg-slate-300 dark:bg-slate-400 text-white shadow-slate-200 dark:shadow-none" // Silver
                          : idx === 2
                            ? "bg-orange-400 text-white shadow-orange-200 dark:shadow-none" // Bronze
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";

                    return (
                      <tr
                        key={row.user_id}
                        className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isTop3 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}`}
                      >
                        <td className="px-6 py-5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-md transition-colors ${rankColor}`}
                          >
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm uppercase border border-blue-100 dark:border-blue-500/20 transition-colors">
                              {row.username[0]}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
                              {row.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            onClick={async () => {
                              try {
                                const res = await api.get(
                                  `/contests/${contestId}/results/${row.user_id}`
                                );
                                setPopupData(res.data);
                                setPopupUser(row.user_id);
                                setShowPopup(true);
                              } catch {
                                alert("Unable to load problem breakdown");
                              }
                            }}
                            className="inline-block px-5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 transition-colors active:scale-95"
                          >
                            {row.solved_count}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-bold text-slate-500 dark:text-slate-400 text-sm transition-colors">
                          {row.penalty} min
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* --- FOOTER CTA --- */}
      <footer className="mt-20 flex justify-center pb-12">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-xl shadow-slate-900/20 dark:shadow-none active:scale-95"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Return to Arena
        </button>
      </footer>

      {/* --- POPUP MODAL (TACTICAL HUD) --- */}
      {showPopup && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
          <div className="relative bg-slate-900 w-full max-w-[480px] p-1 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/30 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Background grid pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>

            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-6 md:p-8">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-white leading-none mt-1">
                    Combatant Analysis
                  </h3>
                </div>
                <span className="text-blue-500 font-mono text-xs font-bold uppercase tracking-[0.3em] opacity-80">
                  ID: U-{popupUser}
                </span>
              </div>

              {/* List of Problems */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {popupData.map((p) => (
                  <div
                    key={p.problem_index}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-[6px] rounded-r-2xl p-5 transition-all ${
                      p.solved
                        ? "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:bg-slate-800/80"
                    }`}
                  >
                    {/* Problem Info */}
                    <div className="flex items-start sm:items-center gap-4">
                      <div
                        className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-xl border-2 ${
                          p.solved
                            ? "bg-emerald-500 text-slate-900 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            : "bg-slate-900 text-slate-400 border-slate-700"
                        }`}
                      >
                        {p.problem_index}
                      </div>
                      <div>
                        <p className="font-bold text-white text-[15px] uppercase tracking-tight mb-1.5 line-clamp-1">
                          {p.title}
                        </p>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
                            p.difficulty === "hard"
                              ? "text-rose-400 bg-rose-500/20 border border-rose-500/30"
                              : p.difficulty === "medium"
                                ? "text-amber-400 bg-amber-500/20 border border-amber-500/30"
                                : "text-blue-400 bg-blue-500/20 border border-blue-500/30"
                          }`}
                        >
                          {p.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Status and Stats */}
                    <div className="text-left sm:text-right font-mono ml-16 sm:ml-0">
                      {p.solved ? (
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-0">
                          <span className="text-emerald-400 font-black text-sm flex items-center gap-2 uppercase">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                            AC
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight opacity-80 sm:mt-1">
                            @ T+{p.first_ac_time_minutes}m
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-black text-sm uppercase tracking-widest">
                          —
                        </span>
                      )}

                      {p.wrong_attempts > 0 && (
                        <div className="text-[10px] text-rose-400 font-bold mt-2 sm:mt-1.5 flex items-center sm:justify-end gap-1 uppercase tracking-tight">
                          {p.wrong_attempts} × FAULTS
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowPopup(false)}
                className="mt-8 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest transition-all border-b-4 border-blue-800 hover:border-blue-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <svg
                  className="w-5 h-5 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="relative z-10">Dismiss Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}