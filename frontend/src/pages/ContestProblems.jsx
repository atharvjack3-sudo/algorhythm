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
  if (
    typeof d === "string" &&
    !d.includes("Z") &&
    !d.includes("+") &&
    d.length <= 23
  ) {
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
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr, onZero]);

  return (
    <span className="font-mono tabular-nums font-bold tracking-[0.1em] text-red-500">
      {timeLeft}
    </span>
  );
};

const getContestColor = (r) => {
  if (!r || r < 1200) return "#94a3b8";
  if (r <= 1399) return "#22c55e";
  if (r <= 1599) return "#14b8a6";
  if (r <= 1899) return "#3b82f6";
  if (r <= 2099) return "#d946ef";
  if (r <= 2399) return "#f97316";
  return "#ef4444";
};

export default function ContestProblems() {
  const { contestId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [writers, setWriters] = useState([]);
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
          signal: controller.signal,
        });

        setContest(res.data.contest);
        setProblems(res.data.problems);
        setLeaderboard(res.data.leaderboard);
        setWriters(res.data.writers);
        console.log(res.data.writers);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse">
          Loading Contest Dashboard...
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
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        .animate-blink { animation: blink 1s infinite; }
      `}</style>

      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-12">
        <div className="max-w-6xl mx-auto py-10 px-6 flex flex-col md:flex-row gap-8">
          {/* --- MAIN CONTENT COLUMN (LEFT) --- */}
          <div className="flex-1 flex flex-col gap-10">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                    Problemset
                  </span>
                </div>

                <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {contest?.name || contestId}
                </h1>

                {writers && writers.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Writers:
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {writers.map((w, i) => (
                        <div key={w.user_id} className="flex items-center">
                          <Link
                            to={`/profile/${w.username}`}
                            style={{ color: getContestColor(w.contest_rating) }}
                            className="font-sans text-[14px] -translate-y-0.5 font-bold hover:underline transition-colors"
                          >
                            {w.username}
                          </Link>
                          {i < writers.length - 1 && (
                            <span className="text-slate-400 -translate-y-0.5 font-semibold dark:text-slate-600 ml-1">
                              ,
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/contests")}
                  className="font-mono text-[11px] font-semibold tracking-[0.06em] rounded transition-all cursor-pointer bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  ← Back
                </button>
              </div>
            </div>

            {/* Ended Banner */}
            {isEnded && (
              <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md p-4 flex flex-col gap-1.5 shadow-sm">
                <span className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-2">
                  Contest Concluded
                </span>
                <span className="font-sans font-semibold tracking-wide text-xs text-slate-600 dark:text-slate-400">
                  Submissions are no longer accepted. Problem statements remain
                  available to view.
                </span>
              </div>
            )}

            {/* PROBLEMS TABLE */}
            {problems.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                    Problems
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-12">
                            #
                          </th>
                          <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-left">
                            Name
                          </th>
                          <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">
                            Difficulty
                          </th>
                          <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">
                            Solved
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {problems.map((p) => {
                          const myData = leaderboard.find(
                            (row) => row.user_id === user?.id,
                          );
                          const myStat = myData?.problem_stats?.find(
                            (s) =>
                              String(s.problem_id) === String(p.problem_id),
                          );

                          let rowBg =
                            "border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 group";
                          if (myStat?.solved)
                            rowBg =
                              "bg-green-50/60 dark:bg-green-900/20 hover:bg-green-100/60 dark:hover:bg-green-900/40 border-b border-green-100 dark:border-green-900/50 transition-colors group";
                          else if (myStat?.wrong_attempts > 0)
                            rowBg =
                              "bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100/60 dark:hover:bg-red-900/40 border-b border-red-100 dark:border-red-900/50 transition-colors group";

                          return (
                            <tr key={p.problem_id} className={rowBg}>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className="font-mono text-[13px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer transition-colors hover:opacity-75"
                                  onClick={() =>
                                    navigate(
                                      `/contests/${contestId}/solve/${p.problem_id}`,
                                    )
                                  }
                                >
                                  {p.problem_index}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                  onClick={() =>
                                    navigate(
                                      `/contests/${contestId}/solve/${p.problem_id}`,
                                    )
                                  }
                                >
                                  {p.title || `Problem ${p.problem_index}`}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] font-mono text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {p.difficulty}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                <div className="inline-flex items-center gap-1.5">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
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
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3.5 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block w-[3px] h-[14px] rounded-sm bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                    {isEnded ? "Tentative Final Standings" : "Live Standings"}
                  </span>
                </div>
                {isEnded && (
                  <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    Final standings will be published{" "}
                    <Link
                      to={`/contests/${contestId}`}
                      className="dark:text-orange-500 text-orange-600 hover:underline"
                    >
                      here.
                    </Link>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-12">
                          #
                        </th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-left min-w-[150px]">
                          Who
                        </th>
                        <th
                          className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-12"
                          title="Solved Count"
                        >
                          =
                        </th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-20">
                          Penalty
                        </th>

                        {problems.map((p) => (
                          <th
                            key={p.problem_id}
                            className="px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.1em] text-blue-600 dark:text-blue-400 uppercase text-center w-16 cursor-pointer hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                            onClick={() =>
                              navigate(
                                `/contests/${contestId}/solve/${p.problem_id}`,
                              )
                            }
                            title={p.title}
                          >
                            {p.problem_index}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4 + problems.length}
                            className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs tracking-[0.06em]"
                          >
                            No recorded submissions yet.
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
                              <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3 text-left">
                                <Link
                                  to={`/contests/${contestId}/${row.user_id}/submissions`}
                                  className={`font-sans text-[13px] font-semibold ${isCurrentUser ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"} hover:underline`}
                                >
                                  {row.username}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-[11px] font-bold text-green-600 dark:text-green-500">
                                {row.solved_count}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {row.penalty}
                              </td>

                              {problems.map((p) => {
                                const stat = row.problem_stats?.find(
                                  (s) =>
                                    String(s.problem_id) ===
                                    String(p.problem_id),
                                );

                                if (
                                  !stat ||
                                  (!stat.solved && stat.wrong_attempts === 0)
                                ) {
                                  return (
                                    <td
                                      key={p.problem_id}
                                      className="px-4 py-2 text-center"
                                    ></td>
                                  );
                                }

                                if (stat.solved) {
                                  return (
                                    <td
                                      key={p.problem_id}
                                      className="px-4 py-2 text-center align-middle"
                                    >
                                      <div className="font-mono font-bold text-green-600 dark:text-green-500 text-[11px]">
                                        +
                                        {stat.wrong_attempts > 0
                                          ? stat.wrong_attempts
                                          : ""}
                                      </div>
                                      <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        {formatCFTime(
                                          stat.first_ac_time_minutes,
                                        )}
                                      </div>
                                    </td>
                                  );
                                } else {
                                  return (
                                    <td
                                      key={p.problem_id}
                                      className="px-4 py-2 text-center align-middle"
                                    >
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
            </section>
          </div>

          {/* --- SIDEBAR COLUMN (RIGHT) --- */}
          <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-5">
            {/* CONTEST STATUS CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">
                  Contest Status
                </span>
              </div>
              <div className="p-4 text-center flex flex-col items-center justify-center min-h-[120px]">
                {isEnded ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-mono text-[11px] font-bold tracking-widest text-red-500 uppercase">
                      FINISHED
                    </span>
                    <div className="font-sans text-[12px] text-slate-500 dark:text-slate-400 mt-1 tracking-wider">
                      Tentative Final standings displayed
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <span className="font-mono text-[11px] font-bold tracking-widest text-green-500 uppercase flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-blink shadow-[0_0_6px_#22c55e]" />
                      RUNNING
                    </span>
                    {contest?.end_time && (
                      <div className="text-xl">
                        <LiveTimer
                          targetDateStr={contest.end_time}
                          onZero={() => window.location.reload()}
                        />
                      </div>
                    )}
                    <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                      Good luck, have fun!
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RULES BOX */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">
                  Rules & Info
                </span>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                {[
                  [
                    "Navigation",
                    "Click on a problem index to read the statement and submit code.",
                  ],
                  [
                    "Scoring",
                    "Penalty is calculated as 5 minutes per wrong submission on solved problems.",
                  ],
                  [
                    "Data Sync",
                    "Do not refresh the page rapidly; data syncs automatically.",
                  ],
                ].map(([title, body]) => (
                  <div
                    key={title}
                    className="border-l-2 border-slate-300 dark:border-slate-700 pl-2.5"
                  >
                    <div className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-[0.08em] mb-1">
                      {title}
                    </div>
                    <div className="font-sans text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
