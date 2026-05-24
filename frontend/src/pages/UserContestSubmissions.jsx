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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-['verdana','arial','sans-serif'] text-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading Submissions...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-['verdana','arial','sans-serif'] relative pb-16">
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Submission History
            </h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Contest:{" "}
              <Link 
                to={`/contests/${contestId}/problems`} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors"
              >
                {data.contest_name || `Contest #${contestId}`}
              </Link>
            </div>
          </div>
          <div className="text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg shadow-sm">
            Submissions by:{" "}
            <Link 
              to={`/profile/${data.username}`} 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors"
            >
              {data.username}
            </Link>
          </div>
        </div>

        {/* --- SUBMISSIONS TABLE --- */}
        <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 w-[80px]">#</th>
                  <th className="p-4 w-[160px]">When</th>
                  <th className="p-4">Problem</th>
                  <th className="p-4 text-center w-[100px]">Lang</th>
                  <th className="p-4 text-center w-[160px]">Verdict</th>
                  <th className="p-4 text-right w-[100px]">Time</th>
                  <th className="p-4 text-right w-[120px]">Memory</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.submissions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                      No submissions found for this user in this contest.
                    </td>
                  </tr>
                ) : (
                  data.submissions.map((sub) => {
                    // Modernized Verdict Styling
                    let badgeClass = "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30";
                    let verdictText = sub.verdict;

                    if (sub.verdict === "AC" || sub.verdict === "Accepted") {
                      badgeClass = "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30";
                      verdictText = "Accepted";
                    } else if (sub.verdict === "WA") {
                      verdictText = "Wrong Answer";
                    } else if (sub.verdict === "TLE") {
                      badgeClass = "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30";
                      verdictText = "Time Limit Exceeded";
                    } else if (sub.verdict === "CE") {
                      badgeClass = "bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                      verdictText = "Compilation Error";
                    }

                    return (
                      <tr key={sub.submission_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <span 
                            className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors"
                            onClick={() => setViewingSubmission(sub)}
                            title="View Source Code"
                          >
                            {sub.submission_id}
                          </span>
                        </td>
                        
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                          {formatCFDate(sub.submitted_at)}
                        </td>
                        
                        <td className="p-4">
                          <Link 
                            to={`/contests/${contestId}/solve/${sub.problem_id}`} 
                            className="font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {sub.problem_index} - {sub.problem_title}
                          </Link>
                        </td>
                        
                        <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                          {sub.language}
                        </td>
                        
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-md border ${badgeClass}`}>
                            {verdictText}
                          </span>
                        </td>
                        
                        <td className="p-4 text-right text-slate-600 dark:text-slate-400 tabular-nums text-xs">
                          {sub.time_ms !== null && sub.time_ms !== undefined ? `${sub.time_ms} ms` : "0 ms"}
                        </td>
                        
                        <td className="p-4 text-right text-slate-600 dark:text-slate-400 tabular-nums text-xs">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#1e293b] rounded-t-xl">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-base">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Submission #{viewingSubmission.submission_id}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Problem: <span className="font-bold text-slate-700 dark:text-slate-300">{viewingSubmission.problem_index} - {viewingSubmission.problem_title}</span>
                  <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
                  Language: <span className="font-bold text-slate-700 dark:text-slate-300">{viewingSubmission.language}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingSubmission(null)}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body (Code Editor View) */}
            <div className="flex-1 overflow-auto p-4 bg-[#fffffe] dark:bg-[#1e1e1e]">
              <pre className="text-sm font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap m-0 leading-relaxed">
                {viewingSubmission.code || "// No code found for this submission."}
              </pre>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-[#1e293b] px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end rounded-b-xl">
              <button 
                onClick={() => setViewingSubmission(null)}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-1.5 px-6 rounded-md transition-colors text-sm shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}