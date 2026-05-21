import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Helper to patch raw Postgres timestamps and force strict IST formatting
const formatIST = (dateStr, isDateOnly = false) => {
  if (!dateStr) return "---";
  let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
  if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) {
    d += "Z";
  }
  const opts = { timeZone: "Asia/Kolkata" };
  return isDateOnly 
    ? new Date(d).toLocaleDateString("en-US", opts) 
    : new Date(d).toLocaleString("en-US", opts);
};

const getUnixTime = (dateStr) => {
  if (!dateStr) return 0;
  let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
  if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) {
    d += "Z";
  }
  return new Date(d).getTime();
};

const formatDuration = (mins) => {
  if (!mins) return "---";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; 
};

const CountdownTimer = ({ targetDateStr, format = "full", onComplete }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const hasTriggered = useRef(false);

  useEffect(() => {
    const target = getUnixTime(targetDateStr);
    
    const tick = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(format === "days" ? "00:00:00:00" : "00:00:00");
        
        // Background refresh trigger!
        if (!hasTriggered.current && onComplete) {
          hasTriggered.current = true;
          onComplete(); 
        }
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      if (format === "days" && h >= 24) {
        const d = Math.floor(h / 24);
        const remainingHours = h % 24;
        setTimeLeft(`${String(d).padStart(2, "0")}:${String(remainingHours).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      } else {
        setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr, format, onComplete]);

  return <span>{timeLeft}</span>;
};
// Codeforces Authentic Rating Graph Component
const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#888] text-[10px]">
        No rated contests
      </div>
    );
  }

  const w = 240;
  const h = 120;
  
  // Dynamically calculate view boundaries based on user rating history
  const minVal = Math.min(1000, ...history.map(x => x.rating_after)) - 100;
  const maxVal = Math.max(2000, ...history.map(x => x.rating_after)) + 100;
  const yRange = maxVal - minVal;

  const getY = (val) => h - ((val - minVal) / yRange) * h;
  const getX = (idx) => history.length === 1 ? w / 2 : (idx / (history.length - 1)) * w;

  // Codeforces Rank Color Bands
  const CF_BANDS = [
    { min: 0, max: 1199, color: "#cccccc" }, // Gray (Newbie)
    { min: 1200, max: 1399, color: "#77ff77" }, // Green (Pupil)
    { min: 1400, max: 1599, color: "#77ddbb" }, // Cyan (Specialist)
    { min: 1600, max: 1899, color: "#aaaaff" }, // Blue (Expert)
    { min: 1900, max: 2099, color: "#ff88ff" }, // Violet (Candidate Master)
    { min: 2100, max: 2399, color: "#ffcc88" }, // Orange (Master)
    { min: 2400, max: 4000, color: "#ffbbbb" }, // Red (Grandmaster)
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full block cursor-crosshair">
      {/* Draw Background Bands */}
      {CF_BANDS.map((band, i) => {
        const topY = getY(band.max);
        const bottomY = getY(band.min);
        const y = Math.max(0, topY);
        const bandHeight = Math.min(h, bottomY) - y;
        if (bandHeight <= 0 || y >= h) return null;
        return <rect key={i} x="0" y={y} width={w} height={bandHeight} fill={band.color} opacity="0.6" />;
      })}

      {/* Draw Horizontal Grid Lines at Rank Boundaries */}
      {[1200, 1400, 1600, 1900, 2100, 2400].map((val) => {
        const y = getY(val);
        if (y < 0 || y > h) return null;
        return <line key={val} x1="0" y1={y} x2={w} y2={y} stroke="#ffffff" strokeWidth="1" opacity="0.5" />;
      })}

      {/* Draw the Golden Trend Line */}
      <path
        d={history.length === 1 ? `M0,${getY(history[0].rating_after)} L${w},${getY(history[0].rating_after)}` : `M${history.map((hData, i) => `${getX(i)},${getY(hData.rating_after)}`).join(" L")}`}
        fill="none"
        stroke="#ffcc00"
        strokeWidth="2.5"
      />

      {/* Draw the Data Points with Hover Tooltips */}
      {history.map((entry, idx) => (
        <circle key={idx} cx={getX(idx)} cy={getY(entry.rating_after)} r="3.5" fill="#ffffff" stroke="#ffcc00" strokeWidth="1.5">
          <title>{`Rating: ${entry.rating_after} (${entry.rating_change > 0 ? '+' : ''}${entry.rating_change})\nRank: ${entry.final_rank}`}</title>
        </circle>
      ))}
    </svg>
  );
};

// export default function Contests() {
//   const { user, loading: authLoading } = useAuth();
//   const navigate = useNavigate();

//   const [stats, setStats] = useState(null);
//   const [history, setHistory] = useState([]);

//   const [upcoming, setUpcoming] = useState([]);
//   const [running, setRunning] = useState([]);
//   const [past, setPast] = useState([]);

//   const [registered, setRegistered] = useState({});
//   const [loading, setLoading] = useState(true);

//   const [form, setForm] = useState({
//     name: "",
//     start_time: "",
//     end_time: "",
//     duration_minutes: "",
//     problems: "",
//   });

//   // Codeforces color mapped ranks with adapted dark mode variants
//   const getRatingColor = (rating) => {
//     if (!rating || rating < 1200) return "text-[#808080] dark:text-[#a0a0a0]"; // Gray
//     if (rating >= 1200 && rating <= 1399) return "text-[#008000] dark:text-[#00cc00]"; // Green
//     if (rating >= 1400 && rating <= 1599) return "text-[#03a89e] dark:text-[#00cccc]"; // Cyan
//     if (rating >= 1600 && rating <= 1899) return "text-[#0000ff] dark:text-[#aaaaff]"; // Blue
//     if (rating >= 1900 && rating <= 2099) return "text-[#aa00aa] dark:text-[#ff88ff]"; // Violet
//     if (rating >= 2100 && rating <= 2399) return "text-[#ff8c00] dark:text-[#ffcc88]"; // Orange
//     return "text-[#ff0000] dark:text-[#ff6666]"; // Red
//   };

//   const getMilitaryRank = (rating) => {
//     if (!rating || rating < 1200) return "Newbie";
//     if (rating >= 1200 && rating <= 1399) return "Pupil";
//     if (rating >= 1400 && rating <= 1599) return "Specialist";
//     if (rating >= 1600 && rating <= 1899) return "Expert";
//     if (rating >= 1900 && rating <= 2099) return "Candidate Master";
//     if (rating >= 2100 && rating <= 2399) return "Master";
//     return "Grandmaster";
//   };

//   async function loadArenaData() {
//     setLoading(true);
//     try {
//       const [u, r, p, userStats, userHistory] = await Promise.all([
//         api.get("/contests?status=upcoming"),
//         api.get("/contests?status=running"),
//         api.get("/contests?status=past"),
//         api.get(`/users/${user.id}/contest-stats`),
//         api.get(`/users/${user.id}/contest-rating-history`),
//       ]);

//       setUpcoming(u.data);
//       setRunning(r.data);
//       setPast(p.data.slice(-15));
//       setStats(userStats.data);
//       setHistory(userHistory.data.history);

//       const allActive = [...u.data, ...r.data];
//       const status = {};
//       for (const c of allActive) {
//         const res = await api.get(`/contests/${c.id}/registration-status`);
//         status[c.id] = res.data.registered;
//       }
//       setRegistered(status);
//     } catch (err) {
//       console.error("Arena Data Sync Failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (!authLoading && user) {
//       loadArenaData();
//     }
//   }, [authLoading, user]);

//   useEffect(() => {
//     if (!authLoading && !user) {
//       navigate("/auth");
//     }
//   }, [authLoading, user, navigate]);

//   async function loadContests() {
//     setLoading(true);
//     const [u, r, p] = await Promise.all([
//       api.get("/contests?status=upcoming"),
//       api.get("/contests?status=running"),
//       api.get("/contests?status=past"),
//     ]);
//     setUpcoming(u.data);
//     setRunning(r.data);
//     setPast(p.data.slice(-15));

//     const all = [...u.data, ...r.data];
//     const status = {};
//     for (const c of all) {
//       const res = await api.get(`/contests/${c.id}/registration-status`);
//       status[c.id] = res.data.registered;
//     }
//     setRegistered(status);
//     setLoading(false);
//   }

//   async function register(contestId) {
//     try {
//       await api.post(`/contests/${contestId}/register`);
//       alert("Registration successful.");
//       loadContests();
//     } catch (e) {
//       alert("Failed to register.");
//     }
//   }

//   async function unregister(contestId) {
//     if (!window.confirm("Are you sure you want to cancel your registration?")) return;
//     try {
//       await api.post(`/contests/${contestId}/unregister`);
//       alert("Registration cancelled.");
//       loadContests();
//     } catch (e) {
//       alert("Failed to unregister.");
//     }
//   }

//   async function createContest(e) {
//     e.preventDefault();
//     await api.post("/contests", {
//       name: form.name,
//       start_time: form.start_time ? new Date(form.start_time).toISOString() : "",
//       end_time: form.end_time ? new Date(form.end_time).toISOString() : "",
//       duration_minutes: Number(form.duration_minutes),
//       problems: form.problems.split(",").map((x) => Number(x.trim())),
//     });
//     alert("Contest created");
//     setForm({ name: "", start_time: "", end_time: "", duration_minutes: "", problems: "" });
//     loadContests();
//   }

//   if (authLoading || loading) {
//     return (
//       <div className="min-h-screen bg-[#e4e4e4] dark:bg-[#121212] flex items-center justify-center font-['verdana','arial','sans-serif'] text-[13px]">
//         <div className="text-[#3b5998] dark:text-[#8ab4f8] font-bold">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen w-full bg-[#e4e4e4] dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] font-['verdana','arial','sans-serif']">
//       {/* Codeforces Centered Container */}
//       <div className="max-w-[1050px] mx-auto bg-white dark:bg-[#1e1e1e] min-h-screen border-l border-r border-[#ccc] dark:border-[#333] p-4 flex gap-6">
        
//         {/* --- MAIN CONTENT COLUMN (LEFT) --- */}
//         <div className="flex-1">
          
//           <div className="mb-6">
//             <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Current or upcoming contests</h2>
//             <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden">
//               <table className="w-full text-center border-collapse text-[12px]">
//                 <thead>
//                   <tr>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left">Name</th>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Start</th>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Length</th>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Before start</th>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]"></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {[...running, ...upcoming].length === 0 ? (
//                     <tr>
//                       <td colSpan="5" className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">No contests found.</td>
//                     </tr>
//                   ) : (
//                     [...running, ...upcoming].map((c, i) => {
//                       const isRunning = running.find(r => r.id === c.id);
//                       return (
//                         <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
//                           <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
//                             <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" onClick={() => navigate(isRunning ? `/contests/${c.id}/problems` : '#')}>
//                               {c.name}
//                             </span>
//                             <div className="text-[10px] text-[#888] dark:text-[#aaa] mt-1">Participants: {c.participants || 0}</div>
//                           </td>
//                           <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
//                             <a href="#" className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8]">{formatIST(c.start_time)}</a>
//                           </td>
//                           <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">{formatDuration(c.duration_minutes)}</td>
//                           <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
//                             {isRunning ? (
//                               <span className="text-black dark:text-white font-bold"><CountdownTimer targetDateStr={c.end_time} format="full" /></span>
//                             ) : (
//                               <span className="text-black dark:text-white"><CountdownTimer targetDateStr={c.start_time} format="days" /></span>
//                             )}
//                           </td>
//                           <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap text-[11px]">
//                             {isRunning ? (
//                               registered[c.id] ? (
//                                 <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer font-bold" onClick={() => navigate(`/contests/${c.id}/problems`)}>Enter &raquo;</span>
//                               ) : (
//                                 <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" onClick={() => register(c.id)}>Register &raquo;</span>
//                               )
//                             ) : (
//                               registered[c.id] ? (
//                                 <div>
//                                   <span className="text-[#00a900] dark:text-[#00cc00] font-bold">Registered</span>
//                                   <div className="mt-1">
//                                     <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer underline" onClick={() => unregister(c.id)}>Cancel</span>
//                                   </div>
//                                 </div>
//                               ) : (
//                                 <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer font-bold" onClick={() => register(c.id)}>Register &raquo;</span>
//                               )
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <div>
//             <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Past contests</h2>
//             <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden">
//               <table className="w-full text-center border-collapse text-[12px]">
//                 <thead>
//                   <tr>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left">Name</th>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Start</th>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Length</th>
//                     <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Participants</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {past.length === 0 ? (
//                     <tr>
//                       <td colSpan="4" className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">No history found.</td>
//                     </tr>
//                   ) : (
//                     past.map((c, i) => (
//                       <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
//                         <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
//                           <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" onClick={() => navigate(`/contests/${c.id}`)}>
//                             {c.name}
//                           </span>
//                         </td>
//                         <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
//                           <a href="#" className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8]">{formatIST(c.start_time)}</a>
//                         </td>
//                         <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">{formatDuration(c.duration_minutes)}</td>
//                         <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
//                           <span className="text-[#1874cd] dark:text-[#5ea2f0] flex items-center justify-center gap-1">
//                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
//                             {c.participants || 0}
//                           </span>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* --- SIDEBAR COLUMN (RIGHT) --- */}
//         <div className="w-[270px] shrink-0 flex flex-col gap-4">
          
//           {/* User Profile Box */}
//           <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
//             <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
//               &rarr; User profile
//             </div>
//             <div className="p-3 text-[12px]">
//               <div className="font-bold mb-1">
//                 <span className={getRatingColor(stats?.contest_rating)}>{user.username}</span>
//               </div>
//               <div className="mb-2">
//                 Rank: <span className={getRatingColor(stats?.contest_rating)}>{stats?.is_banned ? "Banned" : getMilitaryRank(stats?.contest_rating)}</span>
//               </div>
//               <div className="mb-2">
//                 Contest rating: <span className={`font-bold ${getRatingColor(stats?.contest_rating)}`}>{stats?.contest_rating || 0}</span>
//               </div>
              
//               {/* Authentic Codeforces Style Rating Graph */}
//               <div className="mt-4 w-full h-[120px] border border-[#ccc] dark:border-[#444] bg-white dark:bg-[#1e1e1e] relative overflow-hidden">
//                 <RatingGraph history={history} />
//               </div>
//             </div>
//           </div>

//           {/* Admin / Create Contest Box */}
//           <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
//             <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
//               &rarr; Create contest (Admin)
//             </div>
//             <div className="p-3 text-[12px]">
//               <form onSubmit={createContest} className="flex flex-col gap-2">
//                 <div>
//                   <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Name</label>
//                   <input required className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
//                 </div>
//                 <div>
//                   <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Start Time</label>
//                   <input required type="datetime-local" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
//                 </div>
//                 <div>
//                   <label className="block text-[#888] dark:text-[#aaa] mb-0.5">End Time</label>
//                   <input required type="datetime-local" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
//                 </div>
//                 <div>
//                   <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Duration (min)</label>
//                   <input required type="number" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} />
//                 </div>
//                 <div>
//                   <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Problem IDs (comma separated)</label>
//                   <input required className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.problems} onChange={e => setForm({...form, problems: e.target.value})} />
//                 </div>
//                 <button type="submit" className="mt-2 bg-[#e1e1e1] dark:bg-[#333] border border-[#ccc] dark:border-[#555] text-[#222] dark:text-[#d4d4d4] font-bold py-1 px-3 cursor-pointer hover:bg-[#d1d1d1] dark:hover:bg-[#444]">
//                   Create
//                 </button>
//               </form>
//             </div>
//           </div>

//           {/* Rules Box */}
//           <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
//             <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
//               &rarr; Rules
//             </div>
//             <div className="p-3 text-[11px] leading-relaxed">
//               <ul className="list-disc pl-4 flex flex-col gap-1.5">
//                 <li>Ranking is based on solved count. Ties are broken by total time penalty (10 mins per failed attempt).</li>
//                 <li>Cheating results in a permanent ban.</li>
//                 <li>Maintain silence regarding solutions until the timer ends.</li>
//               </ul>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }
export default function Contests() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [running, setRunning] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    start_time: "",
    end_time: "",
    duration_minutes: "",
    problems: "",
  });

  const getRatingColor = (rating) => {
    if (!rating || rating < 1200) return "text-[#808080] dark:text-[#a0a0a0]"; 
    if (rating >= 1200 && rating <= 1399) return "text-[#008000] dark:text-[#00cc00]"; 
    if (rating >= 1400 && rating <= 1599) return "text-[#03a89e] dark:text-[#00cccc]"; 
    if (rating >= 1600 && rating <= 1899) return "text-[#0000ff] dark:text-[#aaaaff]"; 
    if (rating >= 1900 && rating <= 2099) return "text-[#aa00aa] dark:text-[#ff88ff]"; 
    if (rating >= 2100 && rating <= 2399) return "text-[#ff8c00] dark:text-[#ffcc88]"; 
    return "text-[#ff0000] dark:text-[#ff6666]"; 
  };

  const getMilitaryRank = (rating) => {
    if (!rating || rating < 1200) return "Newbie";
    if (rating >= 1200 && rating <= 1399) return "Pupil";
    if (rating >= 1400 && rating <= 1599) return "Specialist";
    if (rating >= 1600 && rating <= 1899) return "Expert";
    if (rating >= 1900 && rating <= 2099) return "Candidate Master";
    if (rating >= 2100 && rating <= 2399) return "Master";
    return "Grandmaster";
  };

  async function loadArenaData(silent = true) {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/arena-dashboard');
      const data = res.data;
      
      setUpcoming(data.upcoming);
      setRunning(data.running);
      setPast(data.past);
      setStats(data.stats);
      setHistory(data.history);
    } catch (err) {
      console.error("Arena Data Sync Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadArenaData(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  async function register(contestId) {
    try {
      await api.post(`/contests/${contestId}/register`);
      loadArenaData(); // Background UI update
    } catch (e) {
      alert("Failed to register.");
    }
  }

  async function unregister(contestId) {
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    try {
      await api.post(`/contests/${contestId}/unregister`);
      loadArenaData(); // Background UI update
    } catch (e) {
      alert("Failed to unregister.");
    }
  }

  async function createContest(e) {
    e.preventDefault();
    await api.post("/contests", {
      name: form.name,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : "",
      end_time: form.end_time ? new Date(form.end_time).toISOString() : "",
      duration_minutes: Number(form.duration_minutes),
      problems: form.problems.split(",").map((x) => Number(x.trim())),
    });
    setForm({ name: "", start_time: "", end_time: "", duration_minutes: "", problems: "" });
    loadArenaData();
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#e4e4e4] dark:bg-[#121212] flex items-center justify-center font-['verdana','arial','sans-serif'] text-[13px]">
        <div className="text-[#3b5998] dark:text-[#8ab4f8] font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#e4e4e4] dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] font-['verdana','arial','sans-serif']">
      <div className="max-w-[1050px] mx-auto bg-white dark:bg-[#1e1e1e] min-h-screen border-l border-r border-[#ccc] dark:border-[#333] p-4 flex gap-6">
        
        {/* --- MAIN CONTENT COLUMN --- */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* ONGOING CONTESTS */}
          <div>
            <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Ongoing contests</h2>
            <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden">
              <table className="w-full text-center border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left">Name</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Start</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Length</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Time Remaining</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]"></th>
                  </tr>
                </thead>
                <tbody>
                  {running.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">No ongoing contests.</td>
                    </tr>
                  ) : (
                    running.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
                          <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" onClick={() => navigate(`/contests/${c.id}/problems`)}>
                            {c.name}
                          </span>
                          <div className="text-[10px] text-[#888] dark:text-[#aaa] mt-1">Participants: {c.participants || 0}</div>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                          <a href="#" className="text-[#1874cd] dark:text-[#5ea2f0]">{formatIST(c.start_time)}</a>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">{formatDuration(c.duration_minutes)}</td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            <CountdownTimer targetDateStr={c.end_time} format="full" onComplete={loadArenaData} />
                          </span>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap text-[11px]">
                          {c.is_registered ? (
                            <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] cursor-pointer font-bold" onClick={() => navigate(`/contests/${c.id}/problems`)}>Enter &raquo;</span>
                          ) : (
                            <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] cursor-pointer" onClick={() => register(c.id)}>Register &raquo;</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* UPCOMING CONTESTS */}
          <div>
            <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Upcoming contests</h2>
            <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden">
              <table className="w-full text-center border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left">Name</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Start</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Length</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Before start</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]"></th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">No upcoming contests scheduled.</td>
                    </tr>
                  ) : (
                    upcoming.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
                          <span className="text-[#1874cd] dark:text-[#5ea2f0]">{c.name}</span>
                          <div className="text-[10px] text-[#888] dark:text-[#aaa] mt-1">Registered: {c.participants || 0}</div>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                          <a href="#" className="text-[#1874cd] dark:text-[#5ea2f0]">{formatIST(c.start_time)}</a>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">{formatDuration(c.duration_minutes)}</td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                          <span className="text-black dark:text-white">
                            <CountdownTimer targetDateStr={c.start_time} format="days" onComplete={loadArenaData} />
                          </span>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap text-[11px]">
                          {c.is_registered ? (
                            <div>
                              <span className="text-[#00a900] dark:text-[#00cc00] font-bold">Registered</span>
                              <div className="mt-1">
                                <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] cursor-pointer underline" onClick={() => unregister(c.id)}>Cancel</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] cursor-pointer font-bold" onClick={() => register(c.id)}>Register &raquo;</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAST CONTESTS */}
          <div>
            <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Past contests</h2>
            <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden">
              <table className="w-full text-center border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8] text-left">Name</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Start</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Length</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#3b5998] dark:text-[#8ab4f8]">Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {past.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">No history found.</td>
                    </tr>
                  ) : (
                    past.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
                          <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" onClick={() => navigate(`/contests/${c.id}`)}>
                            {c.name}
                          </span>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                          <a href="#" className="text-[#1874cd] dark:text-[#5ea2f0]">{formatIST(c.start_time)}</a>
                        </td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">{formatDuration(c.duration_minutes)}</td>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                          <span className="text-[#1874cd] dark:text-[#5ea2f0] flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                            {c.participants || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- SIDEBAR COLUMN --- */}
        <div className="w-[270px] shrink-0 flex flex-col gap-4">
          
          <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
            <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
              &rarr; User profile
            </div>
            <div className="p-3 text-[12px]">
              <div className="font-bold mb-1">
                <span className={getRatingColor(stats?.contest_rating)}>{user.username}</span>
              </div>
              <div className="mb-2">
                Rank: <span className={getRatingColor(stats?.contest_rating)}>{stats?.is_banned ? "Banned" : getMilitaryRank(stats?.contest_rating)}</span>
              </div>
              <div className="mb-2">
                Contest rating: <span className={`font-bold ${getRatingColor(stats?.contest_rating)}`}>{stats?.contest_rating || 0}</span>
              </div>
              <div className="mt-4 w-full h-[120px] border border-[#ccc] dark:border-[#444] bg-white dark:bg-[#1e1e1e] relative overflow-hidden">
                <RatingGraph history={history} />
              </div>
            </div>
          </div>

          <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
            <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
              &rarr; Create contest (Admin)
            </div>
            <div className="p-3 text-[12px]">
              <form onSubmit={createContest} className="flex flex-col gap-2">
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Name</label>
                  <input required className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Start Time</label>
                  <input required type="datetime-local" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">End Time</label>
                  <input required type="datetime-local" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Duration (min)</label>
                  <input required type="number" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Problem IDs (CSV)</label>
                  <input required className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none" value={form.problems} onChange={e => setForm({...form, problems: e.target.value})} />
                </div>
                <button type="submit" className="mt-2 bg-[#e1e1e1] dark:bg-[#333] border border-[#ccc] dark:border-[#555] text-[#222] dark:text-[#d4d4d4] font-bold py-1 px-3 cursor-pointer hover:bg-[#d1d1d1] dark:hover:bg-[#444]">
                  Create
                </button>
              </form>
            </div>
          </div>

          <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
            <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
              &rarr; Rules
            </div>
            <div className="p-3 text-[11px] leading-relaxed">
              <ul className="list-disc pl-4 flex flex-col gap-1.5">
                <li>Ranking is based on solved count. Ties broken by penalty (10m per failed attempt).</li>
                <li>Cheating results in a permanent ban.</li>
                <li>Maintain silence regarding solutions until the timer ends.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
