// import { useEffect, useState, useMemo } from "react";
// import { api } from "../api/client";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";

// // Helper to patch raw Postgres timestamps and force strict IST formatting
// const formatIST = (dateStr, isDateOnly = false) => {
//   if (!dateStr) return "---";
//   let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
//   // If Postgres strips the timezone, force it to be interpreted as UTC
//   if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) {
//     d += "Z";
//   }
//   const opts = { timeZone: "Asia/Kolkata" };
//   return isDateOnly 
//     ? new Date(d).toLocaleDateString("en-IN", opts) 
//     : new Date(d).toLocaleString("en-IN", opts);
// };

// // Helper to safely get absolute Unix time for our timers
// const getUnixTime = (dateStr) => {
//   if (!dateStr) return 0;
//   let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
//   if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) {
//     d += "Z";
//   }
//   return new Date(d).getTime();
// };

// const formatDuration = (mins) => {
//   if (!mins) return "---";
//   const h = Math.floor(mins / 60);
//   const m = mins % 60;
//   return `${h > 0 ? h + "h " : ""}${m}m`;
// };

// // Real-time Countdown Hook Component
// const CountdownTimer = ({ targetDateStr, format = "full" }) => {
//   const [timeLeft, setTimeLeft] = useState("");

//   useEffect(() => {
//     const target = getUnixTime(targetDateStr);
    
//     const tick = () => {
//       const now = Date.now();
//       const diff = target - now;

//       if (diff <= 0) {
//         setTimeLeft(format === "days" ? "0d 00h 00m 00s" : "00:00:00");
//         return;
//       }

//       const h = Math.floor(diff / (1000 * 60 * 60));
//       const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//       const s = Math.floor((diff % (1000 * 60)) / 1000);

//       if (format === "days" && h >= 24) {
//         const d = Math.floor(h / 24);
//         const remainingHours = h % 24;
        
//         // Zero-padding prevents layout jitter in tables
//         setTimeLeft(
//           `${d}d ${String(remainingHours).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
//         );
//       } else {
//         setTimeLeft(
//           `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
//         );
//       }
//     };

//     tick(); // Initial call
//     const interval = setInterval(tick, 1000);
//     return () => clearInterval(interval);
//   }, [targetDateStr, format]);

//   return <span className="font-mono text-[11px] font-semibold text-orange-600 dark:text-orange-400">{timeLeft}</span>;
// };

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

//   /* =========================
//       Auth redirect & logic
//   ========================= */
//   const altitudePath = useMemo(() => {
//     if (history.length === 0) return "M0,45 L120,45"; // Default flat line
//     if (history.length === 1) {
//       const y = 60 - ((history[0].rating_after / 3000) * 50 + 5);
//       return `M0,${y} L120,${y}`;
//     }

//     const widthPerPoint = 120 / (history.length - 1 || 1);
//     const points = history.map((entry, i) => {
//       const x = i * widthPerPoint;
//       const y = 60 - ((entry.rating_after / 3000) * 50 + 5);
//       return `${x},${y}`;
//     });

//     return `M${points.join(" L")}`;
//   }, [history]);

//     const getMilitaryRank = (rating) => {

//     if (!rating || rating < 1200) return "Trainee";
//     if (rating >= 1200 && rating <= 1399) return "Soldier";
//     if (rating >= 1400 && rating <= 1599) return "Lieutenant";
//     if (rating >= 1600 && rating <= 1799) return "Colonel";
//     if (rating >= 1800 && rating <= 1999) return "Brigadier";
//     if (rating >= 2000 && rating <= 2499) return "Major General";
//     return "Commander-in-Chief"; // 2500+
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
//       setPast(p.data.slice(-15)); // Expanded list for tabular view
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
//     await api.post(`/contests/${contestId}/register`);
//     alert("Registered successfully");
//     loadContests();
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
//       <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] flex items-center justify-center">
//         <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
//           Loading Arena Data...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 font-sans">
//       <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-12">
        
//         {/* --- PAGE HEADER --- */}
//         <div className="mb-8">
//           <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Contests</h1>
//           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//             Competitive programming rounds — register, compete, and track your rating.
//           </p>
//         </div>

//         {/* --- PROFILE STRIP --- */}
//         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 mb-8 flex flex-wrap items-center gap-6 shadow-sm">
//           <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl uppercase shadow-sm">
//             {user.username?.substring(0, 1)}
//           </div>
          
//           <div className="flex-1 min-w-[200px]">
//             <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
//               {user.username}
//             </h2>
//             <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-3">
//               {stats?.is_banned ? "BANNED" : getMilitaryRank(stats?.contest_rating)}
//             </p>
            
