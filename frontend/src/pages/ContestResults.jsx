// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { api } from "../api/client";
// import { useAuth } from "../context/AuthContext";

// export default function ContestResults() {
//   const { contestId } = useParams();
//   const navigate = useNavigate();
//   const { user, authLoading } = useAuth();
  
//   const [problems, setProblems] = useState([]);
//   const [leaderboard, setLeaderboard] = useState([]);
//   const [loading, setLoading] = useState(true);
  
//   const [showPopup, setShowPopup] = useState(false);
//   const [popupUser, setPopupUser] = useState(null);
//   const [popupData, setPopupData] = useState([]);

//   useEffect(() => {
//     if (!user) return;
//     async function load() {
//       try {
//         const res = await api.get(`/contests/${contestId}/results`);
//         setProblems(res.data.problems);
//         setLeaderboard(res.data.leaderboard);
//       } catch (err) {
//         console.error("Failed to fetch results", err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//   }, [contestId, user]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] flex items-center justify-center transition-colors duration-300">
//         <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
//           Loading Standings...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
//       <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-12">
        
//         {/* --- HEADER --- */}
//         <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
//           <div>
//             <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Final Standings</h1>
//             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//               Leaderboard and problem statistics for Contest #{contestId}
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider rounded">
//               Contest Concluded
//             </span>
//           </div>
//         </div>

//         {/* --- PROBLEM SUMMARY --- */}
//         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 mb-8 shadow-sm">
//           <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
//             Problem Set
//             <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
//               {problems.length}
//             </span>
//           </h3>
//           <div className="flex flex-wrap gap-x-8 gap-y-3">
//             {problems.map((p) => (
//               <div key={p.problem_id} className="flex items-center gap-2.5 group">
//                 <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline cursor-pointer">
//                   {p.problem_index}
//                 </span>
//                 <span className="text-[13px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
//                   {p.title}
//                 </span>
//                 <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
//                   p.difficulty === "hard"
//                     ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
//                     : p.difficulty === "medium"
//                     ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
//                     : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
//                 }`}>
//                   {p.difficulty}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* --- LEADERBOARD --- */}
//         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-sm mb-10">
//           {leaderboard.length === 0 ? (
//             <div className="p-12 text-center text-xs text-slate-500 font-semibold tracking-widest uppercase border-dashed border-2 border-slate-100 dark:border-slate-800 m-4 rounded-lg">
//               No Participants Recorded
//             </div>
//           ) : (
//             <table className="w-full text-left border-collapse min-w-[600px]">
//               <thead>
//                 <tr>
//                   <th className="w-16 px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-center">
//                     #
//                   </th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
//                     Participant
//                   </th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-center">
//                     Solved
//                   </th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-right">
//                     Penalty
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
//                 {leaderboard.map((row, idx) => {
//                   const rankColor = 
//                     idx === 0 ? "text-amber-500 dark:text-amber-400 font-bold" :
//                     idx === 1 ? "text-slate-400 dark:text-slate-300 font-bold" :
//                     idx === 2 ? "text-orange-500 dark:text-orange-400 font-bold" :
//                     "text-slate-600 dark:text-slate-400";

//                   return (
//                     <tr key={row.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
//                       <td className={`px-4 py-3 text-center text-[13px] font-mono ${rankColor}`}>
//                         {idx + 1}
//                       </td>
//                       <td className="px-4 py-3">
//                         <span className="text-[13px] font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
//                           {row.username}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 text-center">
//                         <button
//                           onClick={async () => {
//                             try {
//                               const res = await api.get(`/contests/${contestId}/results/${row.user_id}`);
//                               setPopupData(res.data);
//                               setPopupUser(row.username); // Showing username instead of raw ID for better UX
//                               setShowPopup(true);
//                             } catch {
//                               alert("Unable to load problem breakdown");
//                             }
//                           }}
//                           className="font-mono text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
//                           title="View submissions breakdown"
//                         >
//                           {row.solved_count}
//                         </button>
//                       </td>
//                       <td className="px-4 py-3 text-right font-mono text-[12px] text-slate-500 dark:text-slate-400">
//                         {row.penalty}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>

//         {/* --- FOOTER CTA --- */}
//         <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-center">
//           <button
//             onClick={() => window.history.back()}
//             className="px-6 py-2 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
//           >
//             ← Back to Contests
//           </button>
//         </div>

//         {/* --- USER BREAKDOWN MODAL --- */}
//         {showPopup && (
//           <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
//             <div className="bg-white dark:bg-slate-900 w-full max-w-[500px] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              
//               {/* Modal Header */}
//               <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30">
//                 <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
//                   Results for <span className="font-mono text-blue-600 dark:text-blue-400">{popupUser}</span>
//                 </h3>
//                 <button 
//                   onClick={() => setShowPopup(false)}
//                   className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
//                 </button>
//               </div>

