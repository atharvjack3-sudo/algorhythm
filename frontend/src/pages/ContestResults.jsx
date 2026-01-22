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
      <div className="flex flex-col justify-center items-center h-[90vh] bg-white">
        <div className="w-16 h-1 border-4 border-sky-100 bg-sky-100 overflow-hidden rounded-full">
          <div className="w-1/2 h-full bg-sky-500 animate-slide-infinite"></div>
        </div>
        <p className="mt-4 text-sky-600 font-black tracking-widest text-xs uppercase">
          Retrieving Battle Logs...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 bg-white min-h-screen font-sans">
      {/* --- HEADER / MISSION DEBRIEF --- */}
      <header className="mb-12 border-l-8 border-sky-500 pl-6">
        <p className="text-sky-500 font-black text-xs uppercase tracking-[0.4em] mb-2">
          Operation: Concluded
        </p>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
          CONTEST <span className="text-sky-500">#{contestId}</span> RESULTS
        </h1>
        <div className="flex gap-4 mt-4">
          <span className="bg-slate-100 px-3 py-1 rounded text-[10px] font-bold text-slate-500 uppercase italic">
            Archive Verified
          </span>
          <span className="bg-sky-50 px-3 py-1 rounded text-[10px] font-bold text-sky-600 uppercase italic font-black underline underline-offset-4 decoration-2">
            Hall of Fame
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* --- LEFT SIDE MISSION OBJECTIVES (PROBLEMS) --- */}
        <section className="lg:col-span-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
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
                className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-sky-300 hover:bg-white transition-all cursor-default shadow-sm hover:shadow-sky-100/50"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-sky-600 font-black text-xs">
                    {p.problem_index}
                  </span>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">
                      {" "}
                      Mission{" "}
                      {p.problem_index === "A"
                        ? "Alpha"
                        : p.problem_index === "B"
                          ? "Beta"
                          : p.problem_index === "C"
                            ? "Gamma"
                            : "Delta"}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {p.title}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    p.difficulty === "hard"
                      ? "text-rose-500 bg-rose-50"
                      : p.difficulty === "medium"
                        ? "text-amber-500 bg-amber-50"
                        : "text-emerald-500 bg-emerald-50"
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
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              Final Rankings
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                No Combatants Recorded
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-sky-100 shadow-xl shadow-sky-100/20">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-sky-500 text-white uppercase text-[10px] font-black tracking-[0.2em]">
                    <th className="px-6 py-5">Rank</th>
                    <th className="px-6 py-5">Combatant</th>
                    <th className="px-6 py-5 text-center">Tasks Cleared</th>
                    <th className="px-6 py-5 text-right">Time (w/ Penalty)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((row, idx) => {
                    const isTop3 = idx < 3;
                    const rankColor =
                      idx === 0
                        ? "bg-amber-400 shadow-amber-200" // Gold
                        : idx === 1
                          ? "bg-slate-300 shadow-slate-100" // Silver
                          : idx === 2
                            ? "bg-orange-300 shadow-orange-100" // Bronze
                            : "bg-slate-100 text-slate-400";

                    return (
                      <tr
                        key={row.user_id}
                        className={`group hover:bg-sky-50/50 transition-colors ${isTop3 ? "bg-sky-50/20" : ""}`}
                      >
                        <td className="px-6 py-5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-lg ${rankColor} ${isTop3 ? "text-white" : "text-slate-400"}`}
                          >
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-500 font-bold text-xs uppercase">
                              {row.username[0]}
                            </div>
                            <span className="font-bold text-slate-700 tracking-tight">
                              {row.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            onClick={async () => {
                              try {
                                const res = await api.get(
                                  `/contests/${contestId}/results/${row.user_id}`,
                                );
                                setPopupData(res.data);
                                setPopupUser(row.user_id);
                                setShowPopup(true);
                              } catch {
                                alert("Unable to load problem breakdown");
                              }
                            }}
                            className="inline-block px-4 py-1 rounded-full bg-emerald-50 text-emerald-600 font-black text-sm cursor-pointer hover:bg-emerald-100"
                          >
                            {row.solved_count}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-bold text-slate-400 text-sm">
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
      <footer className="mt-20 flex justify-center">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-sky-500 transition-all shadow-xl shadow-slate-200 hover:shadow-sky-200"
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
      {showPopup && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          {/* POPUP CONTAINER: TACTICAL HUD */}
          <div className="relative bg-slate-900 w-[480px] p-1 rounded-[2.5rem] shadow-2xl shadow-sky-500/20 ring-1 ring-sky-500/50 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Background grid pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>

            <div className="relative bg-slate-900/90 backdrop-blur rounded-[2rem] p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse shadow-[0_0_10px_#0ea5e9]"></div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-white">
                    Combatant Analysis
                  </h3>
                </div>
                <span className="text-sky-500 font-mono text-xs font-bold uppercase tracking-[0.3em] opacity-80">
                  ID: U-{popupUser}
                </span>
              </div>

              {/* List of Problems */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {popupData.map((p) => (
                  <div
                    key={p.problem_index}
                    className={`flex justify-between items-center border-l-[6px] rounded-r-2xl p-4 transition-all ${
                      p.solved
                        ? "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:bg-slate-800/80"
                    }`}
                  >
                    {/* Problem Info */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg border-2 ${
                          p.solved
                            ? "bg-emerald-500 text-slate-900 border-emerald-500"
                            : "bg-slate-900 text-slate-400 border-slate-700"
                        }`}
                      >
                        {p.problem_index}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm uppercase tracking-tight">
                          {p.title}
                        </p>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            p.difficulty === "hard"
                              ? "text-rose-400 bg-rose-500/20"
                              : p.difficulty === "medium"
                                ? "text-amber-400 bg-amber-500/20"
                                : "text-sky-400 bg-sky-500/20"
                          }`}
                        >
                          {p.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Status and Stats */}
                    <div className="text-right font-mono">
                      {p.solved ? (
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-400 font-black text-sm flex items-center gap-2 uppercase">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            AC
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight opacity-80">
                            @ T+{p.first_ac_time_minutes}m
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-black text-sm uppercase tracking-widest">
                          —
                        </span>
                      )}

                      {p.wrong_attempts > 0 && (
                        <div className="text-[10px] text-rose-400 font-bold mt-1 flex items-center justify-end gap-1 uppercase tracking-tight">
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
                className="mt-8 w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-widest transition-all border-b-4 border-sky-800 hover:border-sky-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Dismiss Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