//             <div className="flex flex-wrap gap-x-6 gap-y-2">
//               <div className="flex flex-col gap-0.5">
//                 <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider">Rating</span>
//                 <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{stats?.contest_rating || 0}</span>
//               </div>
//               <div className="flex flex-col gap-0.5">
//                 <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider">Contests</span>
//                 <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{stats?.contests_solved || 0}</span>
//               </div>
//               <div className="flex flex-col gap-0.5">
//                 <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider">Acceptance</span>
//                 <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{stats?.contest_acceptance_rate || "0.0"}%</span>
//               </div>
//               <div className="flex flex-col gap-0.5">
//                 <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider">Global Rank</span>
//                 <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">#{stats?.contest_global_rank || "---"}</span>
//               </div>
//             </div>
//           </div>

//           <div className="w-[140px] h-[52px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded flex-shrink-0 relative overflow-hidden">
//             <svg viewBox="0 0 120 60" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
//               <defs>
//                 <linearGradient id="minigraph" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
//                   <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
//                 </linearGradient>
//               </defs>
//               <path d={`${altitudePath} L120,60 L0,60 Z`} fill="url(#minigraph)" />
//               <path d={altitudePath} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
//             </svg>
//           </div>
//         </div>

//         {/* --- ADMIN FORM --- */}
//         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 mb-10 shadow-sm">
//           <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/60">
//             <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Create Contest</h3>
//             <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider text-white bg-blue-600 rounded uppercase">Admin</span>
//           </div>
          
//           <form onSubmit={createContest} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="sm:col-span-2 flex flex-col gap-1.5">
//               <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Contest Name</label>
//               <input 
//                 required
//                 className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
//                 placeholder="e.g. Algorhythm Round #19 (Div. 2)"
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//               />
//             </div>
            
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Start Time</label>
//               <input 
//                 required
//                 type="datetime-local"
//                 className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
//                 value={form.start_time}
//                 onChange={(e) => setForm({ ...form, start_time: e.target.value })}
//               />
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">End Time</label>
//               <input 
//                 required
//                 type="datetime-local"
//                 className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
//                 value={form.end_time}
//                 onChange={(e) => setForm({ ...form, end_time: e.target.value })}
//               />
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Duration (minutes)</label>
//               <input 
//                 required
//                 type="number"
//                 className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
//                 placeholder="135"
//                 value={form.duration_minutes}
//                 onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
//               />
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Problem IDs (1,2,3)</label>
//               <input 
//                 required
//                 className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
//                 placeholder="e.g. 101, 102, 103"
//                 value={form.problems}
//                 onChange={(e) => setForm({ ...form, problems: e.target.value })}
//               />
//             </div>

//             <div className="sm:col-span-2 mt-2">
//               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded transition-colors">
//                 Initialize Deployment Sequence
//               </button>
//             </div>
//           </form>
//         </div>

//         {/* --- LIVE CONTESTS --- */}
//         <div className="mb-10">
//           <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
//             <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
//               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
//               Running Now
//             </h2>
//             <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
//               {running.length}
//             </span>
//           </div>

//           {running.length === 0 ? (
//             <div className="py-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500">
//               No active deployments detected.
//             </div>
//           ) : (
//             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-sm">
//               <table className="w-full text-left border-collapse min-w-[600px]">
//                 <thead>
//                   <tr>
//                     <th className="w-2/5 px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Contest</th>
//                     <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Started</th>
//                     <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Duration</th>
//                     <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Time Left</th>
//                     <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-right">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {running.map((c) => (
//                     <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
//                       <td className="px-4 py-3">
//                         <span className="block text-[13px] font-semibold text-slate-900 dark:text-white mb-0.5">{c.name}</span>
//                         <span className="text-[10px] font-mono text-slate-500">Active participants: {c.participants || 0}</span>
//                       </td>
//                       <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
//                         {formatIST(c.start_time)}
//                       </td>
//                       <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
//                         {formatDuration(c.duration_minutes)}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <CountdownTimer targetDateStr={c.end_time} format="full" />
//                       </td>
//                       <td className="px-4 py-3 text-right">
//                         {registered[c.id] ? (
//                           <button onClick={() => navigate(`/contests/${c.id}/problems`)} className="px-3 py-1.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors whitespace-nowrap">
//                             Enter
//                           </button>
//                         ) : (
//                           <button onClick={() => register(c.id)} disabled={stats?.is_banned} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-600 rounded transition-colors whitespace-nowrap disabled:opacity-50">
//                             Register
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* --- UPCOMING CONTESTS --- */}
//         <div className="mb-10">
//           <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
//             <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Upcoming</h2>
//             <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
//               {upcoming.length}
//             </span>
//           </div>

