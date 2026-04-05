import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

  /* =========================
      Auth redirect & logic
  ========================= */
  const altitudePath = useMemo(() => {
    if (history.length === 0) return "M0,45 L120,45"; // Default flat line
    if (history.length === 1) {
      const y = 60 - ((history[0].rating_after / 3000) * 50 + 5);
      return `M0,${y} L120,${y}`;
    }

    // Map history ratings to SVG coordinates (ViewBox 120x60)
    // Ratings usually range between 800 and 3000.
    // normalize them so the line fits nicely in the HUD.
    const widthPerPoint = 120 / (history.length - 1 || 1);

    const points = history.map((entry, i) => {
      const x = i * widthPerPoint;
      // Inverse Y: Higher rating = lower Y value in SVG
      const y = 60 - ((entry.rating_after / 3000) * 50 + 5);
      return `${x},${y}`;
    });

    return `M${points.join(" L")}`;
  }, [history]);

  const getMilitaryRank = (rating) => {
    if (!rating || rating < 1200) return "Trainee";
    if (rating >= 1200 && rating <= 1399) return "Soldier";
    if (rating >= 1400 && rating <= 1599) return "Lieutenant";
    if (rating >= 1600 && rating <= 1799) return "Colonel";
    if (rating >= 1800 && rating <= 1999) return "Brigadier";
    if (rating >= 2000 && rating <= 2499) return "Major General";
    return "Commander-in-Chief"; // 2500+
  };

  async function loadArenaData() {
    setLoading(true);
    try {
      // Parallel fetch for Contests and User HUD Stats
      const [u, r, p, userStats, userHistory] = await Promise.all([
        api.get("/contests?status=upcoming"),
        api.get("/contests?status=running"),
        api.get("/contests?status=past"),
        api.get(`/users/${user.id}/contest-stats`),
        api.get(`/users/${user.id}/contest-rating-history`),
      ]);

      setUpcoming(u.data);
      setRunning(r.data);
      setPast(p.data.slice(-5));
      setStats(userStats.data);
      setHistory(userHistory.data.history);

      // Handle Registration Status
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

  /* =========================
      Load contests
  ========================= */
  async function loadContests() {
    setLoading(true);

    const [u, r, p] = await Promise.all([
      api.get("/contests?status=upcoming"),
      api.get("/contests?status=running"),
      api.get("/contests?status=past"),
    ]);

    setUpcoming(u.data);
    setRunning(r.data);
    setPast(p.data.slice(p.data.length - 5)); // last 5 only

    const all = [...u.data, ...r.data];
    const status = {};

    for (const c of all) {
      const res = await api.get(`/contests/${c.id}/registration-status`);
      status[c.id] = res.data.registered;
    }

    setRegistered(status);
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadContests();
    }
  }, [authLoading, user]);

  /* =========================
      Register
  ========================= */
  async function register(contestId) {
    await api.post(`/contests/${contestId}/register`);
    alert("Registered successfully");
    loadContests();
  }

  /* =========================
      Create contest
  ========================= */
  async function createContest(e) {
    e.preventDefault();

    await api.post("/contests", {
      name: form.name,
      start_time: form.start_time,
      end_time: form.end_time,
      duration_minutes: Number(form.duration_minutes),
      problems: form.problems.split(",").map((x) => Number(x.trim())),
    });

    alert("Contest created");
    setForm({
      name: "",
      start_time: "",
      end_time: "",
      duration_minutes: "",
      problems: "",
    });

    loadContests();
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
          </div>
          <div className="text-center">
            <h3 className="text-slate-900 dark:text-white font-bold tracking-tight uppercase">
              {authLoading ? "Authenticating" : "Loading Arena"}
            </h3>
            <p className="text-sm font-medium text-blue-500 dark:text-blue-400 mt-1 animate-pulse uppercase tracking-widest">
              Initializing Protocols...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        
        {/* --- HERO HEADER --- */}
        <header className="mb-16 relative">
          <div className="absolute -left-4 top-0 w-1.5 h-16 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">
            CONTEST <span className="text-blue-600 dark:text-blue-500 uppercase">Arena</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-[0.3em] mt-2 ml-1 transition-colors">
            Algorhythm Contest Engine v2.0
          </p>
        </header>

        {/* --- CREATE CONTEST (ADMIN) --- */}
        <section className="mb-20 relative p-1 rounded-[3rem] bg-gradient-to-tr from-blue-400 to-sky-200 dark:from-blue-600 dark:to-blue-900 overflow-hidden shadow-2xl shadow-blue-500/20 dark:shadow-none transition-all duration-300">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[2.9rem] p-8 md:p-10 lg:p-14 transition-colors">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/3">
                <span className="inline-block bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-6 shadow-md shadow-blue-500/20">
                  Admin Command Center
                </span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase leading-tight tracking-tight transition-colors">
                  Launch New
                  <br />
                  <span className="text-blue-600 dark:text-blue-500">Contest</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs leading-relaxed uppercase tracking-tight opacity-80 italic transition-colors">
                  Authorized personnel only. Trespassers will be shot. Ensure all
                  problem IDs are synced with the database before deployment.
                </p>
              </div>

              <div className="lg:w-2/3">
                <form
                  onSubmit={createContest}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-2">
                    <input
                      className="w-full bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white shadow-inner dark:shadow-none"
                      placeholder="Contest name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="ml-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
                      Start Time
                    </span>
                    <input
                      type="datetime-local"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-900 dark:text-white shadow-inner dark:shadow-none"
                      value={form.start_time}
                      onChange={(e) =>
                        setForm({ ...form, start_time: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="ml-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
                      End Time
                    </span>
                    <input
                      type="datetime-local"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-900 dark:text-white shadow-inner dark:shadow-none"
                      value={form.end_time}
                      onChange={(e) =>
                        setForm({ ...form, end_time: e.target.value })
                      }
                    />
                  </div>

                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white shadow-inner dark:shadow-none"
                    placeholder="Duration (minutes)"
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({ ...form, duration_minutes: e.target.value })
                    }
                  />

                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white shadow-inner dark:shadow-none"
                    placeholder="Problem IDs (1,2,3)"
                    value={form.problems}
                    onChange={(e) =>
                      setForm({ ...form, problems: e.target.value })
                    }
                  />

                  <button className="md:col-span-2 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/20 dark:shadow-none dark:hover:shadow-blue-500/20 uppercase tracking-widest text-sm mt-2 transform active:scale-[0.98]">
                    Initialize Deployment Sequence
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Profile Card */}
          <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl shadow-slate-900/20 dark:shadow-none relative overflow-hidden group transition-colors duration-300">
            <div className="relative flex items-center gap-6 z-10">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center p-1 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full rounded-[1.4rem] bg-slate-900 dark:bg-slate-950 flex items-center justify-center font-black text-3xl text-white italic tracking-tighter">
                  {user.username?.substring(0, 1).toUpperCase()}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight truncate">
                    {user.username}
                  </h3>
                </div>

                <p className="text-blue-400 font-black text-[11px] md:text-xs uppercase tracking-[0.2em] mb-4">
                  RANK:{" "}
                  {stats?.is_banned ? (
                    <span className="text-rose-500">TERMINATED</span>
                  ) : (
                    getMilitaryRank(stats?.contest_rating)
                  )}
                </p>

                <div className="flex flex-wrap gap-2">
                  {!stats?.is_banned ? (
                    <>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                        GLOBAL RANK: {stats?.contest_global_rank || "---"}
                      </span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                        MISSIONS: {stats?.contests_solved || 0}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                        GLOBAL RANK: None
                      </span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                        MISSIONS: None
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Tactical Altitude Graph (Live History) */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm group h-full min-h-[180px] transition-colors duration-300">
            <div className="relative z-20 p-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
                  Rating Altitude
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none transition-colors">
                  {stats?.contest_rating || 0}
                </span> 
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 italic transition-colors">(max. 1200)</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase mt-2 leading-none transition-colors">
                {history.length > 0
                  ? `↑ ${history[history.length - 1].rating_change} Gain`
                  : ""}
              </p>
            </div>

            {/* GRAPH LAYER */}
            <svg
              viewBox="0 0 120 60"
              className="w-full h-full absolute inset-0 z-10"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Shaded Area */}
              <path
                d={`${altitudePath} L120,60 L0,60 Z`}
                fill="url(#altitudeGradient)"
                className="transition-all duration-1000"
              />
              
              {/* Stroke */}
              <path
                d={altitudePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="0.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* Efficiency Card (Live Stats) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
                Kill Efficiency
              </span>
              <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div>
              <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter transition-colors">
                {stats?.contest_acceptance_rate || "0.0"}%
              </span>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden transition-colors duration-300">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000"
                  style={{ width: `${stats?.contest_acceptance_rate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* --- ONGOING SECTION --- */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black flex items-center gap-3 italic text-slate-900 dark:text-white uppercase transition-colors tracking-tight">
              <span className="flex h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse"></span>
              Live Missions
            </h2>
            <div className="h-px flex-grow mx-4 md:mx-8 bg-slate-200 dark:bg-slate-800 transition-colors"></div>
          </div>

          {running.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl transition-colors bg-white/50 dark:bg-slate-900/50">
              No active deployments detected.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {running.map((c) => (
                <div
                  key={c.id}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-lg hover:shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
                >
                  <div className="relative z-10">
                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-5 inline-block shadow-sm">
                      Realtime Active
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-8 max-w-sm leading-tight tracking-tight transition-colors">
                      {c.name}
                    </h3>
                    {registered[c.id] ? (
                      <button
                        onClick={() => navigate(`/contests/${c.id}/problems`)}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs"
                      >
                        Enter Arena
                      </button>
                    ) : (
                      <button
                        onClick={() => register(c.id)}
                        disabled={stats?.is_banned}
                        className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:border-blue-600 hover:text-white font-black px-10 py-4 rounded-xl transition-all uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enlist Now
                      </button>
                    )}
                  </div>
                  {/* Decorative background element */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-50 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-100 dark:group-hover:bg-blue-500/10 transition-colors"></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- UPCOMING SECTION --- */}
        <section className="mb-24">
          <h2 className="text-xl font-black mb-8 text-slate-400 dark:text-slate-500 italic uppercase tracking-tight transition-colors">
            Scheduled Ops
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-lg hover:border-blue-200 dark:hover:border-slate-700 transition-all group"
              >
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight transition-colors">
                  {c.name}
                </h3>
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-8 flex items-center gap-2 tracking-wider transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {new Date(c.start_time).toLocaleString()}
                </p>
                {registered[c.id] ? (
                  <div className="w-full py-3.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl font-black text-[10px] text-center uppercase tracking-[0.2em] border border-emerald-200 dark:border-emerald-500/20 transition-colors">
                    Ready for deployment
                  </div>
                ) : (
                  <button
                    onClick={() => register(c.id)}
                    className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 font-black rounded-xl transition-all text-[10px] uppercase tracking-[0.2em] active:scale-95"
                  >
                    Join Mission
                  </button>
                )}
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="col-span-full py-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  No future operations scheduled.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* --- PAST SECTION --- */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 whitespace-nowrap transition-colors">
              Historical Logs
            </span>
            <div className="h-px flex-grow bg-slate-200 dark:bg-slate-800 transition-colors"></div>
          </div>
          <div className="flex flex-wrap gap-4">
            {past.length === 0 ? (
               <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">No data available.</p>
            ) : past.map((c) => (
              <div
                key={c.id}
                className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between min-w-[280px] shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-slate-700 transition-all group cursor-pointer active:scale-95"
                onClick={() => navigate(`/contests/${c.id}`)}
              >
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                    {c.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 tracking-wider uppercase transition-colors">
                    Concluded: {new Date(c.end_time).toLocaleDateString()}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            ))}
          </div>
        </section>

        {/* --- ENGAGEMENT PROTOCOLS (RULES) --- */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter transition-colors">
              Engagement Protocols
            </h2>
            <div className="h-px flex-grow bg-slate-200 dark:bg-slate-800 transition-colors"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rule 1: Format */}
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-500/20">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-3 tracking-tight transition-colors">
                Standard Loadout
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight transition-colors">
                Each official operation consists of exactly{" "}
                <span className="text-blue-600 dark:text-blue-400 font-black">
                  4 algorithmic challenges
                </span>{" "}
                of varying difficulty.
              </p>
            </div>

            {/* Rule 2: Penalty */}
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-500/20">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-3 tracking-tight transition-colors">
                Penalty Logic
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight transition-colors">
                Ranking is based on solved count. Ties are settled by time
                penalty:{" "}
                <span className="text-amber-500 dark:text-amber-400 font-black">10 mins</span> added
                per failed submission.
              </p>
            </div>

            {/* Rule 3: Cheating */}
            <div className="p-8 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-[2rem] shadow-sm transition-colors">
              <div className="w-10 h-10 bg-rose-500 dark:bg-rose-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase mb-3 tracking-tight transition-colors">
                Protocol Zero
              </h3>
              <p className="text-xs font-bold text-rose-600/80 dark:text-rose-400/80 leading-relaxed uppercase tracking-tight italic transition-colors">
                Any detected plagiarism or external assistance will result in an{" "}
                <span className="text-rose-700 dark:text-rose-400 font-black">
                  immediate and permanent ban
                </span>{" "}
                from the Arena.
              </p>
            </div>

            {/* Rule 4: Comms */}
            <div className="p-8 bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-[2rem] shadow-xl transition-colors">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 text-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-black text-white uppercase mb-3 tracking-tight">
                Comms Blackout
              </h3>
              <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                Solution disclosure is prohibited until the mission timer reaches{" "}
                <span className="text-blue-400 font-black">zero</span>. Maintain
                total operational silence.
              </p>
            </div>
            
          </div>
        </section>

        <footer className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 text-center opacity-40 transition-colors">
          <p className="text-[9px] font-black uppercase tracking-[1.5em] text-slate-900 dark:text-white">
            Algorhythm Contest Engine
          </p>
        </footer>
      </div>
    </div>
  );
}