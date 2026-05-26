import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

// Format date exactly like the screenshot: May/20/2026 14:23
const formatCFDate = (dateStr) => {
  if (!dateStr) return "---";
  let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
  if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) d += "Z";
  
  const dateObj = new Date(d);
  const month = dateObj.toLocaleString("en-US", { month: "short", timeZone: "Asia/Kolkata" });
  const day = dateObj.toLocaleString("en-US", { day: "2-digit", timeZone: "Asia/Kolkata" });
  const year = dateObj.toLocaleString("en-US", { year: "numeric", timeZone: "Asia/Kolkata" });
  const time = dateObj.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
  
  return `${month}/${day}/${year} ${time}`;
};

export default function UserContestSubmissions() {
  const { contestId, userId } = useParams();
  
  const [data, setData] = useState({
    contest_name: "",
    username: "",
    submissions: []
  });
  const [loading, setLoading] = useState(true);
  
  // NEW STATE: Tracks which submission's code we are currently viewing
  const [viewingSubmission, setViewingSubmission] = useState(null);

  useEffect(() => {
    const cacheKey = `contest_${contestId}_user_${userId}_subs`;

    async function fetchSubmissions() {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return; 
      }

      try {
        const res = await api.get(`/contests/${contestId}/submissions/${userId}`);
        const resultData = res.data;
        setData(resultData);

        if (resultData.is_ended) {
          sessionStorage.setItem(cacheKey, JSON.stringify(resultData));
        }
      } catch (err) {
        console.error("Failed to load submissions", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [contestId, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING SUBMISSIONS...
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
      `}</style>

      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 relative pb-16">
        <div className="max-w-6xl mx-auto py-10 px-6 flex flex-col gap-8">
          
          {/* --- HEADER --- */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  User Submission History
                </span>
              </div>
              <Link 
                to={`/contests/${contestId}/problems`} 
                className="font-sans text-2xl md:text-3xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {data.contest_name || `Contest #${contestId}`}
              </Link>
            </div>
            
            <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-md shadow-sm flex items-center gap-2">
              User: 
              <Link 
                to={`/profile/${data.username}`} 
                className="dark:text-orange-500 text-orange-600 hover:text-orange-700 transition-colors font-bold"
              >
                {data.username}
              </Link>
            </div>
          </div>

          {/* --- SUBMISSIONS TABLE --- */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase w-[80px]">#</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase w-[160px]">When</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">Problem</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-[100px]">Lang</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-[160px]">Verdict</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right w-[100px]">Time</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right w-[120px]">Memory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {data.submissions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px] tracking-[0.06em] uppercase">
                        No submissions found for this user in this contest.
                      </td>
                    </tr>
                  ) : (
                    data.submissions.map((sub) => {
                      // Modernized Verdict Styling
                      let badgeClass = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
                      let verdictText = sub.verdict;

                      if (sub.verdict === "AC" || sub.verdict === "Accepted") {
                        badgeClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
                        verdictText = "Accepted";
                      } else if (sub.verdict === "WA") {
                        verdictText = "Wrong Answer";
                      } else if (sub.verdict === "TLE") {
                        badgeClass = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
                        verdictText = "Time Limit Exceeded";
                      } else if (sub.verdict === "CE") {
                        badgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
                        verdictText = "Compilation Error";
                      }

                      return (
                        <tr key={sub.submission_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-4 py-3">
                            <span 
                              className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 cursor-pointer transition-colors"
                              onClick={() => setViewingSubmission(sub)}
                              title="View Source Code"
                            >
                              {sub.submission_id}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {formatCFDate(sub.submitted_at)}
                          </td>
                          
                          <td className="px-4 py-3">
                            <Link 
                              to={`/contests/${contestId}/solve/${sub.problem_id}`} 
                              className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                            >
                              {sub.problem_index} - {sub.problem_title}
                            </Link>
                          </td>
                          
                          <td className="px-4 py-3 text-center font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            {sub.language}
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-semibold tracking-wide uppercase ${badgeClass}`}>
                              {verdictText}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {sub.time_ms !== null && sub.time_ms !== undefined ? `${sub.time_ms} ms` : "0 ms"}
                          </td>
                          
                          <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {sub.memory_kb !== null && sub.memory_kb !== undefined ? `${sub.memory_kb} KB` : "0 KB"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- CODE VIEWER MODAL --- */}
        {viewingSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
              
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  SUBMISSION #{viewingSubmission.submission_id} · {viewingSubmission.problem_index} · {viewingSubmission.language}
                </div>
                <button 
                  onClick={() => setViewingSubmission(null)}
                  className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1"
                >
                  CLOSE [X]
                </button>
              </div>

              {/* Modal Body (Code Editor View) */}
              <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-[#0d1117]">
                <pre className="font-mono text-[12px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap m-0 leading-relaxed">
                  {viewingSubmission.code || "// No code found for this submission."}
                </pre>
              </div>
              
              {/* Modal Footer */}
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => setViewingSubmission(null)}
                  className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase rounded transition-colors bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-6 py-2 shadow-sm"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}