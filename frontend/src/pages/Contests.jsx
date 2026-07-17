import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Swords, 
  Clock, 
  History, 
  Trophy, 
  ShieldAlert, 
  TerminalSquare, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  Users
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────

const formatIST = (dateStr, isDateOnly = false) => {
  if (!dateStr) return "---";
  let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
  if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) d += "Z";
  const opts = { timeZone: "Asia/Kolkata" };
  return isDateOnly
    ? new Date(d).toLocaleDateString("en-US", opts)
    : new Date(d).toLocaleString("en-US", opts);
};

const getUnixTime = (dateStr) => {
  if (!dateStr) return 0;
  let d = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
  if (typeof d === "string" && !d.includes("Z") && !d.includes("+") && d.length <= 23) d += "Z";
  return new Date(d).getTime();
};

const formatDuration = (mins) => {
  if (!mins) return "---";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
};

// ─── Countdown Timer ───────────────────────────────────────

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
        if (!hasTriggered.current && onComplete) { hasTriggered.current = true; onComplete(); }
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      if (format === "days" && h >= 24) {
        const d = Math.floor(h / 24);
        const rh = h % 24;
        setTimeLeft(`${String(d).padStart(2,"0")}d ${String(rh).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
      } else {
        setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr, format, onComplete]);

  // Kept mono specifically for the ticking timer to prevent jumping text widths
  return <span className="font-mono tracking-widest">{timeLeft}</span>;
};

// ─── Rating Graph ───────────────────────────────────────────

const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex flex-col gap-2 items-center justify-center text-slate-500 dark:text-slate-400 text-[12px] font-sans font-semibold tracking-wide">
        <TerminalSquare size={16} className="opacity-50" />
        No Rated Contests
      </div>
    );
  }
  const svgWidth = 320, svgHeight = 130, paddingX = 14, paddingY = 18;
  const minVal = Math.min(1000, ...history.map(x => x.rating_after)) - 50;
  const maxVal = Math.max(2000, ...history.map(x => x.rating_after)) + 50;
  const yRange = maxVal - minVal;
  const getY = (val) => svgHeight - paddingY - ((val - minVal) / yRange) * (svgHeight - 2 * paddingY);
  const getX = (idx) => history.length === 1 ? svgWidth / 2 : paddingX + (idx / (history.length - 1)) * (svgWidth - 2 * paddingX);

  const linePath = history.length === 1
    ? `M0,${getY(history[0].rating_after)} L${svgWidth},${getY(history[0].rating_after)}`
    : `M${history.map((h, i) => `${getX(i)},${getY(h.rating_after)}`).join(" L")}`;
  const areaPath = history.length === 1
    ? `${linePath} L${svgWidth},${svgHeight} L0,${svgHeight} Z`
    : `${linePath} L${getX(history.length - 1)},${svgHeight} L${getX(0)},${svgHeight} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full block">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[1200, 1600, 2100].map(val => {
        const y = getY(val);
        if (y < 4 || y > svgHeight - 4) return null;
        return (
          <g key={val}>
            <line x1="0" y1={y} x2={svgWidth} y2={y} className="stroke-slate-200 dark:stroke-slate-800/80" strokeWidth="1" strokeDasharray="4 4" />
            <text x="4" y={y - 4} className="text-[10px] fill-slate-400 dark:fill-slate-500 font-sans font-semibold tracking-wide">{val}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} className="fill-none stroke-orange-500" strokeWidth="1.5" />
      {history.map((entry, idx) => (
        <circle key={idx} cx={getX(idx)} cy={getY(entry.rating_after)} r="3.5" className="fill-white dark:fill-[#0d1117] stroke-orange-500 hover:fill-orange-500 transition-colors cursor-pointer" strokeWidth="1.5">
          <title>{`${entry.rating_after} (${entry.rating_change > 0 ? "+" : ""}${entry.rating_change}) · Rank ${entry.final_rank}`}</title>
        </circle>
      ))}
    </svg>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRatingColor = (r) => {
  if (!r || r < 1200) return "#94a3b8";
  if (r <= 1399) return "#10b981";
  if (r <= 1599) return "#14b8a6";
  if (r <= 1899) return "#3b82f6";
  if (r <= 2099) return "#d946ef";
  if (r <= 2399) return "#f97316";
  return "#ef4444";
};

const getMilitaryRank = (r) => {
  if (!r || r < 1200) return "Newbie";
  if (r <= 1399) return "Pupil";
  if (r <= 1599) return "Specialist";
  if (r <= 1899) return "Expert";
  if (r <= 2099) return "Candidate Master";
  if (r <= 2399) return "Master";
  return "Grandmaster";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ color, icon: Icon, children }) => (
  <div className="flex items-center gap-2.5 mb-4 px-1">
    <div className="p-1.5 rounded-[3px] shadow-sm" style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` }}>
      <Icon size={14} strokeWidth={2.5} />
    </div>
    {/* Heading: Mono */}
    <span className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-slate-800 dark:text-slate-200">
      {children}
    </span>
  </div>
);

const EmptyRow = ({ cols, text }) => (
  <tr>
    <td colSpan={cols} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-sans text-[13px] font-semibold tracking-wide bg-white dark:bg-[#0d1117]">
      {text}
    </td>
  </tr>
);

const TableShell = ({ head, children }) => (
  <div className="bg-white w-full dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
    <div className="overflow-x-auto w-full custom-scrollbar">
      <table className="w-full border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22]/50">
            {head.map((h, i) => (
              <th key={i} className={`px-5 py-3 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase ${h.center ? "text-center" : "text-left"}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);

const Chip = ({ children, className }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] font-sans text-[11px] font-bold uppercase tracking-wide border ${className || "bg-slate-100 dark:bg-[#050608] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"}`}>
    {children}
  </span>
);

const Btn = ({ onClick, variant = "ghost", children }) => {
  // Base style uses sans
  const baseStyle = "font-sans text-[12px] font-bold tracking-wider rounded-[3px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase select-none";
  
  const variants = {
    primary: "bg-orange-500 text-white px-5 py-2 hover:bg-orange-600 shadow-sm border border-orange-500",
    ghost: "bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-orange-500 dark:hover:text-orange-500 hover:border-orange-500 dark:hover:border-orange-500",
    live: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/30 px-5 py-2 hover:bg-red-100 dark:hover:bg-red-500/20",
    danger: "bg-transparent text-red-500 hover:text-red-600 dark:hover:text-red-400 py-1.5 px-3 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20",
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]}`}>
      {children}
    </button>
  );
};