//           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-sm">
//             <table className="w-full text-left border-collapse min-w-[600px]">
//               <thead>
//                 <tr>
//                   <th className="w-2/5 px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Contest</th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Starts</th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Duration</th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Starts In</th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-right">Registration</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {upcoming.length === 0 && (
//                   <tr>
//                     <td colSpan="5" className="py-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900">
//                       No future operations scheduled.
//                     </td>
//                   </tr>
//                 )}
//                 {upcoming.map((c) => (
//                   <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
//                     <td className="px-4 py-3">
//                       <span className="block text-[13px] font-semibold text-slate-900 dark:text-white mb-0.5">{c.name}</span>
//                       <span className="text-[10px] font-mono text-slate-500">Pre-registrations: {c.participants || 0}</span>
//                     </td>
//                     <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
//                       {formatIST(c.start_time)}
//                     </td>
//                     <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
//                       {formatDuration(c.duration_minutes)}
//                     </td>
//                     <td className="px-4 py-3 whitespace-nowrap">
//                       <CountdownTimer targetDateStr={c.start_time} format="days" />
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       {registered[c.id] ? (
//                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded whitespace-nowrap">
//                           ✓ Registered
//                         </span>
//                       ) : (
//                         <button onClick={() => register(c.id)} className="px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 rounded transition-colors whitespace-nowrap shadow-sm">
//                           Register
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* --- PAST CONTESTS --- */}
//         <div className="mb-10">
//           <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
//             <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Past Contests</h2>
//             <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
//               {past.length} recent
//             </span>
//           </div>

//           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-sm">
//             <table className="w-full text-left border-collapse min-w-[500px]">
//               <thead>
//                 <tr>
//                   <th className="w-3/5 px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Contest</th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Date</th>
//                   <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-right">Participants</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {past.length === 0 && (
//                   <tr>
//                     <td colSpan="3" className="py-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900">
//                       No historical data available.
//                     </td>
//                   </tr>
//                 )}
//                 {past.map((c) => (
//                   <tr 
//                     key={c.id} 
//                     onClick={() => navigate(`/contests/${c.id}`)}
//                     className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
//                   >
//                     <td className="px-4 py-3">
//                       <span className="block text-[13px] font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{c.name}</span>
//                     </td>
//                     <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
//                       {formatIST(c.end_time, true)}
//                     </td>
//                     <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono text-right">
//                       {c.participants || 0} <span className="text-[10px] text-slate-400">👤</span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* --- ENGAGEMENT PROTOCOLS (RULES) --- */}
//         <div className="mb-16">
//           <div className="mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
//             <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Contest Rules</h2>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
//               <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
//               </div>
//               <h3 className="text-[11.5px] font-semibold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wide">Format</h3>
//               <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
//                 Each official operation consists of exactly <strong className="text-slate-900 dark:text-white font-semibold">4 algorithmic challenges</strong> of varying difficulty.
//               </p>
//             </div>

//             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
//               <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
//               </div>
//               <h3 className="text-[11.5px] font-semibold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wide">Penalty Logic</h3>
//               <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
//                 Ranking is based on solved count. Ties are settled by time penalty: <strong className="text-slate-900 dark:text-white font-semibold">10 mins</strong> added per failed submission.
//               </p>
//             </div>

//             <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 shadow-sm">
//               <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-3">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" /></svg>
//               </div>
//               <h3 className="text-[11.5px] font-semibold text-red-700 dark:text-red-400 mb-1.5 uppercase tracking-wide">No Cheating</h3>
//               <p className="text-[11px] text-red-600 dark:text-red-400/80 leading-relaxed">
//                 Any detected plagiarism will result in an <strong className="text-red-700 dark:text-red-400 font-semibold">immediate and permanent ban</strong> from the Arena.
//               </p>
//             </div>

//             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
//               <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-3">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
//               </div>
//               <h3 className="text-[11.5px] font-semibold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wide">Comms Blackout</h3>
//               <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
//                 Solution disclosure is prohibited until the mission timer reaches <strong className="text-slate-900 dark:text-white font-semibold">zero</strong>. Maintain total silence.
//               </p>
//             </div>
//           </div>
//         </div>

//         <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
//           <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//             Algorhythm Contest Engine v2.0
//           </p>
//         </footer>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState, useMemo } from "react";
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

// Codeforces style simple plain text timer
const CountdownTimer = ({ targetDateStr, format = "full" }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const target = getUnixTime(targetDateStr);
    
    const tick = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(format === "days" ? "00:00:00:00" : "00:00:00");
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
  }, [targetDateStr, format]);

  return <span>{timeLeft}</span>;
};

