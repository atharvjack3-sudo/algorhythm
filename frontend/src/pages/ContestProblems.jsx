import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ContestProblems() {
  const { contestId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnded, setIsEnded] = useState(false);

  /* =========================
      Auth redirect
  ========================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  /* =========================
      Load problems + leaderboard
  ========================= */
  useEffect(() => {
    if (authLoading || !user) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const [pRes, lRes] = await Promise.all([
          api.get(`/contests/${contestId}/problems`, {
            signal: controller.signal,
          }),
          api.get(`/contests/${contestId}/leaderboard`, {
            signal: controller.signal,
          }),
        ]);

        setProblems(pRes.data);
        setLeaderboard(lRes.data);
        setIsEnded(false);
      } catch (err) {
        // Ignore errors caused by component unmounting/refreshing
        if (err.response?.status === 403) {
          const msg = err.response?.data?.error;

          if (msg === "Contest not active") {
            // contest ended -->> show leaderboard
            const lRes = await api.get(`/contests/${contestId}/leaderboard`, {
              signal: controller.signal,
            });
            setProblems([]);
            setLeaderboard(lRes.data);
            setIsEnded(true);
          } else {
            // not registered OR other forbidden
            navigate(`/contests/${contestId}`);
          }
        }

        if (err.response?.status === 403) {
          try {
            const lRes = await api.get(`/contests/${contestId}/leaderboard`, {
              signal: controller.signal,
            });
            setProblems([]);
            setLeaderboard(lRes.data);
            setIsEnded(true);
          } catch (e) {
            if (e.name !== "CanceledError") navigate("/contests");
          }
        } else {
          navigate("/contests");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort(); // Kills requests on refresh
    };
  }, [contestId, user, authLoading, navigate]);

  // Design Loader
  if (authLoading || (loading && !isEnded && problems.length === 0))
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
          </div>
          <div className="text-center">
            <h3 className="text-slate-900 dark:text-white font-bold tracking-tight uppercase">Establishing Link</h3>
            <p className="text-sm font-medium text-blue-500 dark:text-blue-400 mt-1 animate-pulse uppercase tracking-widest">Synchronizing Data...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#0a0c10] min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        
        {/* --- HEADER --- */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-8 gap-6 transition-colors">
          <div>
            <p className="text-blue-600 dark:text-blue-500 font-black text-xs uppercase tracking-[0.4em] mb-2 transition-colors">
              Tactical Hub
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">
              CONTEST <span className="text-blue-600 dark:text-blue-500 italic">#{contestId}</span>
            </h1>
          </div>

          {isEnded && (
            <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20 flex items-center gap-3 shadow-sm transition-colors">
              <span className="w-2.5 h-2.5 bg-rose-500 dark:bg-rose-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
              <span className="text-xs font-black uppercase tracking-widest">
                Operation Concluded
              </span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* --- LEFT MISSION OBJECTIVES --- */}
          <section className="lg:col-span-5">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-1.5 w-8 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
              <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white transition-colors">
                Active Missions
              </h2>
            </div>

            {problems.length === 0 && isEnded && (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 text-center transition-colors">
                <svg
                  className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider leading-relaxed transition-colors">
                  Mission files locked.
                  <br />
                  Contest has been archived.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {problems.map((p) => (
                <div
                  key={p.problem_id}
                  onClick={() => {
                    if (!isEnded) {
                      navigate(`/contests/${contestId}/solve/${p.problem_id}`);
                    }
                  }}
                  className={`group relative overflow-hidden bg-white dark:bg-slate-900 border-2 rounded-3xl p-6 transition-all duration-300 ${
                    isEnded
                      ? "border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                      : "border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-blue-500/20 translate-x-0 hover:translate-x-2"
                  }`}
                >
                  {/* Background Decor */}
                  {!isEnded && (
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-50 dark:from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                          isEnded
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                            : "bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                        }`}
                      >
                        {p.problem_index}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">
                          Target ID: {p.problem_id}
                        </p>
                        <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight transition-colors">
                          Mission Module
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider border transition-colors ${
                          p.difficulty === "hard"
                            ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
                            : p.difficulty === "medium"
                            ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                            : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                        }`}
                      >
                        {p.difficulty}
                      </span>
                      {!isEnded && (
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                          Deploy →
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* --- RIGHT: LEADERBOARD --- */}
          <section className="lg:col-span-7">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 transition-colors">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full"></span>
                Live Rankings
              </h2>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-colors">
              <table className="w-full text-left bg-white dark:bg-slate-900 border-collapse transition-colors">
                <thead>
                  <tr className="bg-slate-900 dark:bg-slate-950 text-white uppercase text-[10px] font-black tracking-[0.2em] transition-colors">
                    <th className="px-6 py-5">Rank</th>
                    <th className="px-6 py-5">Combatant</th>
                    <th className="px-6 py-5 text-center">Cleared</th>
                    <th className="px-6 py-5 text-right">Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center bg-slate-50 dark:bg-slate-900 transition-colors">
                        <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">
                          No Combatants Recorded
                        </p>
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row, idx) => {
                      const isCurrentUser = row.user_id === user?.id;
                      return (
                        <tr
                          key={row.user_id}
                          className={`group transition-colors ${
                            isCurrentUser 
                              ? "bg-blue-50/60 dark:bg-blue-500/10" 
                              : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <td className="px-6 py-5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${
                                idx === 0
                                  ? "bg-amber-400 text-white shadow-md shadow-amber-400/40 dark:shadow-none"
                                  : idx === 1
                                  ? "bg-slate-300 dark:bg-slate-400 text-white shadow-md shadow-slate-300/40 dark:shadow-none"
                                  : idx === 2
                                  ? "bg-orange-400 text-white shadow-md shadow-orange-400/40 dark:shadow-none"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {idx + 1}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-700 dark:text-slate-200 tracking-tight transition-colors">
                                User {row.user_id}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest italic opacity-80">
                                  (YOU)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 transition-colors">
                              {row.solved_count}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right font-mono text-slate-500 dark:text-slate-400 text-xs font-bold transition-colors">
                            {row.penalty} PTS
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="mt-20 text-center opacity-30 border-t border-slate-200 dark:border-slate-800 pt-10 transition-colors">
          <p className="text-[9px] font-black uppercase tracking-[1.5em] text-slate-900 dark:text-white">
            Sector: Contest Intelligence Unit
          </p>
        </footer>
      </div>
    </div>
  );
}