const InputField = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {/* Label: Heading Mono */}
    <label className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.15em] uppercase">
      {label}
    </label>
    {/* Input: Sans */}
    <input 
      {...props} 
      className="w-full bg-white dark:bg-[#050608] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-[3px] px-3 py-2 text-[13px] font-sans font-medium outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Contests() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]     = useState(null);
  const [history, setHistory] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [running, setRunning]   = useState([]);
  const [past, setPast]         = useState([]);
  const [loading, setLoading]   = useState(true);

  const [form, setForm] = useState({ name:"", start_time:"", end_time:"", problems:"", writers:"", token:"" });

  async function loadArenaData(silent = true) {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/arena-dashboard');
      const data = res.data;
      setUpcoming(data.upcoming); setRunning(data.running);
      setPast(data.past); setStats(data.stats); setHistory(data.history);
    } catch (err) { console.error("Arena Data Sync Failed:", err); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (!authLoading && user) loadArenaData(false); }, [authLoading, user]);
  useEffect(() => { if (!authLoading && !user) navigate("/auth?error=sign_in_to_view_contests"); }, [authLoading, user, navigate]);

  async function register(id) {
    try { await api.post(`/contests/${id}/register`); loadArenaData(); }
    catch { alert("Failed to register."); }
  }
  async function unregister(id) {
    if (!window.confirm("Cancel your registration?")) return;
    try { await api.post(`/contests/${id}/unregister`); loadArenaData(); }
    catch { alert("Failed to unregister."); }
  }
  async function createContest(e) {
    e.preventDefault();
    try {
      await api.post("/contests", {
        name: form.name,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : "",
        end_time:   form.end_time   ? new Date(form.end_time).toISOString()   : "",
        problems: form.problems.split(",").map(x => Number(x.trim())),
        writers:  form.writers.split(",").map(x => x.trim()),
        token: form.token,
      });
      setForm({ name:"", start_time:"", end_time:"", problems:"", writers:"", token:"" });
      loadArenaData();
    } catch (err) { alert(err.response?.data?.error || "Failed to create contest"); }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (authLoading || loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050608] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
      <span className="relative z-10 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] animate-pulse uppercase">
        Fetching Contest Data...
      </span>
    </div>
  );

  const rColor = getRatingColor(stats?.contest_rating);

  function getRankCol(s) {
    if (s == null || s > 3) return "dark:text-white text-slate-700";
    if (s == 1) return "text-yellow-600";
    if (s == 2) return "text-slate-400"; // Silver
    return "text-amber-700"; // Bronze
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      <div className="relative min-h-[calc(100vh-56px)] w-full bg-slate-100 dark:bg-[#050608] text-slate-800 dark:text-slate-200 py-8 px-4 sm:px-6 transition-colors duration-300 overflow-hidden">
        
        {/* Widescreen IDE Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8">
          
          {/* Main Hero Header */}
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 rounded-[3px] border border-orange-200 dark:border-orange-500/30 shadow-sm">
                <Trophy size={28} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
                  Algorhythm Contests
                </h1>
                <p className="font-sans text-[13px] font-medium text-slate-500 tracking-wide mt-1">
                  Compete, Rank Up, and Test Your Skills
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Rating</span>
                <span className="font-sans text-2xl font-bold" style={{ color: rColor }}>
                  {stats?.contest_rating || 0}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contests</span>
                <span className="font-sans text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.contests_participated || 0}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">AC Rate</span>
                <span className="font-sans text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.contest_acceptance_rate || 0}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Rank</span>
                <span className={`font-sans text-2xl font-bold ${getRankCol(stats?.contest_global_rank)}`}>
                  {stats?.contest_global_rank || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <main className="flex-1 min-w-0 flex flex-col gap-10">

              {/* ONGOING */}
              <section>
                <SectionLabel color="#ef4444" icon={Swords}>
                  Ongoing Contests
                </SectionLabel>
                <TableShell head={[
                  {label:"Contest"},{label:"Start"},{label:"Duration",center:true},{label:"Ends In",center:true},{label:"Action",center:true}
                ]}>
                  {running.length === 0
                    ? <EmptyRow cols={5} text="No Ongoing Contests" />
                    : running.map(c => (
                      <tr key={c.id} onClick={() => navigate(`/contests/${c.id}/problems`)} className="transition-colors group odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-[#0d1117]/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer">
                        <td className="px-5 py-4 relative">
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-red-500" />
                          <div className="font-sans text-[14px] font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                            {c.name}
                          </div>
                          <div className="flex items-center gap-1.5 font-sans text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                            <Users size={12} /> {c.participants || 0} Registered
                          </div>
                        </td>
                        <td className="px-5 py-4 font-sans text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                          {formatIST(c.start_time)}
                        </td>
                        <td className="px-5 py-4 text-center font-sans text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                          {formatDuration(c.duration_minutes)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex px-3 py-1 rounded-[3px] bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-500 font-bold shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                            <CountdownTimer targetDateStr={c.end_time} format="full" onComplete={loadArenaData} />
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {c.is_registered
                            ? <Btn onClick={(e) => { e.stopPropagation(); navigate(`/contests/${c.id}/problems`); }} variant="live">ENTER <ChevronRight size={14} /></Btn>
                            : <Btn onClick={(e) => { e.stopPropagation(); register(c.id); }} variant="primary">REGISTER</Btn>}
                        </td>
                      </tr>
                    ))}
                </TableShell>
              </section>

              {/* UPCOMING */}
              <section>
                <SectionLabel color="#3b82f6" icon={Clock}>
                  Scheduled Contests
                </SectionLabel>
                <TableShell head={[
                  {label:"Contest"},{label:"Start"},{label:"Duration",center:true},{label:"Starts In",center:true},{label:"Action",center:true}
                ]}>
                  {upcoming.length === 0
                    ? <EmptyRow cols={5} text="No Scheduled Contests" />
                    : upcoming.map(c => (
                      <tr key={c.id} className="transition-colors group odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-[#0d1117]/60 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                        <td className="px-5 py-4 relative">
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="font-sans text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                            {c.name}
                          </div>
                          <div className="flex items-center gap-1.5 font-sans text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                            <Users size={12} /> {c.participants || 0} Registered
                          </div>
                        </td>
                        <td className="px-5 py-4 font-sans text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                          {formatIST(c.start_time)}
                        </td>
                        <td className="px-5 py-4 text-center font-sans text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                          {formatDuration(c.duration_minutes)}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-600 dark:text-slate-400">
                          <CountdownTimer targetDateStr={c.start_time} format="days" onComplete={loadArenaData} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          {c.is_registered
                            ? <div className="flex flex-col items-center gap-2">
                                <Chip className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/30">
                                  <CheckCircle2 size={14} /> REGISTERED
                                </Chip>
                                <Btn onClick={() => unregister(c.id)} variant="danger"><XCircle size={12} /> REVOKE</Btn>
                              </div>
                            : <Btn onClick={() => register(c.id)} variant="ghost">REGISTER</Btn>}
                        </td>
                      </tr>
                    ))}
                </TableShell>
              </section>

              {/* PAST */}
              <section>
                <SectionLabel color="#64748b" icon={History}>
                  Contest Archive
                </SectionLabel>
                <TableShell head={[{label:"Contest"},{label:"Start"},{label:"Duration",center:true},{label:"Participants",center:true}]}>
                  {past.length === 0
                    ? <EmptyRow cols={4} text="No Archive History" />
                    : past.map(c => (
                      <tr key={c.id} className="transition-colors group odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-[#0d1117]/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer" onClick={() => navigate(`/contests/${c.id}`)}>
                        <td className="px-5 py-4 relative">
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-slate-400 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="font-sans text-[14px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                            {c.name}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-sans text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                          {formatIST(c.start_time)}
                        </td>
                        <td className="px-5 py-4 text-center font-sans text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                          {formatDuration(c.duration_minutes)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Chip>
                            <Users size={14} className="opacity-70" /> {c.participants || 0}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                </TableShell>
              </section>
            </main>

            {/* ── SIDEBAR ── */}
            <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">

              {/* RATING CARD */}
              <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex items-center gap-2">
                  <TerminalSquare size={14} className="text-orange-500" />
                  <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-[0.15em] uppercase">
                    User Profile
                  </span>
                </div>
                
                <div className="p-5 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-[#050608] px-4 py-2.5 rounded-[3px] border border-slate-200 dark:border-slate-800">
                      <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Handle</span>
                      <span className="font-sans text-[15px] font-bold" style={{ color: rColor }}>
                        {user.username}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-[#050608] px-4 py-2.5 rounded-[3px] border border-slate-200 dark:border-slate-800">
                        <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Title</span>
                        <span className="font-sans text-[13px] font-bold" style={{ color: rColor }}>
                          {stats?.is_banned ? "BANNED" : getMilitaryRank(stats?.contest_rating)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-[#050608] px-4 py-2.5 rounded-[3px] border border-slate-200 dark:border-slate-800">
                        <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Rating</span>
                        <span className="font-sans text-[14px] font-bold" style={{ color: rColor }}>
                          {stats?.contest_rating || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[150px] w-full bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden flex items-center justify-center p-2 shadow-inner">
                    <RatingGraph history={history} />
                  </div>
                </div>
              </div>

              {/* RULES */}
              <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex items-center gap-2">
                  <ShieldAlert size={14} className="text-orange-500" />
                  <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-[0.15em] uppercase">
                    General Rules
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {[
                    ["Scoring Matrix", "Rank by solved count. Ties broken by cumulative penalty (+5m per incorrect attempt)."],
                    ["Zero Tolerance", "Plagiarism, multiple accounts, or AI assistance results in a permanent platform ban."],
                    ["Information Lockdown", "No discussion of problem logic, hints, or code until the arena timer reaches zero."],
                  ].map(([title, body], i) => (
                    <div key={title} className="border-l-2 border-slate-300 dark:border-slate-700 pl-3.5">
                      <div className="font-sans text-[12px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <span className="text-orange-500">[{i+1}]</span> {title}
                      </div>
                      <div className="font-sans text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{body}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADMIN PANEL */}
              {user && (user.role === "owner" || user.role === "moderator") && (
                <div className="bg-white dark:bg-[#0d1117] border border-orange-500/30 rounded-[3px] flex flex-col overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                  <div className="px-5 py-3.5 border-b border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 flex items-center gap-2">
                    <TerminalSquare size={14} className="text-orange-600 dark:text-orange-500" />
                    <span className="font-mono text-[10px] font-bold text-orange-700 dark:text-orange-500 tracking-[0.15em] uppercase">
                      Schedule Contest
                    </span>
                  </div>
                  <div className="p-5">
                    <form onSubmit={createContest} className="flex flex-col gap-5">
                      <InputField label="Contest Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Div. 2 Round 1" />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Start Time" required type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                        <InputField label="End Time"   required type="datetime-local" value={form.end_time}   onChange={e => setForm({...form, end_time: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Writers (CSV)" required value={form.writers} onChange={e => setForm({...form, writers: e.target.value})} placeholder="u1, u2" />
                        <InputField label="Problems (CSV)" required value={form.problems} onChange={e => setForm({...form, problems: e.target.value})} placeholder="1, 4, 7" />
                      </div>
                      {user.role === "moderator" && (
                        <InputField label="Creation Token" required value={form.token} onChange={e => setForm({...form, token: e.target.value})} placeholder="TOKEN_76" />
                      )}
                      <button type="submit" className="w-full bg-orange-500 text-white border border-orange-500 rounded-[3px] p-3 font-sans text-[13px] font-bold tracking-wide uppercase cursor-pointer mt-2 hover:bg-orange-600 transition-all shadow-sm">
                        Schedule Contest
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </aside>
          </div>
        </div>
      </div>
    </>
  );
}