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
      <div className="min-h-screen bg-[#e4e4e4] dark:bg-[#121212] flex items-center justify-center font-['verdana','arial','sans-serif'] text-[13px]">
        <div className="text-[#3b5998] dark:text-[#8ab4f8] font-bold">Loading Standings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#e4e4e4] dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] font-['verdana','arial','sans-serif']">
      <div className="max-w-[1050px] mx-auto bg-white dark:bg-[#1e1e1e] min-h-screen border-l border-r border-[#ccc] dark:border-[#333] p-4 flex flex-col gap-6">
        
        {/* --- HEADER --- */}
        <div className="border-b border-[#b9b9b9] dark:border-[#444] pb-2 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#3b5998] dark:text-[#8ab4f8]">
              Final Standings - Contest #{contestId}
            </h2>
            <div className="text-[12px] text-[#888] dark:text-[#aaa] mt-1">
              The contest has concluded. Final standings:
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/contests/${contestId}/problems`)}
              className="text-[12px] text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] font-bold"
            >
              Problems
            </button>
            <button 
              onClick={() => navigate('/contests')}
              className="text-[12px] text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] font-bold"
            >
              &laquo; Back to Contests
            </button>
          </div>
        </div>

        {/* --- LEADERBOARD MATRIX --- */}
        <div>
          <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Standings</h2>
          <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-center border-collapse text-[12px] min-w-[700px]">
              <thead>
                <tr>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[40px]">#</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left min-w-[150px]">Who</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[40px]">=</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[60px]">Penalty</th>
                  
                  {/* Dynamic Problem Headers (A, B, C...) */}
                  {problems.map((p) => (
                    <th key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#1874cd] dark:text-[#5ea2f0] w-[60px] cursor-pointer hover:underline" onClick={() => navigate(`/contests/${contestId}/solve/${p.problem_id}`)}>
                      {p.problem_index}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4 + problems.length} className="border border-[#e1e1e1] dark:border-[#444] p-6 text-[#888] dark:text-[#aaa]">
                      Final Standings are not declared yet. Check tentative final standings <Link to={`/contests/${contestId}/problems`} className="text-[#1874cd] dark:text-[#5ea2f0] underline hover:text-[#0000a0]">here</Link>.
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
                        {/* Rank */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                          {idx + 1}
                        </td>
                        
                        {/* Username */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
                          <span className={`font-bold ${isCurrentUser ? "text-[#1874cd] dark:text-[#8ab4f8]" : "text-[#222] dark:text-[#d4d4d4]"}`}>
                            {row.username}
                          </span>
                        </td>

                        {/* Total Solved */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 font-bold text-[#00a900] dark:text-[#00cc00]">
                          {row.solved_count}
                        </td>

                        {/* Total Penalty */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">
                          {row.penalty}
                        </td>

                        {/* Problem Breakdown Cells */}
                        {problems.map((p) => {
                          // Find this user's stats for this specific problem column
                          const stat = row.problem_stats?.find(s => String(s.problem_id) === String(p.problem_id));
                          
                          if (!stat || (!stat.solved && stat.wrong_attempts === 0)) {
                            return <td key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] p-2"></td>;
                          }
                          
                          if (stat.solved) {
                            return (
                              <td key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] p-1.5 leading-tight">
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
                              <td key={p.problem_id} className="border border-[#e1e1e1] dark:border-[#444] p-2">
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
    </div>
  );
}
