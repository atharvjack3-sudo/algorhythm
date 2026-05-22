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

  return <span className="font-mono font-bold tracking-wide">{timeLeft}</span>;
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
      <div className="min-h-screen bg-[#e4e4e4] dark:bg-[#121212] flex items-center justify-center font-['verdana','arial','sans-serif'] text-[13px]">
        <div className="text-[#3b5998] dark:text-[#8ab4f8] font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#e4e4e4] dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] font-['verdana','arial','sans-serif']">
      <div className="max-w-[1050px] mx-auto bg-white dark:bg-[#1e1e1e] min-h-screen border-l border-r border-[#ccc] dark:border-[#333] p-4 flex flex-col md:flex-row gap-6">
        
        {/* --- MAIN CONTENT COLUMN (LEFT) --- */}
        <div className="flex-1">
          
          <div className="mb-4 pb-2 border-b border-[#b9b9b9] dark:border-[#444]">
            <h2 className="text-[18px] font-bold text-[#3b5998] dark:text-[#8ab4f8]">
              Dashboard - Contest #{contestId}
            </h2>
          </div>

          {/* Ended Banner */}
          {isEnded && (
            <div className="mb-6 border border-[#b9b9b9] dark:border-[#444] bg-[#f8f8f8] dark:bg-[#252526] p-4 text-[13px] text-center">
              <span className="font-bold text-[#ff0000] dark:text-[#ff6666]">Contest has ended.</span>
              <br />
              <span className="text-[#888] dark:text-[#aaa] mt-1 inline-block">
                Submissions are no longer accepted. Problem statements remain available for practice.
              </span>
            </div>
          )}

          {/* PROBLEMS TABLE */}
          {problems.length > 0 && (
            <div className="mb-8">
              <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-white dark:bg-[#1e1e1e]">
                <div className="bg-[#e1e1e1] dark:bg-[#2d2d30] border-b border-[#b9b9b9] dark:border-[#444] p-[5px_10px] flex justify-between items-center">
                  <div className="text-[14px] font-bold text-[#222] dark:text-[#d4d4d4]">
                    Problems
                  </div>
                </div>
                
                <table className="w-full text-center border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className="border-b border-[#e1e1e1] dark:border-[#444] p-[6px] w-[50px] font-bold text-[#222] dark:text-[#d4d4d4]">#</th>
                      <th className="border-b border-l border-[#e1e1e1] dark:border-[#444] p-[6px] text-left font-bold text-[#222] dark:text-[#d4d4d4]">Name</th>
                      <th className="border-b border-l border-[#e1e1e1] dark:border-[#444] p-[6px] w-[140px]"></th>
                      <th className="border-b border-l border-[#e1e1e1] dark:border-[#444] p-[6px] w-[80px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p, i) => {
                      const myData = leaderboard.find(row => row.user_id === user?.id);
                      const myStat = myData?.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));

                      let rowBg = i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]";
                      if (myStat?.solved) rowBg = "bg-[#d4edc9] dark:bg-[#1a381a]";
                      else if (myStat?.wrong_attempts > 0) rowBg = "bg-[#ffe3e3] dark:bg-[#3d1818]";

                      return (
                        <tr key={p.problem_id} className={rowBg}>
                          <td className="p-[8px] border-t border-[#e1e1e1] dark:border-[#444]">
                            <span 
                              className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer text-[14px]" 
                              onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                            >
                              {p.problem_index}
                            </span>
                          </td>
                          <td className="p-[8px] border-t border-l border-[#e1e1e1] dark:border-[#444] text-left">
                            <span 
                              className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" 
                              onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}
                            >
                              {p.title || `Problem ${p.problem_index}`}
                            </span>
                          </td>
                          <td className="p-[8px] border-t border-l border-[#e1e1e1] dark:border-[#444] text-right text-[11px] text-[#888] dark:text-[#aaa]">
                            <div className="leading-tight uppercase tracking-wide">
                              {p.difficulty}
                            </div>
                          </td>
                          <td className="p-[8px] border-t border-l border-[#e1e1e1] dark:border-[#444] text-[12px]">
                            <span className="text-[#1874cd] dark:text-[#5ea2f0] flex items-center justify-center gap-1">
                              <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                              </svg>
                              x{p.solved_count || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STANDINGS MATRIX TABLE */}
          <div>
            <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">
              {isEnded ? "Tentative Final Standings" : "Live Standings"}
            </h2>
            
            {/* Conditional Sub-note */}
            {isEnded && (
              <div className="mb-2 text-[11px] text-[#888] dark:text-[#aaa]">
                Final standings will be published <Link to={`/contests/${contestId}`} className="text-[#1874cd] dark:text-[#5ea2f0] underline hover:text-[#0000a0]">here</Link> after finalization.
              </div>
            )}

            <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-center border-collapse text-[12px] min-w-[600px]">
                <thead>
                  <tr>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[40px]">#</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left min-w-[150px]">Who</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[40px]">=</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[60px]">Penalty</th>
                    
                    {problems.map((p) => (
                      <th key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#1874cd] dark:text-[#5ea2f0] w-[50px] cursor-pointer hover:underline" onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}>
                        {p.problem_index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4 + problems.length} className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">
                        No users have registered or submitted yet.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row, idx) => {
                      const isCurrentUser = row.user_id === user?.id;
                      return (
                        <tr 
                          key={row.user_id} 
                          className={isCurrentUser ? "bg-[#e0efff] dark:bg-[#203a55]" : (idx % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]")}
                        >
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                            {idx + 1}
                          </td>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
                            <span className={`font-bold ${isCurrentUser ? "text-[#1874cd] dark:text-[#8ab4f8]" : "text-[#222] dark:text-[#d4d4d4]"}`}>
                              {row.username}
                            </span>
                          </td>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                            <span className="font-bold text-[#00a900] dark:text-[#00cc00]">
                              {row.solved_count}
                            </span>
                          </td>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-[#888] dark:text-[#aaa]">
                            {row.penalty}
                          </td>

                          {problems.map((p) => {
                            const stat = row.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));
                            
                            if (!stat || (!stat.solved && stat.wrong_attempts === 0)) {
                              return <td key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] p-2"></td>;
                            }

                            if (stat.solved) {
                              return (
                                <td key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] p-1.5 leading-tight text-center">
                                  <div className="font-bold text-[#00a900] dark:text-[#00cc00]">
                                    +{stat.wrong_attempts > 0 ? stat.wrong_attempts : ""}
                                  </div>
                                  <div className="text-[10px] text-[#888] dark:text-[#aaa]">
                                    {formatCFTime(stat.first_ac_time_minutes)}
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] p-2 text-center">
                                  <div className="font-bold text-[#ff0000] dark:text-[#ff6666]">
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

        {/* --- SIDEBAR COLUMN (RIGHT) --- */}
        <div className="w-full md:w-[270px] shrink-0 flex flex-col gap-4">
          
          <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
            <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
              &rarr; Contest Status
            </div>
            <div className="p-3 text-[12px] text-center">
              {isEnded ? (
                <div>
                  <div className="font-bold text-[#ff0000] dark:text-[#ff6666] mb-1">Finished</div>
                  <div className="text-[#888] dark:text-[#aaa]">Final standings are displayed.</div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-[#008000] dark:text-[#00cc00] mb-1">
                    Running
                  </div>
                  {contest?.end_time && (
                    <div className="text-[#222] dark:text-[#d4d4d4] text-[13px] mb-2 font-mono">
                      <LiveTimer targetDateStr={contest.end_time} onZero={() => window.location.reload()} />
                    </div>
                  )}
                  <div className="text-[#888] dark:text-[#aaa] text-[11px]">Good luck, have fun!</div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
            <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
              &rarr; Information
            </div>
            <div className="p-3 text-[11px] leading-relaxed text-[#222] dark:text-[#d4d4d4]">
              <ul className="list-disc pl-4 flex flex-col gap-1.5">
                <li>Click on a problem index to read the statement and submit code.</li>
                <li>Penalty is calculated as <strong>10 minutes</strong> per wrong submission on solved problems.</li>
                <li>Do not refresh the page rapidly.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