export default function Contests() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  const [upcoming, setUpcoming] = useState([]);
  const [running, setRunning] = useState([]);
  const [past, setPast] = useState([]);

  const [registered, setRegistered] = useState({});
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    start_time: "",
    end_time: "",
    duration_minutes: "",
    problems: "",
  });

  const altitudePath = useMemo(() => {
    if (history.length === 0) return "M0,45 L120,45";
    if (history.length === 1) {
      const y = 60 - ((history[0].rating_after / 3000) * 50 + 5);
      return `M0,${y} L120,${y}`;
    }
    const widthPerPoint = 120 / (history.length - 1 || 1);
    const points = history.map((entry, i) => {
      const x = i * widthPerPoint;
      const y = 60 - ((entry.rating_after / 3000) * 50 + 5);
      return `${x},${y}`;
    });
    return `M${points.join(" L")}`;
  }, [history]);

  // Codeforces color mapped ranks with adapted dark mode variants
  const getRatingColor = (rating) => {
    if (!rating || rating < 1200) return "text-[#808080] dark:text-[#a0a0a0]"; // Gray
    if (rating >= 1200 && rating <= 1399) return "text-[#008000] dark:text-[#00cc00]"; // Green
    if (rating >= 1400 && rating <= 1599) return "text-[#03a89e] dark:text-[#00cccc]"; // Cyan
    if (rating >= 1600 && rating <= 1899) return "text-[#0000ff] dark:text-[#aaaaff]"; // Blue
    if (rating >= 1900 && rating <= 2099) return "text-[#aa00aa] dark:text-[#ff88ff]"; // Violet
    if (rating >= 2100 && rating <= 2399) return "text-[#ff8c00] dark:text-[#ffcc88]"; // Orange
    return "text-[#ff0000] dark:text-[#ff6666]"; // Red
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

  async function loadArenaData() {
    setLoading(true);
    try {
      const [u, r, p, userStats, userHistory] = await Promise.all([
        api.get("/contests?status=upcoming"),
        api.get("/contests?status=running"),
        api.get("/contests?status=past"),
        api.get(`/users/${user.id}/contest-stats`),
        api.get(`/users/${user.id}/contest-rating-history`),
      ]);

      setUpcoming(u.data);
      setRunning(r.data);
      setPast(p.data.slice(-15));
      setStats(userStats.data);
      setHistory(userHistory.data.history);

      const allActive = [...u.data, ...r.data];
      const status = {};
      for (const c of allActive) {
        const res = await api.get(`/contests/${c.id}/registration-status`);
        status[c.id] = res.data.registered;
      }
      setRegistered(status);
    } catch (err) {
      console.error("Arena Data Sync Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadArenaData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  async function loadContests() {
    setLoading(true);
    const [u, r, p] = await Promise.all([
      api.get("/contests?status=upcoming"),
      api.get("/contests?status=running"),
      api.get("/contests?status=past"),
    ]);
    setUpcoming(u.data);
    setRunning(r.data);
    setPast(p.data.slice(-15));

    const all = [...u.data, ...r.data];
    const status = {};
    for (const c of all) {
      const res = await api.get(`/contests/${c.id}/registration-status`);
      status[c.id] = res.data.registered;
    }
    setRegistered(status);
    setLoading(false);
  }

  async function register(contestId) {
    try {
      await api.post(`/contests/${contestId}/register`);
      alert("Registration successful.");
      loadContests();
    } catch (e) {
      alert("Failed to register.");
    }
  }

  async function unregister(contestId) {
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    try {
      await api.post(`/contests/${contestId}/unregister`);
      alert("Registration cancelled.");
      loadContests();
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
    alert("Contest created");
    setForm({ name: "", start_time: "", end_time: "", duration_minutes: "", problems: "" });
    loadContests();
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
      {/* Codeforces Centered Container */}
      <div className="max-w-[1050px] mx-auto bg-white dark:bg-[#1e1e1e] min-h-screen border-l border-r border-[#ccc] dark:border-[#333] p-4 flex gap-6">
        
        {/* --- MAIN CONTENT COLUMN (LEFT) --- */}
        <div className="flex-1">
          
          <div className="mb-6">
            <h2 className="text-[16px] mb-2 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Current or upcoming contests</h2>
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
                  {[...running, ...upcoming].length === 0 ? (
                    <tr>
                      <td colSpan="5" className="border border-[#e1e1e1] dark:border-[#444] p-4 text-[#888] dark:text-[#aaa]">No contests found.</td>
                    </tr>
                  ) : (
                    [...running, ...upcoming].map((c, i) => {
                      const isRunning = running.find(r => r.id === c.id);
                      return (
                        <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-left">
                            <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" onClick={() => navigate(isRunning ? `/contests/${c.id}/problems` : '#')}>
                              {c.name}
                            </span>
                            <div className="text-[10px] text-[#888] dark:text-[#aaa] mt-1">Participants: {c.participants || 0}</div>
                          </td>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                            <a href="#" className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8]">{formatIST(c.start_time)}</a>
                          </td>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">{formatDuration(c.duration_minutes)}</td>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap">
                            {isRunning ? (
                              <span className="text-black dark:text-white font-bold"><CountdownTimer targetDateStr={c.end_time} format="full" /></span>
                            ) : (
                              <span className="text-black dark:text-white"><CountdownTimer targetDateStr={c.start_time} format="days" /></span>
                            )}
                          </td>
                          <td className="border border-[#e1e1e1] dark:border-[#444] p-2 whitespace-nowrap text-[11px]">
                            {isRunning ? (
                              registered[c.id] ? (
                                <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer font-bold" onClick={() => navigate(`/contests/${c.id}/problems`)}>Enter &raquo;</span>
                              ) : (
                                <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer" onClick={() => register(c.id)}>Register &raquo;</span>
                              )
                            ) : (
                              registered[c.id] ? (
                                <div>
                                  <span className="text-[#00a900] dark:text-[#00cc00] font-bold">Registered</span>
                                  <div className="mt-1">
                                    <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer underline" onClick={() => unregister(c.id)}>Cancel</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8] cursor-pointer font-bold" onClick={() => register(c.id)}>Register &raquo;</span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                          <a href="#" className="text-[#1874cd] dark:text-[#5ea2f0] hover:text-[#0000a0] dark:hover:text-[#8ab4f8]">{formatIST(c.start_time)}</a>
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

        {/* --- SIDEBAR COLUMN (RIGHT) --- */}
        <div className="w-[270px] shrink-0 flex flex-col gap-4">
          
          {/* User Profile Box */}
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
              
              {/* Mini Graph (adapted) */}
              <div className="mt-3 w-[120px] h-[60px] border border-[#ccc] dark:border-[#444] bg-white dark:bg-[#1e1e1e] relative">
                <svg viewBox="0 0 120 60" className="w-full h-full absolute inset-0">
                  <path d={altitudePath} fill="none" className="stroke-[#1874cd] dark:stroke-[#5ea2f0]" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Admin / Create Contest Box */}
          <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
            <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
              &rarr; Create contest (Admin)
            </div>
            <div className="p-3 text-[12px]">
              <form onSubmit={createContest} className="flex flex-col gap-2">
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Name</label>
                  <input required className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Start Time</label>
                  <input required type="datetime-local" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">End Time</label>
                  <input required type="datetime-local" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Duration (min)</label>
                  <input required type="number" className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[#888] dark:text-[#aaa] mb-0.5">Problem IDs (comma separated)</label>
                  <input required className="w-full border border-[#ccc] dark:border-[#555] bg-white dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] p-1 outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]" value={form.problems} onChange={e => setForm({...form, problems: e.target.value})} />
                </div>
                <button type="submit" className="mt-2 bg-[#e1e1e1] dark:bg-[#333] border border-[#ccc] dark:border-[#555] text-[#222] dark:text-[#d4d4d4] font-bold py-1 px-3 cursor-pointer hover:bg-[#d1d1d1] dark:hover:bg-[#444]">
                  Create
                </button>
              </form>
            </div>
          </div>

          {/* Rules Box */}
          <div className="border border-[#b9b9b9] dark:border-[#444] rounded-[3px] bg-[#f8f8f8] dark:bg-[#252526]">
            <div className="border-b border-[#b9b9b9] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-[5px_10px] font-bold text-[12px] text-[#3b5998] dark:text-[#8ab4f8]">
              &rarr; Rules
            </div>
            <div className="p-3 text-[11px] leading-relaxed">
              <ul className="list-disc pl-4 flex flex-col gap-1.5">
                <li>Ranking is based on solved count. Ties are broken by total time penalty (10 mins per failed attempt).</li>
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
