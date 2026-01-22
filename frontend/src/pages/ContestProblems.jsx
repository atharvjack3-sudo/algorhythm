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
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sky-500 font-black tracking-widest text-xs uppercase animate-pulse">
            Establishing Link...
          </p>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-white min-h-screen font-sans selection:bg-sky-100 selection:text-sky-600">
      {/* --- HEADER --- */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-8 gap-4 text-slate-900">
        <div>
          <p className="text-sky-500 font-black text-xs uppercase tracking-[0.4em] mb-2">
            Tactical Hub
          </p>
          <h1 className="text-5xl font-black tracking-tighter">
            CONTEST <span className="text-sky-500 italic">#{contestId}</span>
          </h1>
        </div>

        {isEnded && (
          <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl border border-rose-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-widest">
              Operation Concluded
            </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-slate-900">
        {/* --- LEFT MISSION OBJECTIVES --- */}
        <section className="lg:col-span-5">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 bg-sky-500 rounded-full"></div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">
              Active Missions
            </h2>
          </div>

          {problems.length === 0 && isEnded && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
              <svg
                className="w-12 h-12 text-slate-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-slate-400 font-bold text-sm uppercase leading-relaxed">
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
                className={`group relative overflow-hidden bg-white border-2 rounded-3xl p-6 transition-all duration-300 ${
                  isEnded
                    ? "border-slate-100 opacity-60 cursor-not-allowed"
                    : "border-sky-50 hover:border-sky-500 cursor-pointer shadow-lg shadow-sky-100/20 hover:shadow-sky-200/40 translate-x-0 hover:translate-x-2"
                }`}
              >
                {/* Background Decor */}
                {!isEnded && (
                  <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-sky-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                        isEnded
                          ? "bg-slate-100 text-slate-400"
                          : "bg-sky-500 text-white shadow-lg shadow-sky-200"
                      }`}
                    >
                      {p.problem_index}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Target ID: {p.problem_id}
                      </p>
                      <h3 className="font-black text-lg group-hover:text-sky-600 transition-colors">
                        Mission Module
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-tighter ${
                        p.difficulty === "hard"
                          ? "text-rose-500 bg-rose-50"
                          : p.difficulty === "medium"
                          ? "text-amber-500 bg-amber-50"
                          : "text-emerald-500 bg-emerald-50"
                      }`}
                    >
                      {p.difficulty}
                    </span>
                    {!isEnded && (
                      <p className="text-[10px] font-bold text-sky-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-slate-900">
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
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
              Live Rankings
            </h2>
          </div>

          <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-50 shadow-2xl shadow-slate-200/50">
            <table className="w-full text-left bg-white border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-[0.2em]">
                  <th className="px-6 py-5">Rank</th>
                  <th className="px-6 py-5">Combatant</th>
                  <th className="px-6 py-5 text-center">Cleared</th>
                  <th className="px-6 py-5 text-right">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.map((row, idx) => {
                  const isCurrentUser = row.user_id === user?.id;
                  return (
                    <tr
                      key={row.user_id}
                      className={`group transition-colors ${
                        isCurrentUser ? "bg-sky-50/60" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            idx === 0
                              ? "bg-amber-400 text-white shadow-lg shadow-amber-200"
                              : idx === 1
                              ? "bg-slate-300 text-white shadow-lg shadow-slate-200"
                              : idx === 2
                              ? "bg-orange-300 text-white shadow-lg shadow-orange-200"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 font-bold">
                          User {row.user_id}{" "}
                          {isCurrentUser && (
                            <span className="text-[10px] ml-1 opacity-60 italic">
                              (YOU)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-black text-emerald-600">
                          {row.solved_count}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-slate-400 text-xs">
                        {row.penalty} PTS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="mt-20 text-center opacity-20 border-t border-slate-50 pt-10">
        <p className="text-[9px] font-black uppercase tracking-[1.5em] text-slate-900 italic">
          Sector: Contest Intelligence Unit
        </p>
      </footer>
    </div>
  );
}
