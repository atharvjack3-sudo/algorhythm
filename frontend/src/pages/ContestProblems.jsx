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

const getUnixTime = (dateStr) => {
  if (!dateStr) return 0;
  let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
  if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) {
    d += "Z";
  }
  return new Date(d).getTime();
};

const LiveTimer = ({ targetDateStr, onZero }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDateStr) return;
    const target = getUnixTime(targetDateStr);
    
    const tick = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        if (onZero) onZero();
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr, onZero]);

  return <span className="font-mono tabular-nums font-bold tracking-tight text-red-600 dark:text-red-400">{timeLeft}</span>;
};

export default function ContestProblems() {
  const { contestId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (authLoading || !user) return;
    const controller = new AbortController();

    async function loadArena() {
      try {
        setLoading(true);
        const res = await api.get(`/contests/${contestId}/arena`, {
          signal: controller.signal
        });
        
        setContest(res.data.contest);
        setProblems(res.data.problems);
        setLeaderboard(res.data.leaderboard);
        setIsEnded(res.data.status === "ended");

      } catch (err) {
        if (err.name === "CanceledError") return;
        
        // Redirect if the user tries to manually URL jump before the contest starts
        if (err.response?.data?.code === "UPCOMING") {
          navigate("/contests");
        } else {
          navigate("/contests");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadArena();
    return () => controller.abort();
  }, [contestId, user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans text-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Syncing Arena Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/50 pb-12">
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8">
        
        {/* --- MAIN CONTENT COLUMN (LEFT) --- */}
        <div className="flex-1 flex flex-col gap-8">
          
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              Problems - {contest?.name || contestId}
            </h1>
          </div>

          {/* Ended Banner */}
          {isEnded && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5 text-center flex flex-col items-center gap-1.5 shadow-sm">
              <span className="font-bold text-red-700 dark:text-red-400 text-base flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Contest has ended
              </span>
              <span className="text-red-600/80 dark:text-red-300/70 text-sm">
                Submissions are no longer accepted. Problem statements remain available for practice.
              </span>
            </div>
          )}

          {/* PROBLEMS TABLE */}
          {problems.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                Problems
              </h2>
              <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4">Name</th>
                        <th className="p-4 text-center">Difficulty</th>
                        <th className="p-4 text-center">Solved</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                      {problems.map((p) => {
                        const myData = leaderboard.find(row => row.user_id === user?.id);
                        const myStat = myData?.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));

                        let rowBg = "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group";
                        if (myStat?.solved) rowBg = "bg-green-50/50 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group";
                        else if (myStat?.wrong_attempts > 0) rowBg = "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group";

                        return (
                          <tr key={p.problem_id} className={rowBg}>
                            <td className="p-4 text-center">
                              <span 
                                className="font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 cursor-pointer transition-colors" 
                                onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                              >
                                {p.problem_index}
                              </span>
                            </td>
                            <td className="p-4">
                              <span 
                                className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer transition-colors" 
                                onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                              >
                                {p.title || `Problem ${p.problem_index}`}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {p.difficulty}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                </svg>
                                {p.solved_count || 0}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* STANDINGS MATRIX TABLE */}
          <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>
                {isEnded ? "Tentative Final Standings" : "Live Standings"}
              </h2>
              {isEnded && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Final standings will be published <Link to={`/contests/${contestId}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">here</Link>.
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3 min-w-[150px]">Who</th>
                      <th className="p-3 text-center w-12" title="Solved Count">=</th>
                      <th className="p-3 text-center w-20">Penalty</th>
                      
                      {problems.map((p) => (
                        <th 
                          key={p.problem_id} 
                          className="p-3 text-center w-16 text-blue-600 dark:text-blue-400 cursor-pointer hover:underline transition-all" 
                          onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                          title={p.title}
                        >
                          {p.problem_index}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={4 + problems.length} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          No submissions yet. The arena is quiet.
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
                            <td className="p-3 text-center font-medium text-slate-500 dark:text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="p-3 text-left">
                              <Link 
                                to={`/contests/${contestId}/${row.user_id}/submissions`}
                                className={`font-semibold ${isCurrentUser ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"} hover:underline`}
                              >
                                {row.username}
                              </Link>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-100">
                              {row.solved_count}
                            </td>
                            <td className="p-3 text-center text-slate-500 dark:text-slate-400 tabular-nums">
                              {row.penalty}
                            </td>

                            {problems.map((p) => {
                              const stat = row.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));
                              
                              if (!stat || (!stat.solved && stat.wrong_attempts === 0)) {
                                return <td key={p.problem_id} className="p-3 text-center"></td>;
                              }

                              if (stat.solved) {
                                return (
                                  <td key={p.problem_id} className="p-2 text-center align-middle">
                                    <div className="font-bold text-green-600 dark:text-green-500 text-sm">
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
                                    <div className="font-bold text-red-500 dark:text-red-400 text-sm">
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
          </section>
        </div>

        {/* --- SIDEBAR COLUMN (RIGHT) --- */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* CONTEST STATUS CARD */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Contest Status
              </h3>
            </div>
            <div className="p-6 text-center flex flex-col items-center justify-center min-h-[120px]">
              {isEnded ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm rounded-full tracking-wide ">
                    Finished
                  </span>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    Final standings are displayed.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm rounded-full tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Running
                  </span>
                  {contest?.end_time && (
                    <div className="text-2xl text-slate-800 dark:text-slate-100">
                      <LiveTimer targetDateStr={contest.end_time} onZero={() => window.location.reload()} />
                    </div>
                  )}
                  <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    Good luck, have fun!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RULES BOX */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/30 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-blue-100 dark:border-blue-800/30 bg-blue-100/50 dark:bg-blue-900/20">
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Information
              </h3>
            </div>
            <div className="p-5 text-xs leading-relaxed text-blue-800/80 dark:text-blue-200/70">
              <ul className="list-disc pl-4 flex flex-col gap-2.5">
                <li>Click on a problem index to read the statement and submit code.</li>
                <li>Penalty is calculated as <strong className="font-semibold text-blue-900 dark:text-blue-200">10 minutes</strong> per wrong submission on solved problems.</li>
                <li>Do not refresh the page rapidly; data syncs automatically.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}