//               {/* Modal Body / Table */}
//               <div className="max-h-[60vh] overflow-y-auto">
//                 <table className="w-full text-left border-collapse">
//                   <thead>
//                     <tr>
//                       <th className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0">Problem</th>
//                       <th className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 text-center">Status</th>
//                       <th className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 text-right">Time</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
//                     {popupData.map((p) => (
//                       <tr key={p.problem_index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
//                         <td className="px-5 py-3">
//                           <div className="flex items-center gap-2">
//                             <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{p.problem_index}</span>
//                             <span className="text-[12px] text-slate-600 dark:text-slate-400 line-clamp-1">{p.title}</span>
//                           </div>
//                         </td>
//                         <td className="px-5 py-3 text-center">
//                           {p.solved ? (
//                             <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-500/20">
//                               Accepted
//                             </div>
//                           ) : p.wrong_attempts > 0 ? (
//                             <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-200 dark:border-rose-500/20">
//                               -{p.wrong_attempts}
//                             </div>
//                           ) : (
//                             <span className="text-slate-300 dark:text-slate-700 font-mono">—</span>
//                           )}
//                         </td>
//                         <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
//                           {p.solved ? `${p.first_ac_time_minutes}m` : "—"}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ContestResults() {
  const { contestId } = useParams();
  const navigate = useNavigate();
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
        <div className="border-b border-[#b9b9b9] dark:border-[#444] pb-2 flex justify-between items-end">
          <div>
            <h2 className="text-[18px] font-bold text-[#3b5998] dark:text-[#8ab4f8]">
              Final Standings - Contest #{contestId}
            </h2>
            <div className="text-[12px] text-[#888] dark:text-[#aaa] mt-1">
              The contest has concluded.
            </div>
          </div>
          <button 
            onClick={() => navigate('/contests')}
            className="text-[12px] text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] font-bold"
          >
            &laquo; Back to Contests
          </button>
        </div>

        {/* --- PROBLEM SUMMARY --- */}
        <div>
          <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Problem Set</h2>
          <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden">
            <table className="w-full text-center border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[40px]">#</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left">Name</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, i) => (
                  <tr key={p.problem_id} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
                    <td className="border border-[#e1e1e1] dark:border-[#444] p-2 font-bold">
                      {p.problem_index}
                    </td>
                    <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
                      {p.title}
                    </td>
                    <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                      <span className={`text-[11px] px-1.5 py-0.5 border ${
                        p.difficulty === "hard" ? "text-[#ff0000] dark:text-[#ff6666] border-[#ff0000] dark:border-[#ff6666]" :
                        p.difficulty === "medium" ? "text-[#ff8c00] dark:text-[#ffcc88] border-[#ff8c00] dark:border-[#ffcc88]" :
                        "text-[#008000] dark:text-[#00cc00] border-[#008000] dark:border-[#00cc00]"
                      }`}>
                        {p.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
                {problems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">
                      No problems found for this contest.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- LEADERBOARD --- */}
        <div>
          <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Standings</h2>
          <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden overflow-x-auto">
            <table className="w-full text-center border-collapse text-[12px] min-w-[500px]">
              <thead>
                <tr>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[40px]">#</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left">Who</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[60px]">=</th>
                  <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] w-[80px]">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="border border-[#e1e1e1] dark:border-[#444] p-6 text-[#888] dark:text-[#aaa]">
                      No participants recorded.
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
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.get(`/contests/${contestId}/results/${row.user_id}`);
                                setPopupData(res.data);
                                setPopupUser(row.username);
                                setShowPopup(true);
                              } catch {
                                alert("Unable to load problem breakdown");
                              }
                            }}
                            className="font-bold text-[#00a900] dark:text-[#00cc00] hover:underline cursor-pointer"
                            title="View submissions breakdown"
                          >
                            {row.solved_count}
                          </button>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-[#888] dark:text-[#aaa]">
                          {row.penalty}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- USER BREAKDOWN MODAL --- */}
        {showPopup && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-[500px] border border-[#b9b9b9] dark:border-[#444] rounded-[3px] shadow-[0_0_10px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[8px_10px] flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-[#3b5998] dark:text-[#8ab4f8]">
                  Results for {popupUser}
                </h3>
                <button 
                  onClick={() => setShowPopup(false)}
                  className="text-[#888] dark:text-[#aaa] hover:text-[#222] dark:hover:text-[#fff] text-[16px] font-bold leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Modal Body / Table */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                <table className="w-full text-center border-collapse text-[12px]">
                  <thead>
                    <tr>
                      <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#f8f8f8] dark:bg-[#252526] p-2 font-bold text-[#888] dark:text-[#aaa]">Problem</th>
                      <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#f8f8f8] dark:bg-[#252526] p-2 font-bold text-[#888] dark:text-[#aaa]">Status</th>
                      <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#f8f8f8] dark:bg-[#252526] p-2 font-bold text-[#888] dark:text-[#aaa]">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popupData.map((p, i) => (
                      <tr key={p.problem_index} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                          <span className="font-bold text-[#1874cd] dark:text-[#5ea2f0] mr-2">{p.problem_index}</span>
                          <span className="text-[#222] dark:text-[#d4d4d4]">{p.title}</span>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 font-bold">
                          {p.solved ? (
                            <span className="text-[#00a900] dark:text-[#00cc00]">
                              +{p.wrong_attempts > 0 ? p.wrong_attempts : ""}
                            </span>
                          ) : p.wrong_attempts > 0 ? (
                            <span className="text-[#ff0000] dark:text-[#ff6666]">
                              -{p.wrong_attempts}
                            </span>
                          ) : (
                            <span className="text-[#888] dark:text-[#666]">—</span>
                          )}
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-[#888] dark:text-[#aaa]">
                          {p.solved ? `${p.first_ac_time_minutes}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
