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

  return <span className="font-mono tabular-nums tracking-tight">{timeLeft}</span>;
};

// Remastered Codeforces Authentic Rating Graph
const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-medium">
        No rated contests
      </div>
    );
  }

  // Internal SVG coordinate system
  const svgWidth = 320;
  const svgHeight = 140;
  const paddingX = 16;
  const paddingY = 20;
  
  // Dynamically calculate view boundaries based on user rating history
  const minVal = Math.min(1000, ...history.map(x => x.rating_after)) - 50;
  const maxVal = Math.max(2000, ...history.map(x => x.rating_after)) + 50;
  const yRange = maxVal - minVal;

  const getY = (val) => svgHeight - paddingY - ((val - minVal) / yRange) * (svgHeight - 2 * paddingY);
  const getX = (idx) => history.length === 1 
    ? svgWidth / 2 
    : paddingX + (idx / (history.length - 1)) * (svgWidth - 2 * paddingX);

  // Modernized Rank Color Bands
  const CF_BANDS = [
    { min: 0, max: 1199, color: "#94a3b8" }, // Gray
    { min: 1200, max: 1399, color: "#4ade80" }, // Green
    { min: 1400, max: 1599, color: "#2dd4bf" }, // Cyan
    { min: 1600, max: 1899, color: "#818cf8" }, // Blue
    { min: 1900, max: 2099, color: "#d946ef" }, // Violet
    { min: 2100, max: 2399, color: "#fb923c" }, // Orange
    { min: 2400, max: 4000, color: "#f87171" }, // Red
  ];

  // Generate SVG Paths
  const linePath = history.length === 1 
    ? `M0,${getY(history[0].rating_after)} L${svgWidth},${getY(history[0].rating_after)}` 
    : `M${history.map((hData, i) => `${getX(i)},${getY(hData.rating_after)}`).join(" L")}`;

  const areaPath = history.length === 1
    ? `${linePath} L${svgWidth},${svgHeight} L0,${svgHeight} Z`
    : `${linePath} L${getX(history.length - 1)},${svgHeight} L${getX(0)},${svgHeight} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full block font-sans">
      <defs>
        {/* Subtle Area Gradient */}
        <linearGradient id="ratingArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eab308" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
        </linearGradient>
        {/* Glow effect for the trend line */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Draw Background Bands */}
      {CF_BANDS.map((band, i) => {
        const topY = Math.max(0, getY(band.max));
        const bottomY = Math.min(svgHeight, getY(band.min));
        if (bottomY <= 0 || topY >= svgHeight || bottomY - topY <= 0) return null;
        return (
          <rect key={i} x="0" y={topY} width={svgWidth} height={bottomY - topY} fill={band.color} opacity="0.08" className="dark:opacity-[0.12]" />
        );
      })}

      {/* Draw Horizontal Grid Lines & Y-Axis Labels */}
      {[1200, 1400, 1600, 1900, 2100, 2400].map((val) => {
        const y = getY(val);
        if (y < 8 || y > svgHeight - 8) return null;
        return (
          <g key={val}>
            <line x1="0" y1={y} x2={svgWidth} y2={y} stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-600" opacity="0.4" strokeDasharray="3 3" />
            <text x="4" y={y - 4} fontSize="8" fill="currentColor" className="text-slate-400 dark:text-slate-500 font-medium tracking-tight">
              {val}
            </text>
          </g>
        );
      })}

      {/* Area Under Line */}
      <path d={areaPath} fill="url(#ratingArea)" />

      {/* The Golden Trend Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#eab308"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Data Points with CSS Hover Effects */}
      {history.map((entry, idx) => (
        <circle 
          key={idx} 
          cx={getX(idx)} 
          cy={getY(entry.rating_after)} 
          r="3.5" 
          fill="var(--bg-point, #fff)" 
          stroke="#eab308" 
          strokeWidth="1.5" 
          className="dark:[--bg-point:#0f172a] hover:r-[5px] hover:stroke-2 hover:fill-[#eab308] transition-all duration-200 cursor-pointer"
        >
          <title>{`Rating: ${entry.rating_after} (${entry.rating_change > 0 ? '+' : ''}${entry.rating_change})\nRank: ${entry.final_rank}`}</title>
        </circle>
      ))}
    </svg>
  );
};


export default function Contests() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [running, setRunning] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  // Updated Form State
  const [form, setForm] = useState({
    name: "",
    start_time: "",
    end_time: "",
    problems: "",
    writers: "",
    token: "",
  });

  const getRatingColor = (rating) => {
    if (!rating || rating < 1200) return "text-slate-500 dark:text-slate-400"; 
    if (rating >= 1200 && rating <= 1399) return "text-green-600 dark:text-green-400"; 
    if (rating >= 1400 && rating <= 1599) return "text-teal-600 dark:text-teal-400"; 
    if (rating >= 1600 && rating <= 1899) return "text-blue-600 dark:text-blue-400"; 
    if (rating >= 1900 && rating <= 2099) return "text-fuchsia-600 dark:text-fuchsia-400"; 
    if (rating >= 2100 && rating <= 2399) return "text-orange-500 dark:text-orange-400"; 
    return "text-red-600 dark:text-red-500"; 
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
      loadArenaData(); 
    } catch (e) {
      alert("Failed to register.");
    }
  }

  async function unregister(contestId) {
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    try {
      await api.post(`/contests/${contestId}/unregister`);
      loadArenaData(); 
    } catch (e) {
      alert("Failed to unregister.");
    }
  }

  // Updated create contest handler
  async function createContest(e) {
    e.preventDefault();
    try {
      await api.post("/contests", {
        name: form.name,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : "",
        end_time: form.end_time ? new Date(form.end_time).toISOString() : "",
        problems: form.problems.split(",").map((x) => Number(x.trim())),
        writers: form.writers.split(",").map((x) => x.trim()),
        token: form.token, // Backend ignores this if role is 'owner'
      });
      setForm({ name: "", start_time: "", end_time: "", problems: "", writers: "", token: "" });
      loadArenaData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create contest");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans text-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading Arena...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/50">
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8">
        
        {/* --- MAIN CONTENT COLUMN --- */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* ONGOING CONTESTS */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-red-500 rounded-full animate-pulse"></span>
              Ongoing Contests
            </h2>
            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Name</th>
                      <th className="p-4">Start</th>
                      <th className="p-4 text-center">Length</th>
                      <th className="p-4 text-center">Time Remaining</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                    {running.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400 dark:text-slate-500">No ongoing contests at the moment.</td>
                      </tr>
                    ) : (
                      running.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="p-4">
                            <span 
                              className="font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 cursor-pointer" 
                              onClick={() => navigate(`/contests/${c.id}/problems`)}
                            >
                              {c.name}
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {c.participants || 0} Registered
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">
                            {formatIST(c.start_time)}
                          </td>
                          <td className="p-4 text-center font-medium text-slate-700 dark:text-slate-300">
                            {formatDuration(c.duration_minutes)}
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm border border-red-100 dark:border-red-900/30">
                              <CountdownTimer targetDateStr={c.end_time} format="full" onComplete={loadArenaData} />
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {c.is_registered ? (
                              <button 
                                onClick={() => navigate(`/contests/${c.id}/problems`)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                              >
                                Enter 
                              </button>
                            ) : (
                              <button 
                                onClick={() => register(c.id)}
                                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-md transition-colors border border-slate-200 dark:border-slate-700"
                              >
                                Register
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* UPCOMING CONTESTS */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
              Upcoming Contests
            </h2>
            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Name</th>
                      <th className="p-4">Start</th>
                      <th className="p-4 text-center">Length</th>
                      <th className="p-4 text-center">Before Start</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                    {upcoming.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400 dark:text-slate-500">No upcoming contests scheduled.</td>
                      </tr>
                    ) : (
                      upcoming.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {c.participants || 0} Registered
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">
                            {formatIST(c.start_time)}
                          </td>
                          <td className="p-4 text-center font-medium text-slate-700 dark:text-slate-300">
                            {formatDuration(c.duration_minutes)}
                          </td>
                          <td className="p-4 text-center text-slate-700 dark:text-slate-300">
                            <CountdownTimer targetDateStr={c.start_time} format="days" onComplete={loadArenaData} />
                          </td>
                          <td className="p-4 text-center">
                            {c.is_registered ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900/30">
                                  Registered
                                </span>
                                <button 
                                  onClick={() => unregister(c.id)}
                                  className="text-[11px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => register(c.id)}
                                className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-md transition-colors border border-blue-100 dark:border-blue-800/30"
                              >
                                Register
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* PAST CONTESTS */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
              Past Contests
            </h2>
            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Name</th>
                      <th className="p-4">Start</th>
                      <th className="p-4 text-center">Length</th>
                      <th className="p-4 text-center">Participants</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                    {past.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-400 dark:text-slate-500">No history found.</td>
                      </tr>
                    ) : (
                      past.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="p-4">
                            <span 
                              className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer transition-colors" 
                              onClick={() => navigate(`/contests/${c.id}`)}
                            >
                              {c.name}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            {formatIST(c.start_time)}
                          </td>
                          <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                            {formatDuration(c.duration_minutes)}
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                              {c.participants || 0}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* --- SIDEBAR COLUMN --- */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* USER PROFILE CARD */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                My Rating
              </h3>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-1 mb-4">
                <div className={`text-xl font-bold tracking-tight ${getRatingColor(stats?.contest_rating)}`}>
                  {user.username}
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-500 dark:text-slate-400">Rank:</span>
                  <span className={`font-semibold ${getRatingColor(stats?.contest_rating)}`}>
                    {stats?.is_banned ? "Banned" : getMilitaryRank(stats?.contest_rating)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Rating:</span>
                  <span className={`font-bold ${getRatingColor(stats?.contest_rating)}`}>
                    {stats?.contest_rating || 0}
                  </span>
                </div>
              </div>
              
              <div className="w-full h-[140px] rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 overflow-hidden relative shadow-inner">
                <RatingGraph history={history} />
              </div>
            </div>
          </div>

          {/* ADMIN & MODERATOR: CREATE CONTEST */}
          {user && (user.role === "owner" || user.role === "moderator") && (
            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Admin Workspace
                </h3>
              </div>
              <div className="p-5">
                <form onSubmit={createContest} className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Contest Name</label>
                    <input required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Div. 2 Round 1" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
                    <input required type="datetime-local" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Time</label>
                    <input required type="datetime-local" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1/2">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Writers (CSV)</label>
                      <input required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" value={form.writers} onChange={e => setForm({...form, writers: e.target.value})} placeholder="user1, user2" />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Problems (CSV)</label>
                      <input required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" value={form.problems} onChange={e => setForm({...form, problems: e.target.value})} placeholder="1, 4, 7" />
                    </div>
                  </div>
                  
                  {/* Token Field only for Moderators */}
                  {user.role === "moderator" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Creation Token</label>
                      <input required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" value={form.token} onChange={e => setForm({...form, token: e.target.value})} placeholder="EXAMPLE_TOKEN_76" />
                    </div>
                  )}

                  <button type="submit" className="mt-2 w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm shadow-sm flex justify-center items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Deploy Contest
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* RULES BOX */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/30 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-blue-100 dark:border-blue-800/30 bg-blue-100/50 dark:bg-blue-900/20">
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Arena Rules
              </h3>
            </div>
            <div className="p-5 text-xs leading-relaxed text-blue-800/80 dark:text-blue-200/70">
              <ul className="list-disc pl-4 flex flex-col gap-2">
                <li><strong className="font-semibold text-blue-900 dark:text-blue-200">Ranking</strong> is based on solved count. Ties broken by penalty (10m per failed attempt).</li>
                <li><strong className="font-semibold text-blue-900 dark:text-blue-200">Cheating</strong> results in a permanent platform ban. Zero tolerance.</li>
                <li><strong className="font-semibold text-blue-900 dark:text-blue-200">Silence:</strong> Do not discuss solutions publicly until the timer ends.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}