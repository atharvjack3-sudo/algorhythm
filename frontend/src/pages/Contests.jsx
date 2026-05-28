import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ─── Helpers (unchanged) ──────────────────────────────────────────────────────

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

// ─── Countdown Timer (unchanged logic) ───────────────────────────────────────

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

  return <span className="font-mono">{timeLeft}</span>;
};

// ─── Rating Graph (unchanged logic) ───────────────────────────────────────────

const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-[11px] font-mono tracking-wider">
        NO RATED CONTESTS
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
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[1200, 1600, 2100].map(val => {
        const y = getY(val);
        if (y < 4 || y > svgHeight - 4) return null;
        return (
          <g key={val}>
            <line x1="0" y1={y} x2={svgWidth} y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
            <text x="4" y={y - 3} className="text-[7px] fill-slate-500 dark:fill-slate-400 font-mono">{val}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} className="fill-none stroke-amber-500" strokeWidth="1.5" />
      {history.map((entry, idx) => (
        <circle key={idx} cx={getX(idx)} cy={getY(entry.rating_after)} r="3" className="fill-white dark:fill-slate-900 stroke-amber-500" strokeWidth="1.5">
          <title>{`${entry.rating_after} (${entry.rating_change > 0 ? "+" : ""}${entry.rating_change}) · rank ${entry.final_rank}`}</title>
        </circle>
      ))}
    </svg>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRatingColor = (r) => {
  if (!r || r < 1200) return "#94a3b8";
  if (r <= 1399) return "#22c55e";
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

const SectionLabel = ({ color, children }) => (
  <div className="flex items-center gap-2.5 mb-3.5">
    <span 
      className="inline-block w-[3px] h-[14px] rounded-sm" 
      style={{ background: color, boxShadow: `0 0 8px ${color}88` }} 
    />
    <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
      {children}
    </span>
  </div>
);

const EmptyRow = ({ cols, text }) => (
  <tr>
    <td colSpan={cols} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs tracking-[0.06em]">
      {text}
    </td>
  </tr>
);

const TableShell = ({ head, children }) => (
  <div className="bg-white w-full dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {head.map((h, i) => (
              <th key={i} className={`px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase ${h.center ? "text-center" : "text-left"}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </div>
);

const Chip = ({ children, className }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-[3px] font-mono text-[11px] font-medium ${className || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
    {children}
  </span>
);

const Btn = ({ onClick, variant = "ghost", children }) => {
  const baseStyle = "font-mono text-[11px] font-semibold tracking-[0.06em] rounded transition-all duration-150 cursor-pointer";
  
  const variants = {
    primary: "bg-amber-500 text-slate-950 px-3.5 py-1.5 hover:opacity-85",
    ghost: "bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800",
    live: "bg-transparent text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60 px-3.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30",
    danger: "bg-transparent text-red-500 hover:text-red-600 dark:hover:text-red-400 py-0.5 px-0 text-[10px]",
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]}`}>
      {children}
    </button>
  );
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.08em] uppercase mb-1.5">
      {label}
    </label>
    <input 
      {...props} 
      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors box-border"
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
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [authLoading, user, navigate]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse">
        LOADING ARENA...
      </span>
    </div>
  );

  const rColor = getRatingColor(stats?.contest_rating);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 flex-wrap">

          {/* ── MAIN COLUMN ── */}
          <div className="flex-1 min-w-0 max-w-full flex flex-col gap-10">

            {/* ONGOING */}
            <section>
              <SectionLabel color="#ef4444">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse shadow-[0_0_6px_#ef4444]" />
                Ongoing
              </SectionLabel>
              <TableShell head={[
                {label:"Contest"},{label:"Start"},{label:"Duration",center:true},{label:"Ends In",center:true},{label:"",center:true}
              ]}>
                {running.length === 0
                  ? <EmptyRow cols={5} text="no active contests" />
                  : running.map(c => (
                    <tr key={c.id} className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div
                          onClick={() => navigate(`/contests/${c.id}/problems`)}
                          className="font-sans text-[13px] font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                        >{c.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {c.participants || 0} registered
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {formatIST(c.start_time)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {formatDuration(c.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-red-500 font-semibold">
                          <CountdownTimer targetDateStr={c.end_time} format="full" onComplete={loadArenaData} />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.is_registered
                          ? <Btn onClick={() => navigate(`/contests/${c.id}/problems`)} variant="live">ENTER ↗</Btn>
                          : <Btn onClick={() => register(c.id)} variant="ghost">Register</Btn>}
                      </td>
                    </tr>
                  ))}
              </TableShell>
            </section>

            {/* UPCOMING */}
            <section>
              <SectionLabel color="#3b82f6">Upcoming</SectionLabel>
              <TableShell head={[
                {label:"Contest"},{label:"Start"},{label:"Duration",center:true},{label:"Starts In",center:true},{label:"",center:true}
              ]}>
                {upcoming.length === 0
                  ? <EmptyRow cols={5} text="no upcoming contests" />
                  : upcoming.map(c => (
                    <tr key={c.id} className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {c.participants || 0} registered
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {formatIST(c.start_time)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {formatDuration(c.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                        <CountdownTimer targetDateStr={c.start_time} format="days" onComplete={loadArenaData} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.is_registered
                          ? <div className="flex flex-col items-center gap-1">
                              <Chip className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500">✓ Registered</Chip>
                              <Btn onClick={() => unregister(c.id)} variant="danger">cancel</Btn>
                            </div>
                          : <Btn onClick={() => register(c.id)} variant="ghost">Register</Btn>}
                      </td>
                    </tr>
                  ))}
              </TableShell>
            </section>

            {/* PAST */}
            <section>
              <SectionLabel color="#94a3b8">Past</SectionLabel>
              <TableShell head={[{label:"Contest"},{label:"Start"},{label:"Duration",center:true},{label:"Participants",center:true}]}>
                {past.length === 0
                  ? <EmptyRow cols={4} text="— no history —" />
                  : past.map(c => (
                    <tr key={c.id} className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <span
                          onClick={() => navigate(`/contests/${c.id}`)}
                          className="font-sans text-[13px] font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >{c.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-500">
                        {formatIST(c.start_time)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-500">
                        {formatDuration(c.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Chip>{c.participants || 0}</Chip>
                      </td>
                    </tr>
                  ))}
              </TableShell>
            </section>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-5">

            {/* RATING CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">Rating</span>
              </div>
              <div className="p-4">
                <div className="mb-4">

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Handle</span>
                      <span className="font-mono text-sm font-bold" style={{ color: rColor }}>
                        {user.username}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Rank</span>
                      <span className="font-mono text-xs font-semibold" style={{ color: rColor }}>
                        {stats?.is_banned ? "BANNED" : getMilitaryRank(stats?.contest_rating)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Rating</span>
                      <span className="font-mono text-sm font-semibold" style={{ color: rColor }}>
                        {stats?.contest_rating || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-[130px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <RatingGraph history={history} />
                </div>
              </div>
            </div>

            {/* ADMIN PANEL */}
            {user && (user.role === "owner" || user.role === "moderator") && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">Deploy Contest</span>
                </div>
                <div className="p-4">
                  <form onSubmit={createContest} className="flex flex-col gap-3">
                    <InputField label="Contest Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Div. 2 Round 1" />
                    <InputField label="Start Time" required type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                    <InputField label="End Time"   required type="datetime-local" value={form.end_time}   onChange={e => setForm({...form, end_time: e.target.value})} />
                    <div className="flex gap-2">
                      <InputField label="Writers (CSV)" required value={form.writers} onChange={e => setForm({...form, writers: e.target.value})} placeholder="u1, u2" />
                      <InputField label="Problems (CSV)" required value={form.problems} onChange={e => setForm({...form, problems: e.target.value})} placeholder="1, 4, 7" />
                    </div>
                    {user.role === "moderator" && (
                      <InputField label="Creation Token" required value={form.token} onChange={e => setForm({...form, token: e.target.value})} placeholder="TOKEN_76" />
                    )}
                    <button type="submit" className="dark:bg-orange-500 bg-blue-300 text-slate-950 border-none rounded p-2.5 font-mono text-[11px] font-bold tracking-[0.12em] cursor-pointer mt-1 hover:opacity-85 transition-opacity">
                      SCHEDULE →
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* RULES */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">Rules</span>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                {[
                  ["Scoring", "Rank by solved count. Ties broken by penalty (5m per wrong attempt)."],
                  ["Integrity", "Cheating = permanent ban. Zero tolerance enforced."],
                  ["Silence", "No solution discussion until the round timer hits zero."],
                ].map(([title, body]) => (
                  <div key={title} className="border-l-2 border-slate-300 dark:border-slate-700 pl-2.5">
                    <div className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-[0.08em] mb-1">{title}</div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{body}</div>
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